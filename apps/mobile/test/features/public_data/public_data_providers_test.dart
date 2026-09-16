import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/public_data/data/http_public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/data/public_data_providers.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

class FakePublicDataRepository implements PublicDataRepository {
  @override
  Future<RemoteResource<LocationSearchPage>> searchLocations(
    SearchLocationsRequest request, {
    RequestCancellation? cancellation,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<RemoteResource<StationDetails>> getStation(
    String stationId, {
    RequestCancellation? cancellation,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<RemoteResource<TideSeries>> getTide(
    TideRequest request, {
    RequestCancellation? cancellation,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<RemoteResource<WaterLevelPage>> getWaterLevels(
    WaterLevelRequest request, {
    RequestCancellation? cancellation,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<RemoteResource<CalendarDay>> getCalendar(
    CalendarRequest request, {
    RequestCancellation? cancellation,
  }) {
    throw UnimplementedError();
  }
}

class NoRequestClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw StateError('Constructing providers must not send a request.');
  }
}

void main() {
  test('publicDataRepositoryProvider can be overridden with a fake', () {
    final fake = FakePublicDataRepository();
    final container = ProviderContainer(
      overrides: [publicDataRepositoryProvider.overrideWithValue(fake)],
    );
    addTearDown(container.dispose);

    expect(container.read(publicDataRepositoryProvider), same(fake));
  });

  test(
    'default repository is built from overridden config and HTTP client',
    () {
      final config = AppConfig(
        apiBaseUrl: Uri.parse('https://mobile-api.example.test/base'),
      );
      final client = NoRequestClient();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          httpClientProvider.overrideWithValue(client),
        ],
      );
      addTearDown(container.dispose);

      final repository = container.read(publicDataRepositoryProvider);

      expect(repository, isA<HttpPublicDataRepository>());
      expect((repository as HttpPublicDataRepository).config, same(config));
    },
  );
}
