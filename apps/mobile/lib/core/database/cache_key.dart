import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';

String cacheKeyForStation(String stationId) {
  final normalized = stationId.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(stationId, 'stationId', 'must not be empty');
  }

  return 'station|id=${_encode(normalized)}';
}

String cacheKeyForSearch(SearchLocationsRequest request) {
  return 'search|q=${_encode(request.query)}|limit=${request.limit}|cursor=${_encode(request.cursor ?? '')}';
}

String cacheKeyForTide(TideRequest request) {
  return 'tide|station=${_encode(request.stationId)}|start=${_instant(request.startUtc)}|end=${_instant(request.endUtc)}|interval=${request.intervalSeconds}';
}

String cacheKeyForWaterLevels(WaterLevelRequest request) {
  final start = request.startUtc == null ? '' : _instant(request.startUtc!);
  final end = request.endUtc == null ? '' : _instant(request.endUtc!);

  return 'water|station=${_encode(request.stationId)}|start=$start|end=$end|limit=${request.limit}|cursor=${_encode(request.cursor ?? '')}';
}

String cacheKeyForCalendar(CalendarRequest request) {
  final date = request.date;
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');

  return 'calendar|date=$year-$month-$day';
}

String _instant(DateTime value) {
  return _encode(value.toUtc().toIso8601String());
}

String _encode(String value) {
  return Uri.encodeComponent(value);
}
