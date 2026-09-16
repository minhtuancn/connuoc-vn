import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:connuoc_viet/core/network/api_failure.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/public_data/data/http_public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

String fixtureText(String name) {
  return File('test/fixtures/public_api/$name.json').readAsStringSync();
}

AppConfig testConfig() {
  return AppConfig(apiBaseUrl: Uri.parse('https://api.example.test'));
}

http.Response fixtureResponse(
  String name, {
  int statusCode = 200,
  String cacheControl = 'public, max-age=60, stale-while-revalidate=120',
  String contentType = 'application/json',
}) {
  return http.Response(
    fixtureText(name),
    statusCode,
    headers: {'content-type': contentType, 'cache-control': cacheControl},
  );
}

class AbortAwareClient extends http.BaseClient {
  int calls = 0;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    calls += 1;
    if (request is! http.Abortable || request.abortTrigger == null) {
      throw StateError('Expected an abortable request with an abort trigger.');
    }
    await request.abortTrigger;
    throw http.RequestAbortedException(request.url);
  }
}

void main() {
  final fetchedAt = DateTime.utc(2026, 9, 16, 8, 30);

  test('search encodes query/cursor and preserves cache freshness', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return fixtureResponse('search');
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      clock: () => fetchedAt,
    );

    final resource = await repository.searchLocations(
      SearchLocationsRequest(
        query: 'Ninh Bình & biển',
        limit: 7,
        cursor: 'abc+/',
      ),
    );

    expect(captured.method, 'GET');
    expect(captured.url.path, '/v1/locations/search');
    expect(captured.url.queryParameters['q'], 'Ninh Bình & biển');
    expect(captured.url.queryParameters['limit'], '7');
    expect(captured.url.queryParameters['cursor'], 'abc+/');
    expect(captured.headers.containsKey('authorization'), isFalse);
    expect(resource.value.items.single.id, 'public-api-station');
    expect(resource.fetchedAtUtc, fetchedAt);
    expect(resource.cachePolicy.maxAge, const Duration(seconds: 60));
    expect(
      resource.cachePolicy.staleWhileRevalidate,
      const Duration(seconds: 120),
    );
  });

  test('station path segment is URI encoded and response is typed', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return fixtureResponse('station');
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      clock: () => fetchedAt,
    );

    final resource = await repository.getStation('station/with space');

    expect(captured.url.pathSegments.last, 'station/with space');
    expect(resource.value.provenance?.sourceKey, 'public-api-fixture');
  });

  test('tide sends UTC range and interval without recalculation', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return fixtureResponse('tide');
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      clock: () => fetchedAt,
    );

    final resource = await repository.getTide(
      TideRequest(
        stationId: 'public-api-station',
        startUtc: DateTime.utc(2026, 1, 1),
        endUtc: DateTime.utc(2026, 1, 1, 2),
        intervalSeconds: 3600,
      ),
    );

    expect(captured.url.path, '/v1/stations/public-api-station/tide');
    expect(
      captured.url.queryParameters['start'],
      DateTime.utc(2026, 1, 1).toIso8601String(),
    );
    expect(
      captured.url.queryParameters['end'],
      DateTime.utc(2026, 1, 1, 2).toIso8601String(),
    );
    expect(captured.url.queryParameters['intervalSeconds'], '3600');
    expect(resource.value.points.first.value, 1.5);
  });

  test('water levels propagate optional range, limit, and cursor', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return fixtureResponse('water_levels');
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      clock: () => fetchedAt,
    );

    final resource = await repository.getWaterLevels(
      WaterLevelRequest(
        stationId: 'public-api-station',
        startUtc: DateTime.utc(2026, 9, 15),
        endUtc: DateTime.utc(2026, 9, 15, 2),
        limit: 1,
        cursor: 'next cursor',
      ),
    );

    expect(captured.url.path, '/v1/stations/public-api-station/water-level');
    expect(captured.url.queryParameters['limit'], '1');
    expect(captured.url.queryParameters['cursor'], 'next cursor');
    expect(resource.value.items.single.unit, WaterLevelUnit.cm);
  });

  test('calendar formats Gregorian date as YYYY-MM-DD', () async {
    late http.Request captured;
    final client = MockClient((request) async {
      captured = request;
      return fixtureResponse('calendar');
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      clock: () => fetchedAt,
    );

    final resource = await repository.getCalendar(
      const CalendarRequest(date: CalendarDate(year: 2024, month: 2, day: 10)),
    );

    expect(captured.url.path, '/v1/calendar');
    expect(captured.url.queryParameters['date'], '2024-02-10');
    expect(resource.value.lunarDate.day, 1);
  });

  test('404 problem details map to typed not-found failure', () async {
    final client = MockClient((request) async {
      return fixtureResponse(
        'problem_404',
        statusCode: 404,
        contentType: 'application/problem+json',
      );
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
    );

    await expectLater(
      repository.getStation('missing-station'),
      throwsA(
        isA<ApiFailure>()
            .having((failure) => failure.kind, 'kind', ApiFailureKind.notFound)
            .having((failure) => failure.statusCode, 'statusCode', 404)
            .having(
              (failure) => failure.problem?.detail,
              'problem.detail',
              "Station 'missing-station' was not found.",
            ),
      ),
    );
  });

  test('503 is surfaced once with no automatic retry', () async {
    var calls = 0;
    final client = MockClient((request) async {
      calls += 1;
      return http.Response('temporarily unavailable', 503);
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
    );

    await expectLater(
      repository.getStation('station-a'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.unavailable,
        ),
      ),
    );
    expect(calls, 1);
  });

  test('malformed success body maps to malformedResponse', () async {
    final client = MockClient((request) async {
      return http.Response(jsonEncode({'name': 42}), 200);
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
    );

    await expectLater(
      repository.getStation('station-a'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.malformedResponse,
        ),
      ),
    );
  });

  test('client exception maps to network failure', () async {
    final client = MockClient((request) async {
      throw http.ClientException('offline', request.url);
    });
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
    );

    await expectLater(
      repository.getStation('station-a'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.network,
        ),
      ),
    );
  });

  test('caller cancellation aborts request and maps to cancelled', () async {
    final client = AbortAwareClient();
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      requestTimeout: const Duration(seconds: 5),
    );
    final cancellation = RequestCancellation();

    final future = repository.getStation(
      'station-a',
      cancellation: cancellation,
    );
    await Future<void>.delayed(Duration.zero);
    cancellation.cancel();

    await expectLater(
      future,
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.cancelled,
        ),
      ),
    );
    expect(client.calls, 1);
  });

  test('request timeout aborts request and maps to timeout', () async {
    final client = AbortAwareClient();
    final repository = HttpPublicDataRepository(
      config: testConfig(),
      client: client,
      requestTimeout: const Duration(milliseconds: 5),
    );

    await expectLater(
      repository.getStation('station-a'),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.timeout,
        ),
      ),
    );
    expect(client.calls, 1);
  });
}
