import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';

String _requireText(String value, String name) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(value, name, 'must not be empty');
  }
  return normalized;
}

void _requirePositive(int value, String name) {
  if (value <= 0) {
    throw ArgumentError.value(value, name, 'must be greater than zero');
  }
}

class SearchLocationsRequest {
  SearchLocationsRequest({
    required String query,
    this.limit = 20,
    this.cursor,
  }) : query = _requireText(query, 'query') {
    _requirePositive(limit, 'limit');
  }

  final String query;
  final int limit;
  final String? cursor;
}

class TideRequest {
  TideRequest({
    required String stationId,
    required DateTime startUtc,
    required DateTime endUtc,
    required this.intervalSeconds,
  }) : stationId = _requireText(stationId, 'stationId'),
       startUtc = startUtc.toUtc(),
       endUtc = endUtc.toUtc() {
    _requirePositive(intervalSeconds, 'intervalSeconds');
    if (this.endUtc.isBefore(this.startUtc)) {
      throw ArgumentError('endUtc must be at or after startUtc');
    }
  }

  final String stationId;
  final DateTime startUtc;
  final DateTime endUtc;
  final int intervalSeconds;
}

class WaterLevelRequest {
  WaterLevelRequest({
    required String stationId,
    DateTime? startUtc,
    DateTime? endUtc,
    this.limit = 20,
    this.cursor,
  }) : stationId = _requireText(stationId, 'stationId'),
       startUtc = startUtc?.toUtc(),
       endUtc = endUtc?.toUtc() {
    _requirePositive(limit, 'limit');
    if (this.startUtc != null &&
        this.endUtc != null &&
        this.endUtc!.isBefore(this.startUtc!)) {
      throw ArgumentError('endUtc must be at or after startUtc');
    }
  }

  final String stationId;
  final DateTime? startUtc;
  final DateTime? endUtc;
  final int limit;
  final String? cursor;
}

class CalendarRequest {
  const CalendarRequest({required this.date});

  final CalendarDate date;
}
