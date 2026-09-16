import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';

enum OfflinePackEntityType { station, tideSeries, waterLevelPage, calendarDay }

extension OfflinePackEntityTypeStorage on OfflinePackEntityType {
  String get storageValue => switch (this) {
    OfflinePackEntityType.station => 'station',
    OfflinePackEntityType.tideSeries => 'tideSeries',
    OfflinePackEntityType.waterLevelPage => 'waterLevelPage',
    OfflinePackEntityType.calendarDay => 'calendarDay',
  };
}

class OfflinePackEntry {
  const OfflinePackEntry({required this.entityType, required this.entityKey});

  final OfflinePackEntityType entityType;
  final String entityKey;
}

class OfflinePackManifest {
  OfflinePackManifest({
    required String packId,
    required String version,
    required this.schemaVersion,
    required DateTime generatedAtUtc,
    required DateTime expiresAtUtc,
    required String checksum,
    required Map<String, Object?> contentSummary,
    required Map<String, Object?> sourceSummary,
    required String minimumAppVersion,
    required DateTime installedAtUtc,
  }) : packId = _requireText(packId, 'packId'),
       version = _requireText(version, 'version'),
       generatedAtUtc = generatedAtUtc.toUtc(),
       expiresAtUtc = expiresAtUtc.toUtc(),
       checksum = _requireText(checksum, 'checksum'),
       contentSummary = Map<String, Object?>.unmodifiable(contentSummary),
       sourceSummary = Map<String, Object?>.unmodifiable(sourceSummary),
       minimumAppVersion = _requireText(minimumAppVersion, 'minimumAppVersion'),
       installedAtUtc = installedAtUtc.toUtc() {
    if (schemaVersion <= 0) {
      throw ArgumentError.value(
        schemaVersion,
        'schemaVersion',
        'must be positive',
      );
    }
    if (this.expiresAtUtc.isBefore(this.generatedAtUtc)) {
      throw ArgumentError('expiresAtUtc must be at or after generatedAtUtc');
    }
  }

  final String packId;
  final String version;
  final int schemaVersion;
  final DateTime generatedAtUtc;
  final DateTime expiresAtUtc;
  final String checksum;
  final Map<String, Object?> contentSummary;
  final Map<String, Object?> sourceSummary;
  final String minimumAppVersion;
  final DateTime installedAtUtc;
}

sealed class OfflinePackResourceWrite {
  const OfflinePackResourceWrite();
}

class OfflineStationResourceWrite extends OfflinePackResourceWrite {
  const OfflineStationResourceWrite(this.resource);

  final RemoteResource<StationDetails> resource;
}

class OfflineTideResourceWrite extends OfflinePackResourceWrite {
  const OfflineTideResourceWrite(this.request, this.resource);

  final TideRequest request;
  final RemoteResource<TideSeries> resource;
}

class OfflineWaterLevelResourceWrite extends OfflinePackResourceWrite {
  const OfflineWaterLevelResourceWrite(this.request, this.resource);

  final WaterLevelRequest request;
  final RemoteResource<WaterLevelPage> resource;
}

class OfflineCalendarResourceWrite extends OfflinePackResourceWrite {
  const OfflineCalendarResourceWrite(this.request, this.resource);

  final CalendarRequest request;
  final RemoteResource<CalendarDay> resource;
}

class ValidatedOfflineDataset {
  ValidatedOfflineDataset({
    required this.manifest,
    required List<OfflinePackResourceWrite> resourceWrites,
    required List<OfflinePackEntry> entries,
  }) : resourceWrites = List<OfflinePackResourceWrite>.unmodifiable(
         resourceWrites,
       ),
       entries = List<OfflinePackEntry>.unmodifiable(entries);

  final OfflinePackManifest manifest;
  final List<OfflinePackResourceWrite> resourceWrites;
  final List<OfflinePackEntry> entries;
}

String _requireText(String value, String name) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(value, name, 'must not be empty');
  }
  return normalized;
}
