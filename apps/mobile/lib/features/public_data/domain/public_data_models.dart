import '../../../core/network/json_readers.dart';

enum WaterLevelUnit { m, cm, mm }

enum QualityState { good, suspect, bad, unknown }

enum HarmonicPhaseConvention { cosineLagDegrees, cosineLeadDegrees }

WaterLevelUnit _readWaterLevelUnit(
  Map<String, Object?> json,
  String key,
  String path,
) {
  return switch (readString(json, key, path)) {
    'm' => WaterLevelUnit.m,
    'cm' => WaterLevelUnit.cm,
    'mm' => WaterLevelUnit.mm,
    final value => throw JsonContractException(
      '$path.$key',
      "unsupported water-level unit '$value'",
    ),
  };
}

QualityState _readQualityState(
  Map<String, Object?> json,
  String key,
  String path,
) {
  return switch (readString(json, key, path)) {
    'GOOD' => QualityState.good,
    'SUSPECT' => QualityState.suspect,
    'BAD' => QualityState.bad,
    'UNKNOWN' => QualityState.unknown,
    final value => throw JsonContractException(
      '$path.$key',
      "unsupported quality state '$value'",
    ),
  };
}

HarmonicPhaseConvention _readPhaseConvention(
  Map<String, Object?> json,
  String key,
  String path,
) {
  return switch (readString(json, key, path)) {
    'cosine_lag_degrees' => HarmonicPhaseConvention.cosineLagDegrees,
    'cosine_lead_degrees' => HarmonicPhaseConvention.cosineLeadDegrees,
    final value => throw JsonContractException(
      '$path.$key',
      "unsupported harmonic phase convention '$value'",
    ),
  };
}

class GeoPoint {
  const GeoPoint({required this.latitude, required this.longitude});

  factory GeoPoint.fromJson(Map<String, Object?> json, {String path = r'$'}) {
    return GeoPoint(
      latitude: readDouble(json, 'latitude', path),
      longitude: readDouble(json, 'longitude', path),
    );
  }

  final double latitude;
  final double longitude;
}

class ObservationProvenance {
  const ObservationProvenance({
    required this.sourceKey,
    required this.importRunId,
    required this.rawChecksumSha256,
    required this.parserVersion,
    required this.normalizerVersion,
    required this.observedAtUtc,
  });

  factory ObservationProvenance.fromJson(
    Map<String, Object?> json, {
    String path = r'$.provenance',
  }) {
    return ObservationProvenance(
      sourceKey: readString(json, 'sourceKey', path),
      importRunId: readString(json, 'importRunId', path),
      rawChecksumSha256: readString(json, 'rawChecksumSha256', path),
      parserVersion: readString(json, 'parserVersion', path),
      normalizerVersion: readString(json, 'normalizerVersion', path),
      observedAtUtc: readInstant(json, 'observedAt', path),
    );
  }

  final String sourceKey;
  final String importRunId;
  final String rawChecksumSha256;
  final String parserVersion;
  final String normalizerVersion;
  final DateTime observedAtUtc;
}

class ModelProvenance {
  const ModelProvenance({required this.sourceKey, required this.importRunId});

  factory ModelProvenance.fromJson(
    Map<String, Object?> json, {
    String path = r'$.meta.provenance',
  }) {
    return ModelProvenance(
      sourceKey: readNullableString(json, 'sourceKey', path),
      importRunId: readNullableString(json, 'importRunId', path),
    );
  }

  final String? sourceKey;
  final String? importRunId;
}

class LocationSummary {
  const LocationSummary({
    required this.id,
    required this.name,
    required this.stationType,
    required this.timeZone,
    required this.location,
    required this.aliases,
  });

  factory LocationSummary.fromJson(
    Map<String, Object?> json, {
    String path = r'$.items[]',
  }) {
    return LocationSummary(
      id: readString(json, 'id', path),
      name: readString(json, 'name', path),
      stationType: readString(json, 'stationType', path),
      timeZone: readString(json, 'timeZone', path),
      location: GeoPoint.fromJson(
        readObject(readRequired(json, 'location', path), '$path.location'),
        path: '$path.location',
      ),
      aliases: readStringList(json, 'aliases', path),
    );
  }

  final String id;
  final String name;
  final String stationType;
  final String timeZone;
  final GeoPoint location;
  final List<String> aliases;
}

class SearchPageMeta {
  const SearchPageMeta({required this.generatedAtUtc, required this.nextCursor});

  factory SearchPageMeta.fromJson(Map<String, Object?> json) {
    return SearchPageMeta(
      generatedAtUtc: readInstant(json, 'generatedAt', r'$.meta'),
      nextCursor: readNullableString(json, 'nextCursor', r'$.meta'),
    );
  }

  final DateTime generatedAtUtc;
  final String? nextCursor;
}

class LocationSearchPage {
  const LocationSearchPage({required this.items, required this.meta});

  factory LocationSearchPage.fromJson(Map<String, Object?> json) {
    final rawItems = readList(readRequired(json, 'items', r'$'), r'$.items');
    return LocationSearchPage(
      items: List<LocationSummary>.unmodifiable(
        rawItems.indexed.map((entry) {
          final (index, value) = entry;
          return LocationSummary.fromJson(
            readObject(value, r'$.items[$index]'),
            path: r'$.items[$index]',
          );
        }),
      ),
      meta: SearchPageMeta.fromJson(
        readObject(readRequired(json, 'meta', r'$'), r'$.meta'),
      ),
    );
  }

  final List<LocationSummary> items;
  final SearchPageMeta meta;
}

class StationMeta {
  const StationMeta({required this.generatedAtUtc});

  factory StationMeta.fromJson(Map<String, Object?> json) {
    return StationMeta(
      generatedAtUtc: readInstant(json, 'generatedAt', r'$.meta'),
    );
  }

  final DateTime generatedAtUtc;
}

class StationDetails {
  const StationDetails({
    required this.id,
    required this.name,
    required this.stationType,
    required this.timeZone,
    required this.location,
    required this.aliases,
    required this.defaultDatumId,
    required this.provenance,
    required this.meta,
  });

  factory StationDetails.fromJson(Map<String, Object?> json) {
    final provenanceValue = readRequired(json, 'provenance', r'$');
    return StationDetails(
      id: readString(json, 'id', r'$'),
      name: readString(json, 'name', r'$'),
      stationType: readString(json, 'stationType', r'$'),
      timeZone: readString(json, 'timeZone', r'$'),
      location: GeoPoint.fromJson(
        readObject(readRequired(json, 'location', r'$'), r'$.location'),
        path: r'$.location',
      ),
      aliases: readStringList(json, 'aliases', r'$'),
      defaultDatumId: readNullableString(json, 'defaultDatumId', r'$'),
      provenance: provenanceValue == null
          ? null
          : ObservationProvenance.fromJson(
              readObject(provenanceValue, r'$.provenance'),
            ),
      meta: StationMeta.fromJson(
        readObject(readRequired(json, 'meta', r'$'), r'$.meta'),
      ),
    );
  }

  final String id;
  final String name;
  final String stationType;
  final String timeZone;
  final GeoPoint location;
  final List<String> aliases;
  final String? defaultDatumId;
  final ObservationProvenance? provenance;
  final StationMeta meta;
}

class WaterLevelStation {
  const WaterLevelStation({
    required this.id,
    required this.name,
    required this.timeZone,
    required this.defaultDatumId,
  });

  factory WaterLevelStation.fromJson(Map<String, Object?> json) {
    return WaterLevelStation(
      id: readString(json, 'id', r'$.station'),
      name: readString(json, 'name', r'$.station'),
      timeZone: readString(json, 'timeZone', r'$.station'),
      defaultDatumId: readNullableString(json, 'defaultDatumId', r'$.station'),
    );
  }

  final String id;
  final String name;
  final String timeZone;
  final String? defaultDatumId;
}

class WaterLevelObservation {
  const WaterLevelObservation({
    required this.sourceRecordKey,
    required this.observedAtUtc,
    required this.value,
    required this.unit,
    required this.datumId,
    required this.qualityState,
    required this.provenance,
  });

  factory WaterLevelObservation.fromJson(
    Map<String, Object?> json, {
    String path = r'$.items[]',
  }) {
    return WaterLevelObservation(
      sourceRecordKey: readString(json, 'sourceRecordKey', path),
      observedAtUtc: readInstant(json, 'observedAt', path),
      value: readDouble(json, 'value', path),
      unit: _readWaterLevelUnit(json, 'unit', path),
      datumId: readNullableString(json, 'datumId', path),
      qualityState: _readQualityState(json, 'qualityState', path),
      provenance: ObservationProvenance.fromJson(
        readObject(
          readRequired(json, 'provenance', path),
          '$path.provenance',
        ),
        path: '$path.provenance',
      ),
    );
  }

  final String sourceRecordKey;
  final DateTime observedAtUtc;
  final double value;
  final WaterLevelUnit unit;
  final String? datumId;
  final QualityState qualityState;
  final ObservationProvenance provenance;
}

class WaterLevelPageMeta {
  const WaterLevelPageMeta({
    required this.generatedAtUtc,
    required this.latestObservedAtUtc,
    required this.nextCursor,
  });

  factory WaterLevelPageMeta.fromJson(Map<String, Object?> json) {
    return WaterLevelPageMeta(
      generatedAtUtc: readInstant(json, 'generatedAt', r'$.meta'),
      latestObservedAtUtc: readNullableInstant(
        json,
        'latestObservedAt',
        r'$.meta',
      ),
      nextCursor: readNullableString(json, 'nextCursor', r'$.meta'),
    );
  }

  final DateTime generatedAtUtc;
  final DateTime? latestObservedAtUtc;
  final String? nextCursor;
}

class WaterLevelPage {
  const WaterLevelPage({
    required this.station,
    required this.items,
    required this.meta,
  });

  factory WaterLevelPage.fromJson(Map<String, Object?> json) {
    final rawItems = readList(readRequired(json, 'items', r'$'), r'$.items');
    return WaterLevelPage(
      station: WaterLevelStation.fromJson(
        readObject(readRequired(json, 'station', r'$'), r'$.station'),
      ),
      items: List<WaterLevelObservation>.unmodifiable(
        rawItems.indexed.map((entry) {
          final (index, value) = entry;
          return WaterLevelObservation.fromJson(
            readObject(value, r'$.items[$index]'),
            path: r'$.items[$index]',
          );
        }),
      ),
      meta: WaterLevelPageMeta.fromJson(
        readObject(readRequired(json, 'meta', r'$'), r'$.meta'),
      ),
    );
  }

  final WaterLevelStation station;
  final List<WaterLevelObservation> items;
  final WaterLevelPageMeta meta;
}

class TidePoint {
  const TidePoint({required this.timestampUtc, required this.value});

  factory TidePoint.fromJson(
    Map<String, Object?> json, {
    String path = r'$.points[]',
  }) {
    return TidePoint(
      timestampUtc: readInstant(json, 'timestampUtc', path),
      value: readDouble(json, 'value', path),
    );
  }

  final DateTime timestampUtc;
  final double value;
}

class TideSeries {
  const TideSeries({
    required this.stationId,
    required this.startUtc,
    required this.endUtc,
    required this.intervalSeconds,
    required this.points,
    required this.generatedAtUtc,
    required this.modelId,
    required this.modelVersion,
    required this.datumId,
    required this.unit,
    required this.timeZone,
    required this.phaseConvention,
    required this.referenceEpochUtc,
    required this.constituentCount,
    required this.provenance,
  });

  factory TideSeries.fromJson(Map<String, Object?> json) {
    final meta = readObject(readRequired(json, 'meta', r'$'), r'$.meta');
    final rawPoints = readList(readRequired(json, 'points', r'$'), r'$.points');
    return TideSeries(
      stationId: readString(json, 'stationId', r'$'),
      startUtc: readInstant(json, 'startUtc', r'$'),
      endUtc: readInstant(json, 'endUtc', r'$'),
      intervalSeconds: readInt(json, 'intervalSeconds', r'$'),
      points: List<TidePoint>.unmodifiable(
        rawPoints.indexed.map((entry) {
          final (index, value) = entry;
          return TidePoint.fromJson(
            readObject(value, r'$.points[$index]'),
            path: r'$.points[$index]',
          );
        }),
      ),
      generatedAtUtc: readInstant(meta, 'generatedAt', r'$.meta'),
      modelId: readString(meta, 'modelId', r'$.meta'),
      modelVersion: readNullableString(meta, 'modelVersion', r'$.meta'),
      datumId: readString(meta, 'datumId', r'$.meta'),
      unit: _readWaterLevelUnit(meta, 'unit', r'$.meta'),
      timeZone: readString(meta, 'timeZone', r'$.meta'),
      phaseConvention: _readPhaseConvention(
        meta,
        'phaseConvention',
        r'$.meta',
      ),
      referenceEpochUtc: readInstant(meta, 'referenceEpochUtc', r'$.meta'),
      constituentCount: readInt(meta, 'constituentCount', r'$.meta'),
      provenance: ModelProvenance.fromJson(
        readObject(
          readRequired(meta, 'provenance', r'$.meta'),
          r'$.meta.provenance',
        ),
      ),
    );
  }

  final String stationId;
  final DateTime startUtc;
  final DateTime endUtc;
  final int intervalSeconds;
  final List<TidePoint> points;
  final DateTime generatedAtUtc;
  final String modelId;
  final String? modelVersion;
  final String datumId;
  final WaterLevelUnit unit;
  final String timeZone;
  final HarmonicPhaseConvention phaseConvention;
  final DateTime referenceEpochUtc;
  final int constituentCount;
  final ModelProvenance provenance;
}

class CalendarDate {
  const CalendarDate({
    required this.year,
    required this.month,
    required this.day,
  });

  factory CalendarDate.fromJson(
    Map<String, Object?> json, {
    String path = r'$.solarDate',
  }) {
    return CalendarDate(
      year: readInt(json, 'year', path),
      month: readInt(json, 'month', path),
      day: readInt(json, 'day', path),
    );
  }

  final int year;
  final int month;
  final int day;

  @override
  bool operator ==(Object other) {
    return other is CalendarDate &&
        other.year == year &&
        other.month == month &&
        other.day == day;
  }

  @override
  int get hashCode => Object.hash(year, month, day);
}

class LunarCalendarDate extends CalendarDate {
  const LunarCalendarDate({
    required super.year,
    required super.month,
    required super.day,
    required this.isLeapMonth,
  });

  factory LunarCalendarDate.fromJson(Map<String, Object?> json) {
    return LunarCalendarDate(
      year: readInt(json, 'year', r'$.lunarDate'),
      month: readInt(json, 'month', r'$.lunarDate'),
      day: readInt(json, 'day', r'$.lunarDate'),
      isLeapMonth: readBool(json, 'isLeapMonth', r'$.lunarDate'),
    );
  }

  final bool isLeapMonth;

  @override
  bool operator ==(Object other) {
    return other is LunarCalendarDate &&
        other.year == year &&
        other.month == month &&
        other.day == day &&
        other.isLeapMonth == isLeapMonth;
  }

  @override
  int get hashCode => Object.hash(year, month, day, isLeapMonth);
}

class CalendarDay {
  const CalendarDay({
    required this.solarDate,
    required this.lunarDate,
    required this.timeZone,
    required this.generatedAtUtc,
  });

  factory CalendarDay.fromJson(Map<String, Object?> json) {
    final meta = readObject(readRequired(json, 'meta', r'$'), r'$.meta');
    return CalendarDay(
      solarDate: CalendarDate.fromJson(
        readObject(readRequired(json, 'solarDate', r'$'), r'$.solarDate'),
      ),
      lunarDate: LunarCalendarDate.fromJson(
        readObject(readRequired(json, 'lunarDate', r'$'), r'$.lunarDate'),
      ),
      timeZone: readString(json, 'timeZone', r'$'),
      generatedAtUtc: readInstant(meta, 'generatedAt', r'$.meta'),
    );
  }

  final CalendarDate solarDate;
  final LunarCalendarDate lunarDate;
  final String timeZone;
  final DateTime generatedAtUtc;
}
