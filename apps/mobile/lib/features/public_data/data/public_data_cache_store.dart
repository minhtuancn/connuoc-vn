import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';

abstract interface class PublicDataCacheStore {
  Future<RemoteResource<LocationSearchPage>?> getSearch(
    SearchLocationsRequest request,
  );

  Future<void> putSearch(
    SearchLocationsRequest request,
    RemoteResource<LocationSearchPage> resource,
  );

  Future<RemoteResource<StationDetails>?> getStation(String stationId);

  Future<void> putStation(RemoteResource<StationDetails> resource);

  Future<RemoteResource<TideSeries>?> getTide(TideRequest request);

  Future<void> putTide(
    TideRequest request,
    RemoteResource<TideSeries> resource,
  );

  Future<RemoteResource<WaterLevelPage>?> getWaterLevels(
    WaterLevelRequest request,
  );

  Future<void> putWaterLevels(
    WaterLevelRequest request,
    RemoteResource<WaterLevelPage> resource,
  );

  Future<RemoteResource<CalendarDay>?> getCalendar(CalendarRequest request);

  Future<void> putCalendar(
    CalendarRequest request,
    RemoteResource<CalendarDay> resource,
  );
}
