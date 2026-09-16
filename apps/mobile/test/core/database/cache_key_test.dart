import 'package:connuoc_viet/core/database/cache_key.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('canonical cache keys', () {
    test('station key trims the identifier', () {
      expect(cacheKeyForStation(' station-1 '), 'station|id=station-1');
    });

    test('search key preserves exact page semantics deterministically', () {
      final request = SearchLocationsRequest(
        query: 'Ninh Cơ | cửa',
        limit: 25,
        cursor: 'next=1',
      );

      expect(
        cacheKeyForSearch(request),
        'search|q=Ninh%20C%C6%A1%20%7C%20c%E1%BB%ADa|limit=25|cursor=next%3D1',
      );
      expect(
        cacheKeyForSearch(
          SearchLocationsRequest(query: 'Ninh Cơ | cửa', limit: 25),
        ),
        'search|q=Ninh%20C%C6%A1%20%7C%20c%E1%BB%ADa|limit=25|cursor=',
      );
    });

    test('tide key is stable across equivalent UTC instants', () {
      final a = TideRequest(
        stationId: ' station-1 ',
        startUtc: DateTime.parse('2026-09-16T00:00:00+07:00'),
        endUtc: DateTime.parse('2026-09-16T06:00:00+07:00'),
        intervalSeconds: 600,
      );
      final b = TideRequest(
        stationId: 'station-1',
        startUtc: DateTime.parse('2026-09-15T17:00:00Z'),
        endUtc: DateTime.parse('2026-09-15T23:00:00Z'),
        intervalSeconds: 600,
      );

      expect(cacheKeyForTide(a), cacheKeyForTide(b));
      expect(
        cacheKeyForTide(a),
        'tide|station=station-1|start=2026-09-15T17%3A00%3A00.000Z|end=2026-09-15T23%3A00%3A00.000Z|interval=600',
      );
    });

    test('water key distinguishes nullable ranges and cursor', () {
      final base = WaterLevelRequest(stationId: 'station-1', limit: 20);
      final ranged = WaterLevelRequest(
        stationId: 'station-1',
        startUtc: DateTime.parse('2026-09-16T00:00:00+07:00'),
        endUtc: DateTime.parse('2026-09-16T03:00:00+07:00'),
        limit: 20,
        cursor: 'page-2',
      );

      expect(
        cacheKeyForWaterLevels(base),
        'water|station=station-1|start=|end=|limit=20|cursor=',
      );
      expect(
        cacheKeyForWaterLevels(ranged),
        isNot(cacheKeyForWaterLevels(base)),
      );
    });

    test('calendar key uses zero-padded Gregorian date', () {
      expect(
        cacheKeyForCalendar(
          const CalendarRequest(
            date: CalendarDate(year: 2026, month: 9, day: 6),
          ),
        ),
        'calendar|date=2026-09-06',
      );
    });
  });
}
