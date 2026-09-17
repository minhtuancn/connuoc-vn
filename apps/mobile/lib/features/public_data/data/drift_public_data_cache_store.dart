import 'package:connuoc_viet/core/database/app_database.dart' as local;
import 'package:connuoc_viet/core/database/cache_key.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/features/public_data/data/public_data_cache_store.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart'
    as domain;
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:drift/drift.dart' as drift;

class DriftPublicDataCacheStore implements PublicDataCacheStore {
  DriftPublicDataCacheStore(this._database);

  final local.AppDatabase _database;

  @override
  Future<RemoteResource<domain.StationDetails>?> getStation(
    String stationId,
  ) async {
    cacheKeyForStation(stationId);
    final id = stationId.trim();
    final station = await (_database.select(
      _database.stations,
    )..where((table) => table.id.equals(id))).getSingleOrNull();
    if (station == null || station.detailGeneratedAtUtc == null) {
      return null;
    }

    final cache = await (_database.select(
      _database.stationDetailCaches,
    )..where((table) => table.stationId.equals(id))).getSingleOrNull();
    if (cache == null) {
      return null;
    }

    return _remoteResource(
      value: domain.StationDetails(
        id: station.id,
        name: station.name,
        stationType: station.stationType,
        timeZone: station.timeZone,
        location: domain.GeoPoint(
          latitude: station.latitude,
          longitude: station.longitude,
        ),
        aliases: await _aliasesForStation(id),
        defaultDatumId: station.defaultDatumId,
        provenance: _stationProvenance(station),
        meta: domain.StationMeta(
          generatedAtUtc: station.detailGeneratedAtUtc!.toUtc(),
        ),
      ),
      fetchedAtUtc: cache.fetchedAtUtc,
      maxAgeSeconds: cache.maxAgeSeconds,
      staleWhileRevalidateSeconds: cache.staleWhileRevalidateSeconds,
    );
  }

  @override
  Future<void> putStation(RemoteResource<domain.StationDetails> resource) {
    final station = resource.value;
    final provenance = station.provenance;
    return _database.transaction(() async {
      await _database
          .into(_database.stations)
          .insertOnConflictUpdate(
            local.StationsCompanion.insert(
              id: station.id,
              name: station.name,
              stationType: station.stationType,
              timeZone: station.timeZone,
              latitude: station.location.latitude,
              longitude: station.location.longitude,
              defaultDatumId: drift.Value(station.defaultDatumId),
              detailGeneratedAtUtc: drift.Value(
                station.meta.generatedAtUtc.toUtc(),
              ),
              provenanceSourceKey: drift.Value(provenance?.sourceKey),
              provenanceImportRunId: drift.Value(provenance?.importRunId),
              provenanceRawChecksumSha256: drift.Value(
                provenance?.rawChecksumSha256,
              ),
              provenanceParserVersion: drift.Value(provenance?.parserVersion),
              provenanceNormalizerVersion: drift.Value(
                provenance?.normalizerVersion,
              ),
              provenanceObservedAtUtc: drift.Value(
                provenance?.observedAtUtc.toUtc(),
              ),
              localUpdatedAtUtc: resource.fetchedAtUtc.toUtc(),
            ),
          );
      await _replaceAliases(station.id, station.aliases);
      await _database
          .into(_database.stationDetailCaches)
          .insertOnConflictUpdate(
            local.StationDetailCachesCompanion.insert(
              stationId: station.id,
              fetchedAtUtc: resource.fetchedAtUtc.toUtc(),
              maxAgeSeconds: resource.cachePolicy.maxAge.inSeconds,
              staleWhileRevalidateSeconds:
                  resource.cachePolicy.staleWhileRevalidate.inSeconds,
            ),
          );
    });
  }

  @override
  Future<RemoteResource<domain.LocationSearchPage>?> getSearch(
    SearchLocationsRequest request,
  ) async {
    final key = cacheKeyForSearch(request);
    final page = await (_database.select(
      _database.locationSearchPages,
    )..where((table) => table.cacheKey.equals(key))).getSingleOrNull();
    if (page == null) {
      return null;
    }

    final pageItems = await (_database.select(
      _database.locationSearchPageItems,
    )..where((table) => table.cacheKey.equals(key))).get();
    pageItems.sort((a, b) => a.ordinal.compareTo(b.ordinal));

    final items = <domain.LocationSummary>[];
    for (final item in pageItems) {
      final station = await (_database.select(
        _database.stations,
      )..where((table) => table.id.equals(item.stationId))).getSingleOrNull();
      if (station == null) {
        return null;
      }
      items.add(
        domain.LocationSummary(
          id: station.id,
          name: station.name,
          stationType: station.stationType,
          timeZone: station.timeZone,
          location: domain.GeoPoint(
            latitude: station.latitude,
            longitude: station.longitude,
          ),
          aliases: await _aliasesForStation(station.id),
        ),
      );
    }

    return _remoteResource(
      value: domain.LocationSearchPage(
        items: List.unmodifiable(items),
        meta: domain.SearchPageMeta(
          generatedAtUtc: page.generatedAtUtc.toUtc(),
          nextCursor: page.nextCursor,
        ),
      ),
      fetchedAtUtc: page.fetchedAtUtc,
      maxAgeSeconds: page.maxAgeSeconds,
      staleWhileRevalidateSeconds: page.staleWhileRevalidateSeconds,
    );
  }

  @override
  Future<void> putSearch(
    SearchLocationsRequest request,
    RemoteResource<domain.LocationSearchPage> resource,
  ) {
    final key = cacheKeyForSearch(request);
    return _database.transaction(() async {
      for (final item in resource.value.items) {
        await _upsertSearchStation(item, resource.fetchedAtUtc);
      }

      await (_database.delete(
        _database.locationSearchPageItems,
      )..where((table) => table.cacheKey.equals(key))).go();
      await _database
          .into(_database.locationSearchPages)
          .insertOnConflictUpdate(
            local.LocationSearchPagesCompanion.insert(
              cacheKey: key,
              query: request.query,
              limit: request.limit,
              cursor: drift.Value(request.cursor),
              generatedAtUtc: resource.value.meta.generatedAtUtc.toUtc(),
              nextCursor: drift.Value(resource.value.meta.nextCursor),
              fetchedAtUtc: resource.fetchedAtUtc.toUtc(),
              maxAgeSeconds: resource.cachePolicy.maxAge.inSeconds,
              staleWhileRevalidateSeconds:
                  resource.cachePolicy.staleWhileRevalidate.inSeconds,
            ),
          );

      for (final (index, item) in resource.value.items.indexed) {
        await _database
            .into(_database.locationSearchPageItems)
            .insert(
              local.LocationSearchPageItemsCompanion.insert(
                cacheKey: key,
                ordinal: index,
                stationId: item.id,
              ),
            );
      }
    });
  }

  @override
  Future<RemoteResource<domain.TideSeries>?> getTide(
    TideRequest request,
  ) async {
    final key = cacheKeyForTide(request);
    final series = await (_database.select(
      _database.tideSeries,
    )..where((table) => table.cacheKey.equals(key))).getSingleOrNull();
    if (series == null) {
      return null;
    }

    final pointRows = await (_database.select(
      _database.tidePoints,
    )..where((table) => table.seriesKey.equals(key))).get();
    pointRows.sort((a, b) => a.timestampUtc.compareTo(b.timestampUtc));

    return _remoteResource(
      value: domain.TideSeries(
        stationId: series.stationId,
        startUtc: series.startUtc.toUtc(),
        endUtc: series.endUtc.toUtc(),
        intervalSeconds: series.intervalSeconds,
        points: List.unmodifiable(
          pointRows.map(
            (point) => domain.TidePoint(
              timestampUtc: point.timestampUtc.toUtc(),
              value: point.value,
            ),
          ),
        ),
        generatedAtUtc: series.generatedAtUtc.toUtc(),
        modelId: series.modelId,
        modelVersion: series.modelVersion,
        datumId: series.datumId,
        unit: _unitFromWire(series.unit),
        timeZone: series.timeZone,
        phaseConvention: _phaseFromWire(series.phaseConvention),
        referenceEpochUtc: series.referenceEpochUtc.toUtc(),
        constituentCount: series.constituentCount,
        provenance: domain.ModelProvenance(
          sourceKey: series.provenanceSourceKey,
          importRunId: series.provenanceImportRunId,
        ),
      ),
      fetchedAtUtc: series.fetchedAtUtc,
      maxAgeSeconds: series.maxAgeSeconds,
      staleWhileRevalidateSeconds: series.staleWhileRevalidateSeconds,
    );
  }

  @override
  Future<void> putTide(
    TideRequest request,
    RemoteResource<domain.TideSeries> resource,
  ) {
    final key = cacheKeyForTide(request);
    final series = resource.value;
    return _database.transaction(() async {
      await (_database.delete(
        _database.tidePoints,
      )..where((table) => table.seriesKey.equals(key))).go();
      await _database
          .into(_database.tideSeries)
          .insertOnConflictUpdate(
            local.TideSeriesCompanion.insert(
              cacheKey: key,
              stationId: series.stationId,
              startUtc: series.startUtc.toUtc(),
              endUtc: series.endUtc.toUtc(),
              intervalSeconds: series.intervalSeconds,
              modelId: series.modelId,
              modelVersion: drift.Value(series.modelVersion),
              datumId: series.datumId,
              unit: _unitToWire(series.unit),
              timeZone: series.timeZone,
              phaseConvention: _phaseToWire(series.phaseConvention),
              referenceEpochUtc: series.referenceEpochUtc.toUtc(),
              constituentCount: series.constituentCount,
              provenanceSourceKey: drift.Value(series.provenance.sourceKey),
              provenanceImportRunId: drift.Value(series.provenance.importRunId),
              generatedAtUtc: series.generatedAtUtc.toUtc(),
              fetchedAtUtc: resource.fetchedAtUtc.toUtc(),
              maxAgeSeconds: resource.cachePolicy.maxAge.inSeconds,
              staleWhileRevalidateSeconds:
                  resource.cachePolicy.staleWhileRevalidate.inSeconds,
            ),
          );
      for (final point in series.points) {
        await _database
            .into(_database.tidePoints)
            .insert(
              local.TidePointsCompanion.insert(
                seriesKey: key,
                timestampUtc: point.timestampUtc.toUtc(),
                value: point.value,
              ),
            );
      }
    });
  }

  @override
  Future<RemoteResource<domain.WaterLevelPage>?> getWaterLevels(
    WaterLevelRequest request,
  ) async {
    final key = cacheKeyForWaterLevels(request);
    final page = await (_database.select(
      _database.waterLevelPages,
    )..where((table) => table.cacheKey.equals(key))).getSingleOrNull();
    if (page == null) {
      return null;
    }

    final itemRows = await (_database.select(
      _database.waterLevelPageItems,
    )..where((table) => table.pageKey.equals(key))).get();
    itemRows.sort((a, b) => a.ordinal.compareTo(b.ordinal));

    final observations = <domain.WaterLevelObservation>[];
    for (final item in itemRows) {
      final observation =
          await (_database.select(_database.waterLevelObservations)..where(
                (table) =>
                    table.stationId.equals(item.stationId) &
                    table.sourceRecordKey.equals(item.sourceRecordKey),
              ))
              .getSingleOrNull();
      if (observation == null) {
        return null;
      }
      observations.add(_waterObservationFromRow(observation));
    }

    return _remoteResource(
      value: domain.WaterLevelPage(
        station: domain.WaterLevelStation(
          id: page.stationId,
          name: page.stationName,
          timeZone: page.timeZone,
          defaultDatumId: page.defaultDatumId,
        ),
        items: List.unmodifiable(observations),
        meta: domain.WaterLevelPageMeta(
          generatedAtUtc: page.generatedAtUtc.toUtc(),
          latestObservedAtUtc: page.latestObservedAtUtc?.toUtc(),
          nextCursor: page.nextCursor,
        ),
      ),
      fetchedAtUtc: page.fetchedAtUtc,
      maxAgeSeconds: page.maxAgeSeconds,
      staleWhileRevalidateSeconds: page.staleWhileRevalidateSeconds,
    );
  }

  @override
  Future<void> putWaterLevels(
    WaterLevelRequest request,
    RemoteResource<domain.WaterLevelPage> resource,
  ) {
    final key = cacheKeyForWaterLevels(request);
    final page = resource.value;
    return _database.transaction(() async {
      await (_database.delete(
        _database.waterLevelPageItems,
      )..where((table) => table.pageKey.equals(key))).go();
      await _database
          .into(_database.waterLevelPages)
          .insertOnConflictUpdate(
            local.WaterLevelPagesCompanion.insert(
              cacheKey: key,
              stationId: page.station.id,
              stationName: page.station.name,
              timeZone: page.station.timeZone,
              defaultDatumId: drift.Value(page.station.defaultDatumId),
              startUtc: drift.Value(request.startUtc?.toUtc()),
              endUtc: drift.Value(request.endUtc?.toUtc()),
              limit: request.limit,
              cursor: drift.Value(request.cursor),
              generatedAtUtc: page.meta.generatedAtUtc.toUtc(),
              latestObservedAtUtc: drift.Value(
                page.meta.latestObservedAtUtc?.toUtc(),
              ),
              nextCursor: drift.Value(page.meta.nextCursor),
              fetchedAtUtc: resource.fetchedAtUtc.toUtc(),
              maxAgeSeconds: resource.cachePolicy.maxAge.inSeconds,
              staleWhileRevalidateSeconds:
                  resource.cachePolicy.staleWhileRevalidate.inSeconds,
            ),
          );

      for (final (index, observation) in page.items.indexed) {
        final provenance = observation.provenance;
        await _database
            .into(_database.waterLevelObservations)
            .insertOnConflictUpdate(
              local.WaterLevelObservationsCompanion.insert(
                stationId: page.station.id,
                sourceRecordKey: observation.sourceRecordKey,
                observedAtUtc: observation.observedAtUtc.toUtc(),
                value: observation.value,
                unit: _unitToWire(observation.unit),
                datumId: drift.Value(observation.datumId),
                qualityState: _qualityToWire(observation.qualityState),
                provenanceSourceKey: provenance.sourceKey,
                provenanceImportRunId: provenance.importRunId,
                rawChecksumSha256: provenance.rawChecksumSha256,
                parserVersion: provenance.parserVersion,
                normalizerVersion: provenance.normalizerVersion,
                provenanceObservedAtUtc: provenance.observedAtUtc.toUtc(),
              ),
            );
        await _database
            .into(_database.waterLevelPageItems)
            .insert(
              local.WaterLevelPageItemsCompanion.insert(
                pageKey: key,
                ordinal: index,
                stationId: page.station.id,
                sourceRecordKey: observation.sourceRecordKey,
              ),
            );
      }
    });
  }

  @override
  Future<RemoteResource<domain.CalendarDay>?> getCalendar(
    CalendarRequest request,
  ) async {
    final key = cacheKeyForCalendar(request);
    final day = await (_database.select(
      _database.calendarDays,
    )..where((table) => table.cacheKey.equals(key))).getSingleOrNull();
    if (day == null) {
      return null;
    }

    return _remoteResource(
      value: domain.CalendarDay(
        solarDate: domain.CalendarDate(
          year: day.solarYear,
          month: day.solarMonth,
          day: day.solarDay,
        ),
        lunarDate: domain.LunarCalendarDate(
          year: day.lunarYear,
          month: day.lunarMonth,
          day: day.lunarDay,
          isLeapMonth: day.isLeapMonth,
        ),
        timeZone: day.timeZone,
        generatedAtUtc: day.generatedAtUtc.toUtc(),
      ),
      fetchedAtUtc: day.fetchedAtUtc,
      maxAgeSeconds: day.maxAgeSeconds,
      staleWhileRevalidateSeconds: day.staleWhileRevalidateSeconds,
    );
  }

  @override
  Future<void> putCalendar(
    CalendarRequest request,
    RemoteResource<domain.CalendarDay> resource,
  ) async {
    final key = cacheKeyForCalendar(request);
    final day = resource.value;
    await _database
        .into(_database.calendarDays)
        .insertOnConflictUpdate(
          local.CalendarDaysCompanion.insert(
            cacheKey: key,
            solarYear: day.solarDate.year,
            solarMonth: day.solarDate.month,
            solarDay: day.solarDate.day,
            lunarYear: day.lunarDate.year,
            lunarMonth: day.lunarDate.month,
            lunarDay: day.lunarDate.day,
            isLeapMonth: day.lunarDate.isLeapMonth,
            timeZone: day.timeZone,
            generatedAtUtc: day.generatedAtUtc.toUtc(),
            fetchedAtUtc: resource.fetchedAtUtc.toUtc(),
            maxAgeSeconds: resource.cachePolicy.maxAge.inSeconds,
            staleWhileRevalidateSeconds:
                resource.cachePolicy.staleWhileRevalidate.inSeconds,
          ),
        );
  }

  Future<void> _upsertSearchStation(
    domain.LocationSummary station,
    DateTime fetchedAtUtc,
  ) async {
    final existing = await (_database.select(
      _database.stations,
    )..where((table) => table.id.equals(station.id))).getSingleOrNull();
    await _database
        .into(_database.stations)
        .insertOnConflictUpdate(
          local.StationsCompanion.insert(
            id: station.id,
            name: station.name,
            stationType: station.stationType,
            timeZone: station.timeZone,
            latitude: station.location.latitude,
            longitude: station.location.longitude,
            defaultDatumId: drift.Value(existing?.defaultDatumId),
            detailGeneratedAtUtc: drift.Value(existing?.detailGeneratedAtUtc),
            provenanceSourceKey: drift.Value(existing?.provenanceSourceKey),
            provenanceImportRunId: drift.Value(existing?.provenanceImportRunId),
            provenanceRawChecksumSha256: drift.Value(
              existing?.provenanceRawChecksumSha256,
            ),
            provenanceParserVersion: drift.Value(
              existing?.provenanceParserVersion,
            ),
            provenanceNormalizerVersion: drift.Value(
              existing?.provenanceNormalizerVersion,
            ),
            provenanceObservedAtUtc: drift.Value(
              existing?.provenanceObservedAtUtc,
            ),
            localUpdatedAtUtc: fetchedAtUtc.toUtc(),
          ),
        );
    await _replaceAliases(station.id, station.aliases);
  }

  Future<void> _replaceAliases(String stationId, List<String> aliases) async {
    await (_database.delete(
      _database.stationAliases,
    )..where((table) => table.stationId.equals(stationId))).go();
    for (final alias in aliases) {
      await _database
          .into(_database.stationAliases)
          .insertOnConflictUpdate(
            local.StationAliasesCompanion.insert(
              stationId: stationId,
              alias: alias,
            ),
          );
    }
  }

  Future<List<String>> _aliasesForStation(String stationId) async {
    final rows = await (_database.select(
      _database.stationAliases,
    )..where((table) => table.stationId.equals(stationId))).get();
    rows.sort((a, b) => a.alias.compareTo(b.alias));
    return List.unmodifiable(rows.map((row) => row.alias));
  }

  domain.ObservationProvenance? _stationProvenance(local.Station station) {
    if (station.provenanceSourceKey == null) {
      return null;
    }
    return domain.ObservationProvenance(
      sourceKey: station.provenanceSourceKey!,
      importRunId: _requireCacheField(
        station.provenanceImportRunId,
        'stations.provenanceImportRunId',
      ),
      rawChecksumSha256: _requireCacheField(
        station.provenanceRawChecksumSha256,
        'stations.provenanceRawChecksumSha256',
      ),
      parserVersion: _requireCacheField(
        station.provenanceParserVersion,
        'stations.provenanceParserVersion',
      ),
      normalizerVersion: _requireCacheField(
        station.provenanceNormalizerVersion,
        'stations.provenanceNormalizerVersion',
      ),
      observedAtUtc: _requireCacheField(
        station.provenanceObservedAtUtc,
        'stations.provenanceObservedAtUtc',
      ).toUtc(),
    );
  }

  domain.WaterLevelObservation _waterObservationFromRow(
    local.WaterLevelObservation observation,
  ) {
    return domain.WaterLevelObservation(
      sourceRecordKey: observation.sourceRecordKey,
      observedAtUtc: observation.observedAtUtc.toUtc(),
      value: observation.value,
      unit: _unitFromWire(observation.unit),
      datumId: observation.datumId,
      qualityState: _qualityFromWire(observation.qualityState),
      provenance: domain.ObservationProvenance(
        sourceKey: observation.provenanceSourceKey,
        importRunId: observation.provenanceImportRunId,
        rawChecksumSha256: observation.rawChecksumSha256,
        parserVersion: observation.parserVersion,
        normalizerVersion: observation.normalizerVersion,
        observedAtUtc: observation.provenanceObservedAtUtc.toUtc(),
      ),
    );
  }

  RemoteResource<T> _remoteResource<T>({
    required T value,
    required DateTime fetchedAtUtc,
    required int maxAgeSeconds,
    required int staleWhileRevalidateSeconds,
  }) {
    return RemoteResource<T>(
      value: value,
      fetchedAtUtc: fetchedAtUtc.toUtc(),
      cachePolicy: CachePolicy(
        maxAge: Duration(seconds: maxAgeSeconds),
        staleWhileRevalidate: Duration(seconds: staleWhileRevalidateSeconds),
      ),
    );
  }

  T _requireCacheField<T>(T? value, String field) {
    if (value == null) {
      throw StateError('Cached resource is missing $field.');
    }
    return value;
  }

  String _unitToWire(domain.WaterLevelUnit unit) => switch (unit) {
    domain.WaterLevelUnit.m => 'm',
    domain.WaterLevelUnit.cm => 'cm',
    domain.WaterLevelUnit.mm => 'mm',
  };

  domain.WaterLevelUnit _unitFromWire(String unit) => switch (unit) {
    'm' => domain.WaterLevelUnit.m,
    'cm' => domain.WaterLevelUnit.cm,
    'mm' => domain.WaterLevelUnit.mm,
    _ => throw StateError('Unsupported cached water-level unit: $unit'),
  };

  String _qualityToWire(domain.QualityState quality) => switch (quality) {
    domain.QualityState.good => 'GOOD',
    domain.QualityState.suspect => 'SUSPECT',
    domain.QualityState.bad => 'BAD',
    domain.QualityState.unknown => 'UNKNOWN',
  };

  domain.QualityState _qualityFromWire(String quality) => switch (quality) {
    'GOOD' => domain.QualityState.good,
    'SUSPECT' => domain.QualityState.suspect,
    'BAD' => domain.QualityState.bad,
    'UNKNOWN' => domain.QualityState.unknown,
    _ => throw StateError('Unsupported cached quality state: $quality'),
  };

  String _phaseToWire(domain.HarmonicPhaseConvention phase) => switch (phase) {
    domain.HarmonicPhaseConvention.cosineLagDegrees => 'cosine_lag_degrees',
    domain.HarmonicPhaseConvention.cosineLeadDegrees => 'cosine_lead_degrees',
  };

  domain.HarmonicPhaseConvention _phaseFromWire(String phase) =>
      switch (phase) {
        'cosine_lag_degrees' => domain.HarmonicPhaseConvention.cosineLagDegrees,
        'cosine_lead_degrees' =>
          domain.HarmonicPhaseConvention.cosineLeadDegrees,
        _ => throw StateError('Unsupported cached phase convention: $phase'),
      };
}
