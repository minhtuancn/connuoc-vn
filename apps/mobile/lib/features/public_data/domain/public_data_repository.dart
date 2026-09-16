import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';

abstract interface class PublicDataRepository {
  Future<RemoteResource<LocationSearchPage>> searchLocations(
    SearchLocationsRequest request, {
    RequestCancellation? cancellation,
  });

  Future<RemoteResource<StationDetails>> getStation(
    String stationId, {
    RequestCancellation? cancellation,
  });

  Future<RemoteResource<TideSeries>> getTide(
    TideRequest request, {
    RequestCancellation? cancellation,
  });

  Future<RemoteResource<WaterLevelPage>> getWaterLevels(
    WaterLevelRequest request, {
    RequestCancellation? cancellation,
  });

  Future<RemoteResource<CalendarDay>> getCalendar(
    CalendarRequest request, {
    RequestCancellation? cancellation,
  });
}
