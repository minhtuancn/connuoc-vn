import 'dart:async';
import 'dart:convert';

import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:connuoc_viet/core/network/api_failure.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/core/network/json_readers.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:http/http.dart' as http;

typedef PublicDataClock = DateTime Function();
typedef JsonParser<T> = T Function(Map<String, Object?> json);

class HttpPublicDataRepository implements PublicDataRepository {
  HttpPublicDataRepository({
    required this.config,
    http.Client? client,
    PublicDataClock? clock,
    Duration requestTimeout = const Duration(seconds: 15),
  }) : _client = client ?? http.Client(),
       _ownsClient = client == null,
       _clock = clock ?? DateTime.now,
       _requestTimeout = requestTimeout {
    if (requestTimeout <= Duration.zero) {
      throw ArgumentError.value(
        requestTimeout,
        'requestTimeout',
        'must be greater than zero',
      );
    }
  }

  final AppConfig config;
  final http.Client _client;
  final bool _ownsClient;
  final PublicDataClock _clock;
  final Duration _requestTimeout;

  @override
  Future<RemoteResource<LocationSearchPage>> searchLocations(
    SearchLocationsRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _get(
      _uri(
        const ['locations', 'search'],
        queryParameters: {
          'q': request.query,
          'limit': request.limit.toString(),
          if (request.cursor != null) 'cursor': request.cursor!,
        },
      ),
      LocationSearchPage.fromJson,
      cancellation: cancellation,
    );
  }

  @override
  Future<RemoteResource<StationDetails>> getStation(
    String stationId, {
    RequestCancellation? cancellation,
  }) {
    final normalizedId = _requireStationId(stationId);
    return _get(
      _uri(['stations', normalizedId]),
      StationDetails.fromJson,
      cancellation: cancellation,
    );
  }

  @override
  Future<RemoteResource<TideSeries>> getTide(
    TideRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _get(
      _uri(
        ['stations', request.stationId, 'tide'],
        queryParameters: {
          'start': request.startUtc.toIso8601String(),
          'end': request.endUtc.toIso8601String(),
          'intervalSeconds': request.intervalSeconds.toString(),
        },
      ),
      TideSeries.fromJson,
      cancellation: cancellation,
    );
  }

  @override
  Future<RemoteResource<WaterLevelPage>> getWaterLevels(
    WaterLevelRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _get(
      _uri(
        ['stations', request.stationId, 'water-level'],
        queryParameters: {
          if (request.startUtc != null)
            'start': request.startUtc!.toIso8601String(),
          if (request.endUtc != null) 'end': request.endUtc!.toIso8601String(),
          'limit': request.limit.toString(),
          if (request.cursor != null) 'cursor': request.cursor!,
        },
      ),
      WaterLevelPage.fromJson,
      cancellation: cancellation,
    );
  }

  @override
  Future<RemoteResource<CalendarDay>> getCalendar(
    CalendarRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _get(
      _uri(
        const ['calendar'],
        queryParameters: {'date': _formatCalendarDate(request.date)},
      ),
      CalendarDay.fromJson,
      cancellation: cancellation,
    );
  }

  void close() {
    if (_ownsClient) {
      _client.close();
    }
  }

  Uri _uri(
    List<String> pathSegments, {
    Map<String, String> queryParameters = const {},
  }) {
    return config.apiBaseUrl.replace(
      pathSegments: [
        ...config.apiBaseUrl.pathSegments.where(
          (segment) => segment.isNotEmpty,
        ),
        'v1',
        ...pathSegments,
      ],
      queryParameters: queryParameters,
    );
  }

  Future<RemoteResource<T>> _get<T>(
    Uri uri,
    JsonParser<T> parser, {
    RequestCancellation? cancellation,
  }) async {
    final response = await _send(uri, cancellation: cancellation);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiFailure(
        kind: ApiFailureKind.fromStatusCode(response.statusCode),
        statusCode: response.statusCode,
        problem: _tryParseProblem(response),
      );
    }

    try {
      final decoded = jsonDecode(response.body);
      final value = parser(readObject(decoded, r'$'));
      return RemoteResource<T>(
        value: value,
        fetchedAtUtc: _clock().toUtc(),
        cachePolicy: CachePolicy.parse(response.headers['cache-control']),
      );
    } on JsonContractException catch (error) {
      throw ApiFailure(kind: ApiFailureKind.malformedResponse, cause: error);
    } on FormatException catch (error) {
      throw ApiFailure(kind: ApiFailureKind.malformedResponse, cause: error);
    } on TypeError catch (error) {
      throw ApiFailure(kind: ApiFailureKind.malformedResponse, cause: error);
    }
  }

  Future<http.Response> _send(
    Uri uri, {
    RequestCancellation? cancellation,
  }) async {
    if (cancellation?.isCancelled ?? false) {
      throw const ApiFailure(kind: ApiFailureKind.cancelled);
    }

    final abort = Completer<void>();
    var callerCancelled = false;
    var timedOut = false;

    void completeAbort() {
      if (!abort.isCompleted) {
        abort.complete();
      }
    }

    final request = http.AbortableRequest(
      'GET',
      uri,
      abortTrigger: abort.future,
    );
    request.headers['accept'] = 'application/json, application/problem+json';

    final sendFuture = _client
        .send(request)
        .then<http.Response>(http.Response.fromStream);

    final responseFutures = <Future<http.Response>>[sendFuture];
    if (cancellation != null) {
      responseFutures.add(
        cancellation.whenCancelled.then<http.Response>((_) {
          callerCancelled = true;
          completeAbort();
          throw const ApiFailure(kind: ApiFailureKind.cancelled);
        }),
      );
    }

    try {
      return await Future.any(responseFutures).timeout(
        _requestTimeout,
        onTimeout: () {
          timedOut = true;
          completeAbort();
          throw const ApiFailure(kind: ApiFailureKind.timeout);
        },
      );
    } on ApiFailure {
      rethrow;
    } on http.RequestAbortedException catch (error) {
      if (callerCancelled || (cancellation?.isCancelled ?? false)) {
        throw ApiFailure(kind: ApiFailureKind.cancelled, cause: error);
      }
      if (timedOut) {
        throw ApiFailure(kind: ApiFailureKind.timeout, cause: error);
      }
      throw ApiFailure(kind: ApiFailureKind.network, cause: error);
    } on http.ClientException catch (error) {
      throw ApiFailure(kind: ApiFailureKind.network, cause: error);
    } on Object catch (error) {
      throw ApiFailure(kind: ApiFailureKind.network, cause: error);
    }
  }

  ProblemDetails? _tryParseProblem(http.Response response) {
    final contentType = response.headers['content-type']?.toLowerCase();
    if (contentType == null ||
        !contentType.contains('application/problem+json')) {
      return null;
    }

    try {
      return ProblemDetails.fromJson(
        readObject(jsonDecode(response.body), r'$'),
      );
    } on Object {
      return null;
    }
  }

  String _requireStationId(String stationId) {
    final normalized = stationId.trim();
    if (normalized.isEmpty) {
      throw ArgumentError.value(stationId, 'stationId', 'must not be empty');
    }
    return normalized;
  }

  String _formatCalendarDate(CalendarDate date) {
    final year = date.year.toString().padLeft(4, '0');
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }
}
