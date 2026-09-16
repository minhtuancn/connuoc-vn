import 'dart:convert';
import 'dart:io';

import 'package:connuoc_viet/core/network/json_readers.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, Object?> fixture(String name) {
  final raw = File('test/fixtures/public_api/$name.json').readAsStringSync();
  return (jsonDecode(raw) as Map).cast<String, Object?>();
}

void main() {
  test('parses search page and preserves cursor/freshness metadata', () {
    final page = LocationSearchPage.fromJson(fixture('search'));

    expect(page.items.single.id, 'public-api-station');
    expect(page.items.single.location.latitude, 20.25);
    expect(page.items.single.aliases, ['Tram thu nghiem']);
    expect(page.meta.nextCursor, 'eyJvZmZzZXQiOjF9');
    expect(page.meta.generatedAtUtc, DateTime.parse('2026-09-15T02:00:00Z'));
  });

  test('parses station with complete ingestion provenance', () {
    final station = StationDetails.fromJson(fixture('station'));

    expect(station.defaultDatumId, 'local-gauge-fixture');
    expect(station.provenance?.sourceKey, 'public-api-fixture');
    expect(
      station.provenance?.rawChecksumSha256,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    );
    expect(station.provenance?.parserVersion, 'fixture-parser@1');
    expect(
      station.provenance?.observedAtUtc,
      DateTime.parse('2026-09-15T01:00:00Z'),
    );
  });

  test('parses water levels without dropping datum, quality, or provenance', () {
    final page = WaterLevelPage.fromJson(fixture('water_levels'));
    final observation = page.items.single;

    expect(page.station.defaultDatumId, 'local-gauge-fixture');
    expect(observation.value, 130.2);
    expect(observation.unit, WaterLevelUnit.cm);
    expect(observation.qualityState, QualityState.good);
    expect(observation.datumId, 'local-gauge-fixture');
    expect(observation.provenance.importRunId, isNotEmpty);
    expect(observation.provenance.normalizerVersion, 'fixture-normalizer@1');
    expect(page.meta.nextCursor, 'eyJvZmZzZXQiOjF9');
    expect(
      page.meta.latestObservedAtUtc,
      DateTime.parse('2026-09-15T01:00:00Z'),
    );
  });

  test('parses tide model provenance and UTC points without recalculating them', () {
    final tide = TideSeries.fromJson(fixture('tide'));

    expect(tide.stationId, 'public-api-station');
    expect(tide.points, hasLength(3));
    expect(tide.points.first.value, 1.5);
    expect(tide.points.first.timestampUtc, DateTime.parse('2026-01-01T00:00:00Z'));
    expect(tide.modelId, 'public-api-harmonic');
    expect(tide.modelVersion, '1.0.0');
    expect(tide.datumId, 'local-gauge-fixture');
    expect(tide.unit, WaterLevelUnit.m);
    expect(tide.phaseConvention, HarmonicPhaseConvention.cosineLagDegrees);
    expect(tide.provenance.sourceKey, 'public-api-fixture');
  });

  test('parses Gregorian/lunar calendar contract exactly as served', () {
    final calendar = CalendarDay.fromJson(fixture('calendar'));

    expect(calendar.solarDate, const CalendarDate(year: 2024, month: 2, day: 10));
    expect(
      calendar.lunarDate,
      const LunarCalendarDate(year: 2024, month: 1, day: 1, isLeapMonth: false),
    );
    expect(calendar.timeZone, 'Asia/Ho_Chi_Minh');
  });

  test('fails closed when a required field has the wrong type', () {
    final json = fixture('station');
    json['name'] = 42;

    expect(
      () => StationDetails.fromJson(json),
      throwsA(isA<JsonContractException>()),
    );
  });
}
