import 'dart:convert';
import 'dart:io';

import 'package:connuoc_viet/core/network/api_failure.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, Object?> problemFixture() {
  final raw = File(
    'test/fixtures/public_api/problem_404.json',
  ).readAsStringSync();
  return (jsonDecode(raw) as Map).cast<String, Object?>();
}

void main() {
  test('parses max-age and stale-while-revalidate cache directives', () {
    final policy = CachePolicy.parse(
      'public, max-age=60, stale-while-revalidate=120',
    );

    expect(policy.maxAge, const Duration(seconds: 60));
    expect(policy.staleWhileRevalidate, const Duration(seconds: 120));
  });

  test('missing cache directives produce zero freshness durations', () {
    final policy = CachePolicy.parse('public');

    expect(policy.maxAge, Duration.zero);
    expect(policy.staleWhileRevalidate, Duration.zero);
  });

  test('parses RFC problem details without dropping server fields', () {
    final problem = ProblemDetails.fromJson(problemFixture());

    expect(problem.type, 'about:blank');
    expect(problem.title, 'Request Failed');
    expect(problem.status, 404);
    expect(problem.detail, "Station 'missing-station' was not found.");
    expect(problem.instance, '/v1/stations/missing-station');
  });

  test('maps known HTTP status codes to stable failure kinds', () {
    expect(ApiFailureKind.fromStatusCode(400), ApiFailureKind.badRequest);
    expect(ApiFailureKind.fromStatusCode(404), ApiFailureKind.notFound);
    expect(ApiFailureKind.fromStatusCode(422), ApiFailureKind.unprocessable);
    expect(ApiFailureKind.fromStatusCode(503), ApiFailureKind.unavailable);
    expect(ApiFailureKind.fromStatusCode(502), ApiFailureKind.server);
    expect(ApiFailureKind.fromStatusCode(418), ApiFailureKind.http);
  });

  test('request cancellation is idempotent and completes once', () async {
    final cancellation = RequestCancellation();
    var completionCount = 0;
    cancellation.whenCancelled.then((_) => completionCount += 1);

    cancellation.cancel();
    cancellation.cancel();
    await cancellation.whenCancelled;
    await Future<void>.delayed(Duration.zero);

    expect(cancellation.isCancelled, isTrue);
    expect(completionCount, 1);
  });

  test('rejects tide ranges whose end precedes start', () {
    expect(
      () => TideRequest(
        stationId: 'station-a',
        startUtc: DateTime.utc(2026, 9, 16, 2),
        endUtc: DateTime.utc(2026, 9, 16, 1),
        intervalSeconds: 900,
      ),
      throwsArgumentError,
    );
  });

  test('rejects empty searches and non-positive pagination limits', () {
    expect(
      () => SearchLocationsRequest(query: '  ', limit: 20),
      throwsArgumentError,
    );
    expect(
      () => SearchLocationsRequest(query: 'Ninh Binh', limit: 0),
      throwsArgumentError,
    );
  });

  test('remote resource retains fetch time and parsed cache policy', () {
    final fetchedAt = DateTime.utc(2026, 9, 16, 8);
    const policy = CachePolicy(
      maxAge: Duration(seconds: 60),
      staleWhileRevalidate: Duration(seconds: 120),
    );
    final resource = RemoteResource<String>(
      value: 'payload',
      fetchedAtUtc: fetchedAt,
      cachePolicy: policy,
    );

    expect(resource.value, 'payload');
    expect(resource.fetchedAtUtc, fetchedAt);
    expect(resource.cachePolicy, policy);
  });
}
