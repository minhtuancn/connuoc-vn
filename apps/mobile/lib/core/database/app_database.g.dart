// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $StationsTable extends Stations with TableInfo<$StationsTable, Station> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stationTypeMeta = const VerificationMeta(
    'stationType',
  );
  @override
  late final GeneratedColumn<String> stationType = GeneratedColumn<String>(
    'station_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _timeZoneMeta = const VerificationMeta(
    'timeZone',
  );
  @override
  late final GeneratedColumn<String> timeZone = GeneratedColumn<String>(
    'time_zone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _defaultDatumIdMeta = const VerificationMeta(
    'defaultDatumId',
  );
  @override
  late final GeneratedColumn<String> defaultDatumId = GeneratedColumn<String>(
    'default_datum_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _detailGeneratedAtUtcMeta =
      const VerificationMeta('detailGeneratedAtUtc');
  @override
  late final GeneratedColumn<DateTime> detailGeneratedAtUtc =
      GeneratedColumn<DateTime>(
        'detail_generated_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceSourceKeyMeta =
      const VerificationMeta('provenanceSourceKey');
  @override
  late final GeneratedColumn<String> provenanceSourceKey =
      GeneratedColumn<String>(
        'provenance_source_key',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceImportRunIdMeta =
      const VerificationMeta('provenanceImportRunId');
  @override
  late final GeneratedColumn<String> provenanceImportRunId =
      GeneratedColumn<String>(
        'provenance_import_run_id',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceRawChecksumSha256Meta =
      const VerificationMeta('provenanceRawChecksumSha256');
  @override
  late final GeneratedColumn<String> provenanceRawChecksumSha256 =
      GeneratedColumn<String>(
        'provenance_raw_checksum_sha256',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceParserVersionMeta =
      const VerificationMeta('provenanceParserVersion');
  @override
  late final GeneratedColumn<String> provenanceParserVersion =
      GeneratedColumn<String>(
        'provenance_parser_version',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceNormalizerVersionMeta =
      const VerificationMeta('provenanceNormalizerVersion');
  @override
  late final GeneratedColumn<String> provenanceNormalizerVersion =
      GeneratedColumn<String>(
        'provenance_normalizer_version',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceObservedAtUtcMeta =
      const VerificationMeta('provenanceObservedAtUtc');
  @override
  late final GeneratedColumn<DateTime> provenanceObservedAtUtc =
      GeneratedColumn<DateTime>(
        'provenance_observed_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _localUpdatedAtUtcMeta = const VerificationMeta(
    'localUpdatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> localUpdatedAtUtc =
      GeneratedColumn<DateTime>(
        'local_updated_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    stationType,
    timeZone,
    latitude,
    longitude,
    defaultDatumId,
    detailGeneratedAtUtc,
    provenanceSourceKey,
    provenanceImportRunId,
    provenanceRawChecksumSha256,
    provenanceParserVersion,
    provenanceNormalizerVersion,
    provenanceObservedAtUtc,
    localUpdatedAtUtc,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'stations';
  @override
  VerificationContext validateIntegrity(
    Insertable<Station> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('station_type')) {
      context.handle(
        _stationTypeMeta,
        stationType.isAcceptableOrUnknown(
          data['station_type']!,
          _stationTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_stationTypeMeta);
    }
    if (data.containsKey('time_zone')) {
      context.handle(
        _timeZoneMeta,
        timeZone.isAcceptableOrUnknown(data['time_zone']!, _timeZoneMeta),
      );
    } else if (isInserting) {
      context.missing(_timeZoneMeta);
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    } else if (isInserting) {
      context.missing(_latitudeMeta);
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    } else if (isInserting) {
      context.missing(_longitudeMeta);
    }
    if (data.containsKey('default_datum_id')) {
      context.handle(
        _defaultDatumIdMeta,
        defaultDatumId.isAcceptableOrUnknown(
          data['default_datum_id']!,
          _defaultDatumIdMeta,
        ),
      );
    }
    if (data.containsKey('detail_generated_at_utc')) {
      context.handle(
        _detailGeneratedAtUtcMeta,
        detailGeneratedAtUtc.isAcceptableOrUnknown(
          data['detail_generated_at_utc']!,
          _detailGeneratedAtUtcMeta,
        ),
      );
    }
    if (data.containsKey('provenance_source_key')) {
      context.handle(
        _provenanceSourceKeyMeta,
        provenanceSourceKey.isAcceptableOrUnknown(
          data['provenance_source_key']!,
          _provenanceSourceKeyMeta,
        ),
      );
    }
    if (data.containsKey('provenance_import_run_id')) {
      context.handle(
        _provenanceImportRunIdMeta,
        provenanceImportRunId.isAcceptableOrUnknown(
          data['provenance_import_run_id']!,
          _provenanceImportRunIdMeta,
        ),
      );
    }
    if (data.containsKey('provenance_raw_checksum_sha256')) {
      context.handle(
        _provenanceRawChecksumSha256Meta,
        provenanceRawChecksumSha256.isAcceptableOrUnknown(
          data['provenance_raw_checksum_sha256']!,
          _provenanceRawChecksumSha256Meta,
        ),
      );
    }
    if (data.containsKey('provenance_parser_version')) {
      context.handle(
        _provenanceParserVersionMeta,
        provenanceParserVersion.isAcceptableOrUnknown(
          data['provenance_parser_version']!,
          _provenanceParserVersionMeta,
        ),
      );
    }
    if (data.containsKey('provenance_normalizer_version')) {
      context.handle(
        _provenanceNormalizerVersionMeta,
        provenanceNormalizerVersion.isAcceptableOrUnknown(
          data['provenance_normalizer_version']!,
          _provenanceNormalizerVersionMeta,
        ),
      );
    }
    if (data.containsKey('provenance_observed_at_utc')) {
      context.handle(
        _provenanceObservedAtUtcMeta,
        provenanceObservedAtUtc.isAcceptableOrUnknown(
          data['provenance_observed_at_utc']!,
          _provenanceObservedAtUtcMeta,
        ),
      );
    }
    if (data.containsKey('local_updated_at_utc')) {
      context.handle(
        _localUpdatedAtUtcMeta,
        localUpdatedAtUtc.isAcceptableOrUnknown(
          data['local_updated_at_utc']!,
          _localUpdatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_localUpdatedAtUtcMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Station map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Station(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      stationType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_type'],
      )!,
      timeZone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}time_zone'],
      )!,
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      )!,
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      )!,
      defaultDatumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}default_datum_id'],
      ),
      detailGeneratedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}detail_generated_at_utc'],
      ),
      provenanceSourceKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_source_key'],
      ),
      provenanceImportRunId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_import_run_id'],
      ),
      provenanceRawChecksumSha256: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_raw_checksum_sha256'],
      ),
      provenanceParserVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_parser_version'],
      ),
      provenanceNormalizerVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_normalizer_version'],
      ),
      provenanceObservedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}provenance_observed_at_utc'],
      ),
      localUpdatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}local_updated_at_utc'],
      )!,
    );
  }

  @override
  $StationsTable createAlias(String alias) {
    return $StationsTable(attachedDatabase, alias);
  }
}

class Station extends DataClass implements Insertable<Station> {
  final String id;
  final String name;
  final String stationType;
  final String timeZone;
  final double latitude;
  final double longitude;
  final String? defaultDatumId;
  final DateTime? detailGeneratedAtUtc;
  final String? provenanceSourceKey;
  final String? provenanceImportRunId;
  final String? provenanceRawChecksumSha256;
  final String? provenanceParserVersion;
  final String? provenanceNormalizerVersion;
  final DateTime? provenanceObservedAtUtc;
  final DateTime localUpdatedAtUtc;
  const Station({
    required this.id,
    required this.name,
    required this.stationType,
    required this.timeZone,
    required this.latitude,
    required this.longitude,
    this.defaultDatumId,
    this.detailGeneratedAtUtc,
    this.provenanceSourceKey,
    this.provenanceImportRunId,
    this.provenanceRawChecksumSha256,
    this.provenanceParserVersion,
    this.provenanceNormalizerVersion,
    this.provenanceObservedAtUtc,
    required this.localUpdatedAtUtc,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['station_type'] = Variable<String>(stationType);
    map['time_zone'] = Variable<String>(timeZone);
    map['latitude'] = Variable<double>(latitude);
    map['longitude'] = Variable<double>(longitude);
    if (!nullToAbsent || defaultDatumId != null) {
      map['default_datum_id'] = Variable<String>(defaultDatumId);
    }
    if (!nullToAbsent || detailGeneratedAtUtc != null) {
      map['detail_generated_at_utc'] = Variable<DateTime>(detailGeneratedAtUtc);
    }
    if (!nullToAbsent || provenanceSourceKey != null) {
      map['provenance_source_key'] = Variable<String>(provenanceSourceKey);
    }
    if (!nullToAbsent || provenanceImportRunId != null) {
      map['provenance_import_run_id'] = Variable<String>(provenanceImportRunId);
    }
    if (!nullToAbsent || provenanceRawChecksumSha256 != null) {
      map['provenance_raw_checksum_sha256'] = Variable<String>(
        provenanceRawChecksumSha256,
      );
    }
    if (!nullToAbsent || provenanceParserVersion != null) {
      map['provenance_parser_version'] = Variable<String>(
        provenanceParserVersion,
      );
    }
    if (!nullToAbsent || provenanceNormalizerVersion != null) {
      map['provenance_normalizer_version'] = Variable<String>(
        provenanceNormalizerVersion,
      );
    }
    if (!nullToAbsent || provenanceObservedAtUtc != null) {
      map['provenance_observed_at_utc'] = Variable<DateTime>(
        provenanceObservedAtUtc,
      );
    }
    map['local_updated_at_utc'] = Variable<DateTime>(localUpdatedAtUtc);
    return map;
  }

  StationsCompanion toCompanion(bool nullToAbsent) {
    return StationsCompanion(
      id: Value(id),
      name: Value(name),
      stationType: Value(stationType),
      timeZone: Value(timeZone),
      latitude: Value(latitude),
      longitude: Value(longitude),
      defaultDatumId: defaultDatumId == null && nullToAbsent
          ? const Value.absent()
          : Value(defaultDatumId),
      detailGeneratedAtUtc: detailGeneratedAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(detailGeneratedAtUtc),
      provenanceSourceKey: provenanceSourceKey == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceSourceKey),
      provenanceImportRunId: provenanceImportRunId == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceImportRunId),
      provenanceRawChecksumSha256:
          provenanceRawChecksumSha256 == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceRawChecksumSha256),
      provenanceParserVersion: provenanceParserVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceParserVersion),
      provenanceNormalizerVersion:
          provenanceNormalizerVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceNormalizerVersion),
      provenanceObservedAtUtc: provenanceObservedAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceObservedAtUtc),
      localUpdatedAtUtc: Value(localUpdatedAtUtc),
    );
  }

  factory Station.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Station(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      stationType: serializer.fromJson<String>(json['stationType']),
      timeZone: serializer.fromJson<String>(json['timeZone']),
      latitude: serializer.fromJson<double>(json['latitude']),
      longitude: serializer.fromJson<double>(json['longitude']),
      defaultDatumId: serializer.fromJson<String?>(json['defaultDatumId']),
      detailGeneratedAtUtc: serializer.fromJson<DateTime?>(
        json['detailGeneratedAtUtc'],
      ),
      provenanceSourceKey: serializer.fromJson<String?>(
        json['provenanceSourceKey'],
      ),
      provenanceImportRunId: serializer.fromJson<String?>(
        json['provenanceImportRunId'],
      ),
      provenanceRawChecksumSha256: serializer.fromJson<String?>(
        json['provenanceRawChecksumSha256'],
      ),
      provenanceParserVersion: serializer.fromJson<String?>(
        json['provenanceParserVersion'],
      ),
      provenanceNormalizerVersion: serializer.fromJson<String?>(
        json['provenanceNormalizerVersion'],
      ),
      provenanceObservedAtUtc: serializer.fromJson<DateTime?>(
        json['provenanceObservedAtUtc'],
      ),
      localUpdatedAtUtc: serializer.fromJson<DateTime>(
        json['localUpdatedAtUtc'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'stationType': serializer.toJson<String>(stationType),
      'timeZone': serializer.toJson<String>(timeZone),
      'latitude': serializer.toJson<double>(latitude),
      'longitude': serializer.toJson<double>(longitude),
      'defaultDatumId': serializer.toJson<String?>(defaultDatumId),
      'detailGeneratedAtUtc': serializer.toJson<DateTime?>(
        detailGeneratedAtUtc,
      ),
      'provenanceSourceKey': serializer.toJson<String?>(provenanceSourceKey),
      'provenanceImportRunId': serializer.toJson<String?>(
        provenanceImportRunId,
      ),
      'provenanceRawChecksumSha256': serializer.toJson<String?>(
        provenanceRawChecksumSha256,
      ),
      'provenanceParserVersion': serializer.toJson<String?>(
        provenanceParserVersion,
      ),
      'provenanceNormalizerVersion': serializer.toJson<String?>(
        provenanceNormalizerVersion,
      ),
      'provenanceObservedAtUtc': serializer.toJson<DateTime?>(
        provenanceObservedAtUtc,
      ),
      'localUpdatedAtUtc': serializer.toJson<DateTime>(localUpdatedAtUtc),
    };
  }

  Station copyWith({
    String? id,
    String? name,
    String? stationType,
    String? timeZone,
    double? latitude,
    double? longitude,
    Value<String?> defaultDatumId = const Value.absent(),
    Value<DateTime?> detailGeneratedAtUtc = const Value.absent(),
    Value<String?> provenanceSourceKey = const Value.absent(),
    Value<String?> provenanceImportRunId = const Value.absent(),
    Value<String?> provenanceRawChecksumSha256 = const Value.absent(),
    Value<String?> provenanceParserVersion = const Value.absent(),
    Value<String?> provenanceNormalizerVersion = const Value.absent(),
    Value<DateTime?> provenanceObservedAtUtc = const Value.absent(),
    DateTime? localUpdatedAtUtc,
  }) => Station(
    id: id ?? this.id,
    name: name ?? this.name,
    stationType: stationType ?? this.stationType,
    timeZone: timeZone ?? this.timeZone,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    defaultDatumId: defaultDatumId.present
        ? defaultDatumId.value
        : this.defaultDatumId,
    detailGeneratedAtUtc: detailGeneratedAtUtc.present
        ? detailGeneratedAtUtc.value
        : this.detailGeneratedAtUtc,
    provenanceSourceKey: provenanceSourceKey.present
        ? provenanceSourceKey.value
        : this.provenanceSourceKey,
    provenanceImportRunId: provenanceImportRunId.present
        ? provenanceImportRunId.value
        : this.provenanceImportRunId,
    provenanceRawChecksumSha256: provenanceRawChecksumSha256.present
        ? provenanceRawChecksumSha256.value
        : this.provenanceRawChecksumSha256,
    provenanceParserVersion: provenanceParserVersion.present
        ? provenanceParserVersion.value
        : this.provenanceParserVersion,
    provenanceNormalizerVersion: provenanceNormalizerVersion.present
        ? provenanceNormalizerVersion.value
        : this.provenanceNormalizerVersion,
    provenanceObservedAtUtc: provenanceObservedAtUtc.present
        ? provenanceObservedAtUtc.value
        : this.provenanceObservedAtUtc,
    localUpdatedAtUtc: localUpdatedAtUtc ?? this.localUpdatedAtUtc,
  );
  Station copyWithCompanion(StationsCompanion data) {
    return Station(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      stationType: data.stationType.present
          ? data.stationType.value
          : this.stationType,
      timeZone: data.timeZone.present ? data.timeZone.value : this.timeZone,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      defaultDatumId: data.defaultDatumId.present
          ? data.defaultDatumId.value
          : this.defaultDatumId,
      detailGeneratedAtUtc: data.detailGeneratedAtUtc.present
          ? data.detailGeneratedAtUtc.value
          : this.detailGeneratedAtUtc,
      provenanceSourceKey: data.provenanceSourceKey.present
          ? data.provenanceSourceKey.value
          : this.provenanceSourceKey,
      provenanceImportRunId: data.provenanceImportRunId.present
          ? data.provenanceImportRunId.value
          : this.provenanceImportRunId,
      provenanceRawChecksumSha256: data.provenanceRawChecksumSha256.present
          ? data.provenanceRawChecksumSha256.value
          : this.provenanceRawChecksumSha256,
      provenanceParserVersion: data.provenanceParserVersion.present
          ? data.provenanceParserVersion.value
          : this.provenanceParserVersion,
      provenanceNormalizerVersion: data.provenanceNormalizerVersion.present
          ? data.provenanceNormalizerVersion.value
          : this.provenanceNormalizerVersion,
      provenanceObservedAtUtc: data.provenanceObservedAtUtc.present
          ? data.provenanceObservedAtUtc.value
          : this.provenanceObservedAtUtc,
      localUpdatedAtUtc: data.localUpdatedAtUtc.present
          ? data.localUpdatedAtUtc.value
          : this.localUpdatedAtUtc,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Station(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('stationType: $stationType, ')
          ..write('timeZone: $timeZone, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('defaultDatumId: $defaultDatumId, ')
          ..write('detailGeneratedAtUtc: $detailGeneratedAtUtc, ')
          ..write('provenanceSourceKey: $provenanceSourceKey, ')
          ..write('provenanceImportRunId: $provenanceImportRunId, ')
          ..write('provenanceRawChecksumSha256: $provenanceRawChecksumSha256, ')
          ..write('provenanceParserVersion: $provenanceParserVersion, ')
          ..write('provenanceNormalizerVersion: $provenanceNormalizerVersion, ')
          ..write('provenanceObservedAtUtc: $provenanceObservedAtUtc, ')
          ..write('localUpdatedAtUtc: $localUpdatedAtUtc')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    stationType,
    timeZone,
    latitude,
    longitude,
    defaultDatumId,
    detailGeneratedAtUtc,
    provenanceSourceKey,
    provenanceImportRunId,
    provenanceRawChecksumSha256,
    provenanceParserVersion,
    provenanceNormalizerVersion,
    provenanceObservedAtUtc,
    localUpdatedAtUtc,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Station &&
          other.id == this.id &&
          other.name == this.name &&
          other.stationType == this.stationType &&
          other.timeZone == this.timeZone &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.defaultDatumId == this.defaultDatumId &&
          other.detailGeneratedAtUtc == this.detailGeneratedAtUtc &&
          other.provenanceSourceKey == this.provenanceSourceKey &&
          other.provenanceImportRunId == this.provenanceImportRunId &&
          other.provenanceRawChecksumSha256 ==
              this.provenanceRawChecksumSha256 &&
          other.provenanceParserVersion == this.provenanceParserVersion &&
          other.provenanceNormalizerVersion ==
              this.provenanceNormalizerVersion &&
          other.provenanceObservedAtUtc == this.provenanceObservedAtUtc &&
          other.localUpdatedAtUtc == this.localUpdatedAtUtc);
}

class StationsCompanion extends UpdateCompanion<Station> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> stationType;
  final Value<String> timeZone;
  final Value<double> latitude;
  final Value<double> longitude;
  final Value<String?> defaultDatumId;
  final Value<DateTime?> detailGeneratedAtUtc;
  final Value<String?> provenanceSourceKey;
  final Value<String?> provenanceImportRunId;
  final Value<String?> provenanceRawChecksumSha256;
  final Value<String?> provenanceParserVersion;
  final Value<String?> provenanceNormalizerVersion;
  final Value<DateTime?> provenanceObservedAtUtc;
  final Value<DateTime> localUpdatedAtUtc;
  final Value<int> rowid;
  const StationsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.stationType = const Value.absent(),
    this.timeZone = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.defaultDatumId = const Value.absent(),
    this.detailGeneratedAtUtc = const Value.absent(),
    this.provenanceSourceKey = const Value.absent(),
    this.provenanceImportRunId = const Value.absent(),
    this.provenanceRawChecksumSha256 = const Value.absent(),
    this.provenanceParserVersion = const Value.absent(),
    this.provenanceNormalizerVersion = const Value.absent(),
    this.provenanceObservedAtUtc = const Value.absent(),
    this.localUpdatedAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StationsCompanion.insert({
    required String id,
    required String name,
    required String stationType,
    required String timeZone,
    required double latitude,
    required double longitude,
    this.defaultDatumId = const Value.absent(),
    this.detailGeneratedAtUtc = const Value.absent(),
    this.provenanceSourceKey = const Value.absent(),
    this.provenanceImportRunId = const Value.absent(),
    this.provenanceRawChecksumSha256 = const Value.absent(),
    this.provenanceParserVersion = const Value.absent(),
    this.provenanceNormalizerVersion = const Value.absent(),
    this.provenanceObservedAtUtc = const Value.absent(),
    required DateTime localUpdatedAtUtc,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name),
       stationType = Value(stationType),
       timeZone = Value(timeZone),
       latitude = Value(latitude),
       longitude = Value(longitude),
       localUpdatedAtUtc = Value(localUpdatedAtUtc);
  static Insertable<Station> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? stationType,
    Expression<String>? timeZone,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? defaultDatumId,
    Expression<DateTime>? detailGeneratedAtUtc,
    Expression<String>? provenanceSourceKey,
    Expression<String>? provenanceImportRunId,
    Expression<String>? provenanceRawChecksumSha256,
    Expression<String>? provenanceParserVersion,
    Expression<String>? provenanceNormalizerVersion,
    Expression<DateTime>? provenanceObservedAtUtc,
    Expression<DateTime>? localUpdatedAtUtc,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (stationType != null) 'station_type': stationType,
      if (timeZone != null) 'time_zone': timeZone,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (defaultDatumId != null) 'default_datum_id': defaultDatumId,
      if (detailGeneratedAtUtc != null)
        'detail_generated_at_utc': detailGeneratedAtUtc,
      if (provenanceSourceKey != null)
        'provenance_source_key': provenanceSourceKey,
      if (provenanceImportRunId != null)
        'provenance_import_run_id': provenanceImportRunId,
      if (provenanceRawChecksumSha256 != null)
        'provenance_raw_checksum_sha256': provenanceRawChecksumSha256,
      if (provenanceParserVersion != null)
        'provenance_parser_version': provenanceParserVersion,
      if (provenanceNormalizerVersion != null)
        'provenance_normalizer_version': provenanceNormalizerVersion,
      if (provenanceObservedAtUtc != null)
        'provenance_observed_at_utc': provenanceObservedAtUtc,
      if (localUpdatedAtUtc != null) 'local_updated_at_utc': localUpdatedAtUtc,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StationsCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<String>? stationType,
    Value<String>? timeZone,
    Value<double>? latitude,
    Value<double>? longitude,
    Value<String?>? defaultDatumId,
    Value<DateTime?>? detailGeneratedAtUtc,
    Value<String?>? provenanceSourceKey,
    Value<String?>? provenanceImportRunId,
    Value<String?>? provenanceRawChecksumSha256,
    Value<String?>? provenanceParserVersion,
    Value<String?>? provenanceNormalizerVersion,
    Value<DateTime?>? provenanceObservedAtUtc,
    Value<DateTime>? localUpdatedAtUtc,
    Value<int>? rowid,
  }) {
    return StationsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      stationType: stationType ?? this.stationType,
      timeZone: timeZone ?? this.timeZone,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      defaultDatumId: defaultDatumId ?? this.defaultDatumId,
      detailGeneratedAtUtc: detailGeneratedAtUtc ?? this.detailGeneratedAtUtc,
      provenanceSourceKey: provenanceSourceKey ?? this.provenanceSourceKey,
      provenanceImportRunId:
          provenanceImportRunId ?? this.provenanceImportRunId,
      provenanceRawChecksumSha256:
          provenanceRawChecksumSha256 ?? this.provenanceRawChecksumSha256,
      provenanceParserVersion:
          provenanceParserVersion ?? this.provenanceParserVersion,
      provenanceNormalizerVersion:
          provenanceNormalizerVersion ?? this.provenanceNormalizerVersion,
      provenanceObservedAtUtc:
          provenanceObservedAtUtc ?? this.provenanceObservedAtUtc,
      localUpdatedAtUtc: localUpdatedAtUtc ?? this.localUpdatedAtUtc,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (stationType.present) {
      map['station_type'] = Variable<String>(stationType.value);
    }
    if (timeZone.present) {
      map['time_zone'] = Variable<String>(timeZone.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (defaultDatumId.present) {
      map['default_datum_id'] = Variable<String>(defaultDatumId.value);
    }
    if (detailGeneratedAtUtc.present) {
      map['detail_generated_at_utc'] = Variable<DateTime>(
        detailGeneratedAtUtc.value,
      );
    }
    if (provenanceSourceKey.present) {
      map['provenance_source_key'] = Variable<String>(
        provenanceSourceKey.value,
      );
    }
    if (provenanceImportRunId.present) {
      map['provenance_import_run_id'] = Variable<String>(
        provenanceImportRunId.value,
      );
    }
    if (provenanceRawChecksumSha256.present) {
      map['provenance_raw_checksum_sha256'] = Variable<String>(
        provenanceRawChecksumSha256.value,
      );
    }
    if (provenanceParserVersion.present) {
      map['provenance_parser_version'] = Variable<String>(
        provenanceParserVersion.value,
      );
    }
    if (provenanceNormalizerVersion.present) {
      map['provenance_normalizer_version'] = Variable<String>(
        provenanceNormalizerVersion.value,
      );
    }
    if (provenanceObservedAtUtc.present) {
      map['provenance_observed_at_utc'] = Variable<DateTime>(
        provenanceObservedAtUtc.value,
      );
    }
    if (localUpdatedAtUtc.present) {
      map['local_updated_at_utc'] = Variable<DateTime>(localUpdatedAtUtc.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StationsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('stationType: $stationType, ')
          ..write('timeZone: $timeZone, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('defaultDatumId: $defaultDatumId, ')
          ..write('detailGeneratedAtUtc: $detailGeneratedAtUtc, ')
          ..write('provenanceSourceKey: $provenanceSourceKey, ')
          ..write('provenanceImportRunId: $provenanceImportRunId, ')
          ..write('provenanceRawChecksumSha256: $provenanceRawChecksumSha256, ')
          ..write('provenanceParserVersion: $provenanceParserVersion, ')
          ..write('provenanceNormalizerVersion: $provenanceNormalizerVersion, ')
          ..write('provenanceObservedAtUtc: $provenanceObservedAtUtc, ')
          ..write('localUpdatedAtUtc: $localUpdatedAtUtc, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $StationAliasesTable extends StationAliases
    with TableInfo<$StationAliasesTable, StationAliase> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StationAliasesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES stations (id) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _aliasMeta = const VerificationMeta('alias');
  @override
  late final GeneratedColumn<String> alias = GeneratedColumn<String>(
    'alias',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [stationId, alias];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'station_aliases';
  @override
  VerificationContext validateIntegrity(
    Insertable<StationAliase> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    if (data.containsKey('alias')) {
      context.handle(
        _aliasMeta,
        alias.isAcceptableOrUnknown(data['alias']!, _aliasMeta),
      );
    } else if (isInserting) {
      context.missing(_aliasMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {stationId, alias};
  @override
  StationAliase map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StationAliase(
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
      alias: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}alias'],
      )!,
    );
  }

  @override
  $StationAliasesTable createAlias(String alias) {
    return $StationAliasesTable(attachedDatabase, alias);
  }
}

class StationAliase extends DataClass implements Insertable<StationAliase> {
  final String stationId;
  final String alias;
  const StationAliase({required this.stationId, required this.alias});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['station_id'] = Variable<String>(stationId);
    map['alias'] = Variable<String>(alias);
    return map;
  }

  StationAliasesCompanion toCompanion(bool nullToAbsent) {
    return StationAliasesCompanion(
      stationId: Value(stationId),
      alias: Value(alias),
    );
  }

  factory StationAliase.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StationAliase(
      stationId: serializer.fromJson<String>(json['stationId']),
      alias: serializer.fromJson<String>(json['alias']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'stationId': serializer.toJson<String>(stationId),
      'alias': serializer.toJson<String>(alias),
    };
  }

  StationAliase copyWith({String? stationId, String? alias}) => StationAliase(
    stationId: stationId ?? this.stationId,
    alias: alias ?? this.alias,
  );
  StationAliase copyWithCompanion(StationAliasesCompanion data) {
    return StationAliase(
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
      alias: data.alias.present ? data.alias.value : this.alias,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StationAliase(')
          ..write('stationId: $stationId, ')
          ..write('alias: $alias')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(stationId, alias);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StationAliase &&
          other.stationId == this.stationId &&
          other.alias == this.alias);
}

class StationAliasesCompanion extends UpdateCompanion<StationAliase> {
  final Value<String> stationId;
  final Value<String> alias;
  final Value<int> rowid;
  const StationAliasesCompanion({
    this.stationId = const Value.absent(),
    this.alias = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StationAliasesCompanion.insert({
    required String stationId,
    required String alias,
    this.rowid = const Value.absent(),
  }) : stationId = Value(stationId),
       alias = Value(alias);
  static Insertable<StationAliase> custom({
    Expression<String>? stationId,
    Expression<String>? alias,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (stationId != null) 'station_id': stationId,
      if (alias != null) 'alias': alias,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StationAliasesCompanion copyWith({
    Value<String>? stationId,
    Value<String>? alias,
    Value<int>? rowid,
  }) {
    return StationAliasesCompanion(
      stationId: stationId ?? this.stationId,
      alias: alias ?? this.alias,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (alias.present) {
      map['alias'] = Variable<String>(alias.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StationAliasesCompanion(')
          ..write('stationId: $stationId, ')
          ..write('alias: $alias, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocationSearchPagesTable extends LocationSearchPages
    with TableInfo<$LocationSearchPagesTable, LocationSearchPage> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocationSearchPagesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _queryMeta = const VerificationMeta('query');
  @override
  late final GeneratedColumn<String> query = GeneratedColumn<String>(
    'query',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _limitMeta = const VerificationMeta('limit');
  @override
  late final GeneratedColumn<int> limit = GeneratedColumn<int>(
    'limit',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cursorMeta = const VerificationMeta('cursor');
  @override
  late final GeneratedColumn<String> cursor = GeneratedColumn<String>(
    'cursor',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _generatedAtUtcMeta = const VerificationMeta(
    'generatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> generatedAtUtc =
      GeneratedColumn<DateTime>(
        'generated_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _nextCursorMeta = const VerificationMeta(
    'nextCursor',
  );
  @override
  late final GeneratedColumn<String> nextCursor = GeneratedColumn<String>(
    'next_cursor',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _fetchedAtUtcMeta = const VerificationMeta(
    'fetchedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAtUtc = GeneratedColumn<DateTime>(
    'fetched_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _maxAgeSecondsMeta = const VerificationMeta(
    'maxAgeSeconds',
  );
  @override
  late final GeneratedColumn<int> maxAgeSeconds = GeneratedColumn<int>(
    'max_age_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _staleWhileRevalidateSecondsMeta =
      const VerificationMeta('staleWhileRevalidateSeconds');
  @override
  late final GeneratedColumn<int> staleWhileRevalidateSeconds =
      GeneratedColumn<int>(
        'stale_while_revalidate_seconds',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    cacheKey,
    query,
    limit,
    cursor,
    generatedAtUtc,
    nextCursor,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'location_search_pages';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocationSearchPage> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('query')) {
      context.handle(
        _queryMeta,
        query.isAcceptableOrUnknown(data['query']!, _queryMeta),
      );
    } else if (isInserting) {
      context.missing(_queryMeta);
    }
    if (data.containsKey('limit')) {
      context.handle(
        _limitMeta,
        limit.isAcceptableOrUnknown(data['limit']!, _limitMeta),
      );
    } else if (isInserting) {
      context.missing(_limitMeta);
    }
    if (data.containsKey('cursor')) {
      context.handle(
        _cursorMeta,
        cursor.isAcceptableOrUnknown(data['cursor']!, _cursorMeta),
      );
    }
    if (data.containsKey('generated_at_utc')) {
      context.handle(
        _generatedAtUtcMeta,
        generatedAtUtc.isAcceptableOrUnknown(
          data['generated_at_utc']!,
          _generatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_generatedAtUtcMeta);
    }
    if (data.containsKey('next_cursor')) {
      context.handle(
        _nextCursorMeta,
        nextCursor.isAcceptableOrUnknown(data['next_cursor']!, _nextCursorMeta),
      );
    }
    if (data.containsKey('fetched_at_utc')) {
      context.handle(
        _fetchedAtUtcMeta,
        fetchedAtUtc.isAcceptableOrUnknown(
          data['fetched_at_utc']!,
          _fetchedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtUtcMeta);
    }
    if (data.containsKey('max_age_seconds')) {
      context.handle(
        _maxAgeSecondsMeta,
        maxAgeSeconds.isAcceptableOrUnknown(
          data['max_age_seconds']!,
          _maxAgeSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_maxAgeSecondsMeta);
    }
    if (data.containsKey('stale_while_revalidate_seconds')) {
      context.handle(
        _staleWhileRevalidateSecondsMeta,
        staleWhileRevalidateSeconds.isAcceptableOrUnknown(
          data['stale_while_revalidate_seconds']!,
          _staleWhileRevalidateSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_staleWhileRevalidateSecondsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey};
  @override
  LocationSearchPage map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocationSearchPage(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      query: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}query'],
      )!,
      limit: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}limit'],
      )!,
      cursor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cursor'],
      ),
      generatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}generated_at_utc'],
      )!,
      nextCursor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}next_cursor'],
      ),
      fetchedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at_utc'],
      )!,
      maxAgeSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}max_age_seconds'],
      )!,
      staleWhileRevalidateSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stale_while_revalidate_seconds'],
      )!,
    );
  }

  @override
  $LocationSearchPagesTable createAlias(String alias) {
    return $LocationSearchPagesTable(attachedDatabase, alias);
  }
}

class LocationSearchPage extends DataClass
    implements Insertable<LocationSearchPage> {
  final String cacheKey;
  final String query;
  final int limit;
  final String? cursor;
  final DateTime generatedAtUtc;
  final String? nextCursor;
  final DateTime fetchedAtUtc;
  final int maxAgeSeconds;
  final int staleWhileRevalidateSeconds;
  const LocationSearchPage({
    required this.cacheKey,
    required this.query,
    required this.limit,
    this.cursor,
    required this.generatedAtUtc,
    this.nextCursor,
    required this.fetchedAtUtc,
    required this.maxAgeSeconds,
    required this.staleWhileRevalidateSeconds,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['query'] = Variable<String>(query);
    map['limit'] = Variable<int>(limit);
    if (!nullToAbsent || cursor != null) {
      map['cursor'] = Variable<String>(cursor);
    }
    map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc);
    if (!nullToAbsent || nextCursor != null) {
      map['next_cursor'] = Variable<String>(nextCursor);
    }
    map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc);
    map['max_age_seconds'] = Variable<int>(maxAgeSeconds);
    map['stale_while_revalidate_seconds'] = Variable<int>(
      staleWhileRevalidateSeconds,
    );
    return map;
  }

  LocationSearchPagesCompanion toCompanion(bool nullToAbsent) {
    return LocationSearchPagesCompanion(
      cacheKey: Value(cacheKey),
      query: Value(query),
      limit: Value(limit),
      cursor: cursor == null && nullToAbsent
          ? const Value.absent()
          : Value(cursor),
      generatedAtUtc: Value(generatedAtUtc),
      nextCursor: nextCursor == null && nullToAbsent
          ? const Value.absent()
          : Value(nextCursor),
      fetchedAtUtc: Value(fetchedAtUtc),
      maxAgeSeconds: Value(maxAgeSeconds),
      staleWhileRevalidateSeconds: Value(staleWhileRevalidateSeconds),
    );
  }

  factory LocationSearchPage.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocationSearchPage(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      query: serializer.fromJson<String>(json['query']),
      limit: serializer.fromJson<int>(json['limit']),
      cursor: serializer.fromJson<String?>(json['cursor']),
      generatedAtUtc: serializer.fromJson<DateTime>(json['generatedAtUtc']),
      nextCursor: serializer.fromJson<String?>(json['nextCursor']),
      fetchedAtUtc: serializer.fromJson<DateTime>(json['fetchedAtUtc']),
      maxAgeSeconds: serializer.fromJson<int>(json['maxAgeSeconds']),
      staleWhileRevalidateSeconds: serializer.fromJson<int>(
        json['staleWhileRevalidateSeconds'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'query': serializer.toJson<String>(query),
      'limit': serializer.toJson<int>(limit),
      'cursor': serializer.toJson<String?>(cursor),
      'generatedAtUtc': serializer.toJson<DateTime>(generatedAtUtc),
      'nextCursor': serializer.toJson<String?>(nextCursor),
      'fetchedAtUtc': serializer.toJson<DateTime>(fetchedAtUtc),
      'maxAgeSeconds': serializer.toJson<int>(maxAgeSeconds),
      'staleWhileRevalidateSeconds': serializer.toJson<int>(
        staleWhileRevalidateSeconds,
      ),
    };
  }

  LocationSearchPage copyWith({
    String? cacheKey,
    String? query,
    int? limit,
    Value<String?> cursor = const Value.absent(),
    DateTime? generatedAtUtc,
    Value<String?> nextCursor = const Value.absent(),
    DateTime? fetchedAtUtc,
    int? maxAgeSeconds,
    int? staleWhileRevalidateSeconds,
  }) => LocationSearchPage(
    cacheKey: cacheKey ?? this.cacheKey,
    query: query ?? this.query,
    limit: limit ?? this.limit,
    cursor: cursor.present ? cursor.value : this.cursor,
    generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
    nextCursor: nextCursor.present ? nextCursor.value : this.nextCursor,
    fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
    maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
    staleWhileRevalidateSeconds:
        staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
  );
  LocationSearchPage copyWithCompanion(LocationSearchPagesCompanion data) {
    return LocationSearchPage(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      query: data.query.present ? data.query.value : this.query,
      limit: data.limit.present ? data.limit.value : this.limit,
      cursor: data.cursor.present ? data.cursor.value : this.cursor,
      generatedAtUtc: data.generatedAtUtc.present
          ? data.generatedAtUtc.value
          : this.generatedAtUtc,
      nextCursor: data.nextCursor.present
          ? data.nextCursor.value
          : this.nextCursor,
      fetchedAtUtc: data.fetchedAtUtc.present
          ? data.fetchedAtUtc.value
          : this.fetchedAtUtc,
      maxAgeSeconds: data.maxAgeSeconds.present
          ? data.maxAgeSeconds.value
          : this.maxAgeSeconds,
      staleWhileRevalidateSeconds: data.staleWhileRevalidateSeconds.present
          ? data.staleWhileRevalidateSeconds.value
          : this.staleWhileRevalidateSeconds,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocationSearchPage(')
          ..write('cacheKey: $cacheKey, ')
          ..write('query: $query, ')
          ..write('limit: $limit, ')
          ..write('cursor: $cursor, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('nextCursor: $nextCursor, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    cacheKey,
    query,
    limit,
    cursor,
    generatedAtUtc,
    nextCursor,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocationSearchPage &&
          other.cacheKey == this.cacheKey &&
          other.query == this.query &&
          other.limit == this.limit &&
          other.cursor == this.cursor &&
          other.generatedAtUtc == this.generatedAtUtc &&
          other.nextCursor == this.nextCursor &&
          other.fetchedAtUtc == this.fetchedAtUtc &&
          other.maxAgeSeconds == this.maxAgeSeconds &&
          other.staleWhileRevalidateSeconds ==
              this.staleWhileRevalidateSeconds);
}

class LocationSearchPagesCompanion extends UpdateCompanion<LocationSearchPage> {
  final Value<String> cacheKey;
  final Value<String> query;
  final Value<int> limit;
  final Value<String?> cursor;
  final Value<DateTime> generatedAtUtc;
  final Value<String?> nextCursor;
  final Value<DateTime> fetchedAtUtc;
  final Value<int> maxAgeSeconds;
  final Value<int> staleWhileRevalidateSeconds;
  final Value<int> rowid;
  const LocationSearchPagesCompanion({
    this.cacheKey = const Value.absent(),
    this.query = const Value.absent(),
    this.limit = const Value.absent(),
    this.cursor = const Value.absent(),
    this.generatedAtUtc = const Value.absent(),
    this.nextCursor = const Value.absent(),
    this.fetchedAtUtc = const Value.absent(),
    this.maxAgeSeconds = const Value.absent(),
    this.staleWhileRevalidateSeconds = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocationSearchPagesCompanion.insert({
    required String cacheKey,
    required String query,
    required int limit,
    this.cursor = const Value.absent(),
    required DateTime generatedAtUtc,
    this.nextCursor = const Value.absent(),
    required DateTime fetchedAtUtc,
    required int maxAgeSeconds,
    required int staleWhileRevalidateSeconds,
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       query = Value(query),
       limit = Value(limit),
       generatedAtUtc = Value(generatedAtUtc),
       fetchedAtUtc = Value(fetchedAtUtc),
       maxAgeSeconds = Value(maxAgeSeconds),
       staleWhileRevalidateSeconds = Value(staleWhileRevalidateSeconds);
  static Insertable<LocationSearchPage> custom({
    Expression<String>? cacheKey,
    Expression<String>? query,
    Expression<int>? limit,
    Expression<String>? cursor,
    Expression<DateTime>? generatedAtUtc,
    Expression<String>? nextCursor,
    Expression<DateTime>? fetchedAtUtc,
    Expression<int>? maxAgeSeconds,
    Expression<int>? staleWhileRevalidateSeconds,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (query != null) 'query': query,
      if (limit != null) 'limit': limit,
      if (cursor != null) 'cursor': cursor,
      if (generatedAtUtc != null) 'generated_at_utc': generatedAtUtc,
      if (nextCursor != null) 'next_cursor': nextCursor,
      if (fetchedAtUtc != null) 'fetched_at_utc': fetchedAtUtc,
      if (maxAgeSeconds != null) 'max_age_seconds': maxAgeSeconds,
      if (staleWhileRevalidateSeconds != null)
        'stale_while_revalidate_seconds': staleWhileRevalidateSeconds,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocationSearchPagesCompanion copyWith({
    Value<String>? cacheKey,
    Value<String>? query,
    Value<int>? limit,
    Value<String?>? cursor,
    Value<DateTime>? generatedAtUtc,
    Value<String?>? nextCursor,
    Value<DateTime>? fetchedAtUtc,
    Value<int>? maxAgeSeconds,
    Value<int>? staleWhileRevalidateSeconds,
    Value<int>? rowid,
  }) {
    return LocationSearchPagesCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      query: query ?? this.query,
      limit: limit ?? this.limit,
      cursor: cursor ?? this.cursor,
      generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
      nextCursor: nextCursor ?? this.nextCursor,
      fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
      maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
      staleWhileRevalidateSeconds:
          staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (query.present) {
      map['query'] = Variable<String>(query.value);
    }
    if (limit.present) {
      map['limit'] = Variable<int>(limit.value);
    }
    if (cursor.present) {
      map['cursor'] = Variable<String>(cursor.value);
    }
    if (generatedAtUtc.present) {
      map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc.value);
    }
    if (nextCursor.present) {
      map['next_cursor'] = Variable<String>(nextCursor.value);
    }
    if (fetchedAtUtc.present) {
      map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc.value);
    }
    if (maxAgeSeconds.present) {
      map['max_age_seconds'] = Variable<int>(maxAgeSeconds.value);
    }
    if (staleWhileRevalidateSeconds.present) {
      map['stale_while_revalidate_seconds'] = Variable<int>(
        staleWhileRevalidateSeconds.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocationSearchPagesCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('query: $query, ')
          ..write('limit: $limit, ')
          ..write('cursor: $cursor, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('nextCursor: $nextCursor, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocationSearchPageItemsTable extends LocationSearchPageItems
    with TableInfo<$LocationSearchPageItemsTable, LocationSearchPageItem> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocationSearchPageItemsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES location_search_pages (cache_key) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _ordinalMeta = const VerificationMeta(
    'ordinal',
  );
  @override
  late final GeneratedColumn<int> ordinal = GeneratedColumn<int>(
    'ordinal',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES stations (id)',
    ),
  );
  @override
  List<GeneratedColumn> get $columns => [cacheKey, ordinal, stationId];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'location_search_page_items';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocationSearchPageItem> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('ordinal')) {
      context.handle(
        _ordinalMeta,
        ordinal.isAcceptableOrUnknown(data['ordinal']!, _ordinalMeta),
      );
    } else if (isInserting) {
      context.missing(_ordinalMeta);
    }
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey, ordinal};
  @override
  LocationSearchPageItem map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocationSearchPageItem(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      ordinal: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}ordinal'],
      )!,
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
    );
  }

  @override
  $LocationSearchPageItemsTable createAlias(String alias) {
    return $LocationSearchPageItemsTable(attachedDatabase, alias);
  }
}

class LocationSearchPageItem extends DataClass
    implements Insertable<LocationSearchPageItem> {
  final String cacheKey;
  final int ordinal;
  final String stationId;
  const LocationSearchPageItem({
    required this.cacheKey,
    required this.ordinal,
    required this.stationId,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['ordinal'] = Variable<int>(ordinal);
    map['station_id'] = Variable<String>(stationId);
    return map;
  }

  LocationSearchPageItemsCompanion toCompanion(bool nullToAbsent) {
    return LocationSearchPageItemsCompanion(
      cacheKey: Value(cacheKey),
      ordinal: Value(ordinal),
      stationId: Value(stationId),
    );
  }

  factory LocationSearchPageItem.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocationSearchPageItem(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      ordinal: serializer.fromJson<int>(json['ordinal']),
      stationId: serializer.fromJson<String>(json['stationId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'ordinal': serializer.toJson<int>(ordinal),
      'stationId': serializer.toJson<String>(stationId),
    };
  }

  LocationSearchPageItem copyWith({
    String? cacheKey,
    int? ordinal,
    String? stationId,
  }) => LocationSearchPageItem(
    cacheKey: cacheKey ?? this.cacheKey,
    ordinal: ordinal ?? this.ordinal,
    stationId: stationId ?? this.stationId,
  );
  LocationSearchPageItem copyWithCompanion(
    LocationSearchPageItemsCompanion data,
  ) {
    return LocationSearchPageItem(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      ordinal: data.ordinal.present ? data.ordinal.value : this.ordinal,
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocationSearchPageItem(')
          ..write('cacheKey: $cacheKey, ')
          ..write('ordinal: $ordinal, ')
          ..write('stationId: $stationId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(cacheKey, ordinal, stationId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocationSearchPageItem &&
          other.cacheKey == this.cacheKey &&
          other.ordinal == this.ordinal &&
          other.stationId == this.stationId);
}

class LocationSearchPageItemsCompanion
    extends UpdateCompanion<LocationSearchPageItem> {
  final Value<String> cacheKey;
  final Value<int> ordinal;
  final Value<String> stationId;
  final Value<int> rowid;
  const LocationSearchPageItemsCompanion({
    this.cacheKey = const Value.absent(),
    this.ordinal = const Value.absent(),
    this.stationId = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocationSearchPageItemsCompanion.insert({
    required String cacheKey,
    required int ordinal,
    required String stationId,
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       ordinal = Value(ordinal),
       stationId = Value(stationId);
  static Insertable<LocationSearchPageItem> custom({
    Expression<String>? cacheKey,
    Expression<int>? ordinal,
    Expression<String>? stationId,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (ordinal != null) 'ordinal': ordinal,
      if (stationId != null) 'station_id': stationId,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocationSearchPageItemsCompanion copyWith({
    Value<String>? cacheKey,
    Value<int>? ordinal,
    Value<String>? stationId,
    Value<int>? rowid,
  }) {
    return LocationSearchPageItemsCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      ordinal: ordinal ?? this.ordinal,
      stationId: stationId ?? this.stationId,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (ordinal.present) {
      map['ordinal'] = Variable<int>(ordinal.value);
    }
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocationSearchPageItemsCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('ordinal: $ordinal, ')
          ..write('stationId: $stationId, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TideSeriesTable extends TideSeries
    with TableInfo<$TideSeriesTable, TideSery> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TideSeriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES stations (id)',
    ),
  );
  static const VerificationMeta _startUtcMeta = const VerificationMeta(
    'startUtc',
  );
  @override
  late final GeneratedColumn<DateTime> startUtc = GeneratedColumn<DateTime>(
    'start_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _endUtcMeta = const VerificationMeta('endUtc');
  @override
  late final GeneratedColumn<DateTime> endUtc = GeneratedColumn<DateTime>(
    'end_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _intervalSecondsMeta = const VerificationMeta(
    'intervalSeconds',
  );
  @override
  late final GeneratedColumn<int> intervalSeconds = GeneratedColumn<int>(
    'interval_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _modelIdMeta = const VerificationMeta(
    'modelId',
  );
  @override
  late final GeneratedColumn<String> modelId = GeneratedColumn<String>(
    'model_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _modelVersionMeta = const VerificationMeta(
    'modelVersion',
  );
  @override
  late final GeneratedColumn<String> modelVersion = GeneratedColumn<String>(
    'model_version',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _datumIdMeta = const VerificationMeta(
    'datumId',
  );
  @override
  late final GeneratedColumn<String> datumId = GeneratedColumn<String>(
    'datum_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _unitMeta = const VerificationMeta('unit');
  @override
  late final GeneratedColumn<String> unit = GeneratedColumn<String>(
    'unit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _timeZoneMeta = const VerificationMeta(
    'timeZone',
  );
  @override
  late final GeneratedColumn<String> timeZone = GeneratedColumn<String>(
    'time_zone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _phaseConventionMeta = const VerificationMeta(
    'phaseConvention',
  );
  @override
  late final GeneratedColumn<String> phaseConvention = GeneratedColumn<String>(
    'phase_convention',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _referenceEpochUtcMeta = const VerificationMeta(
    'referenceEpochUtc',
  );
  @override
  late final GeneratedColumn<DateTime> referenceEpochUtc =
      GeneratedColumn<DateTime>(
        'reference_epoch_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _constituentCountMeta = const VerificationMeta(
    'constituentCount',
  );
  @override
  late final GeneratedColumn<int> constituentCount = GeneratedColumn<int>(
    'constituent_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _provenanceSourceKeyMeta =
      const VerificationMeta('provenanceSourceKey');
  @override
  late final GeneratedColumn<String> provenanceSourceKey =
      GeneratedColumn<String>(
        'provenance_source_key',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _provenanceImportRunIdMeta =
      const VerificationMeta('provenanceImportRunId');
  @override
  late final GeneratedColumn<String> provenanceImportRunId =
      GeneratedColumn<String>(
        'provenance_import_run_id',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _generatedAtUtcMeta = const VerificationMeta(
    'generatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> generatedAtUtc =
      GeneratedColumn<DateTime>(
        'generated_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _fetchedAtUtcMeta = const VerificationMeta(
    'fetchedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAtUtc = GeneratedColumn<DateTime>(
    'fetched_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _maxAgeSecondsMeta = const VerificationMeta(
    'maxAgeSeconds',
  );
  @override
  late final GeneratedColumn<int> maxAgeSeconds = GeneratedColumn<int>(
    'max_age_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _staleWhileRevalidateSecondsMeta =
      const VerificationMeta('staleWhileRevalidateSeconds');
  @override
  late final GeneratedColumn<int> staleWhileRevalidateSeconds =
      GeneratedColumn<int>(
        'stale_while_revalidate_seconds',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    cacheKey,
    stationId,
    startUtc,
    endUtc,
    intervalSeconds,
    modelId,
    modelVersion,
    datumId,
    unit,
    timeZone,
    phaseConvention,
    referenceEpochUtc,
    constituentCount,
    provenanceSourceKey,
    provenanceImportRunId,
    generatedAtUtc,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'tide_series';
  @override
  VerificationContext validateIntegrity(
    Insertable<TideSery> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    if (data.containsKey('start_utc')) {
      context.handle(
        _startUtcMeta,
        startUtc.isAcceptableOrUnknown(data['start_utc']!, _startUtcMeta),
      );
    } else if (isInserting) {
      context.missing(_startUtcMeta);
    }
    if (data.containsKey('end_utc')) {
      context.handle(
        _endUtcMeta,
        endUtc.isAcceptableOrUnknown(data['end_utc']!, _endUtcMeta),
      );
    } else if (isInserting) {
      context.missing(_endUtcMeta);
    }
    if (data.containsKey('interval_seconds')) {
      context.handle(
        _intervalSecondsMeta,
        intervalSeconds.isAcceptableOrUnknown(
          data['interval_seconds']!,
          _intervalSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_intervalSecondsMeta);
    }
    if (data.containsKey('model_id')) {
      context.handle(
        _modelIdMeta,
        modelId.isAcceptableOrUnknown(data['model_id']!, _modelIdMeta),
      );
    } else if (isInserting) {
      context.missing(_modelIdMeta);
    }
    if (data.containsKey('model_version')) {
      context.handle(
        _modelVersionMeta,
        modelVersion.isAcceptableOrUnknown(
          data['model_version']!,
          _modelVersionMeta,
        ),
      );
    }
    if (data.containsKey('datum_id')) {
      context.handle(
        _datumIdMeta,
        datumId.isAcceptableOrUnknown(data['datum_id']!, _datumIdMeta),
      );
    } else if (isInserting) {
      context.missing(_datumIdMeta);
    }
    if (data.containsKey('unit')) {
      context.handle(
        _unitMeta,
        unit.isAcceptableOrUnknown(data['unit']!, _unitMeta),
      );
    } else if (isInserting) {
      context.missing(_unitMeta);
    }
    if (data.containsKey('time_zone')) {
      context.handle(
        _timeZoneMeta,
        timeZone.isAcceptableOrUnknown(data['time_zone']!, _timeZoneMeta),
      );
    } else if (isInserting) {
      context.missing(_timeZoneMeta);
    }
    if (data.containsKey('phase_convention')) {
      context.handle(
        _phaseConventionMeta,
        phaseConvention.isAcceptableOrUnknown(
          data['phase_convention']!,
          _phaseConventionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_phaseConventionMeta);
    }
    if (data.containsKey('reference_epoch_utc')) {
      context.handle(
        _referenceEpochUtcMeta,
        referenceEpochUtc.isAcceptableOrUnknown(
          data['reference_epoch_utc']!,
          _referenceEpochUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_referenceEpochUtcMeta);
    }
    if (data.containsKey('constituent_count')) {
      context.handle(
        _constituentCountMeta,
        constituentCount.isAcceptableOrUnknown(
          data['constituent_count']!,
          _constituentCountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_constituentCountMeta);
    }
    if (data.containsKey('provenance_source_key')) {
      context.handle(
        _provenanceSourceKeyMeta,
        provenanceSourceKey.isAcceptableOrUnknown(
          data['provenance_source_key']!,
          _provenanceSourceKeyMeta,
        ),
      );
    }
    if (data.containsKey('provenance_import_run_id')) {
      context.handle(
        _provenanceImportRunIdMeta,
        provenanceImportRunId.isAcceptableOrUnknown(
          data['provenance_import_run_id']!,
          _provenanceImportRunIdMeta,
        ),
      );
    }
    if (data.containsKey('generated_at_utc')) {
      context.handle(
        _generatedAtUtcMeta,
        generatedAtUtc.isAcceptableOrUnknown(
          data['generated_at_utc']!,
          _generatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_generatedAtUtcMeta);
    }
    if (data.containsKey('fetched_at_utc')) {
      context.handle(
        _fetchedAtUtcMeta,
        fetchedAtUtc.isAcceptableOrUnknown(
          data['fetched_at_utc']!,
          _fetchedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtUtcMeta);
    }
    if (data.containsKey('max_age_seconds')) {
      context.handle(
        _maxAgeSecondsMeta,
        maxAgeSeconds.isAcceptableOrUnknown(
          data['max_age_seconds']!,
          _maxAgeSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_maxAgeSecondsMeta);
    }
    if (data.containsKey('stale_while_revalidate_seconds')) {
      context.handle(
        _staleWhileRevalidateSecondsMeta,
        staleWhileRevalidateSeconds.isAcceptableOrUnknown(
          data['stale_while_revalidate_seconds']!,
          _staleWhileRevalidateSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_staleWhileRevalidateSecondsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey};
  @override
  TideSery map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TideSery(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
      startUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}start_utc'],
      )!,
      endUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}end_utc'],
      )!,
      intervalSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}interval_seconds'],
      )!,
      modelId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model_id'],
      )!,
      modelVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model_version'],
      ),
      datumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}datum_id'],
      )!,
      unit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}unit'],
      )!,
      timeZone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}time_zone'],
      )!,
      phaseConvention: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phase_convention'],
      )!,
      referenceEpochUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}reference_epoch_utc'],
      )!,
      constituentCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}constituent_count'],
      )!,
      provenanceSourceKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_source_key'],
      ),
      provenanceImportRunId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_import_run_id'],
      ),
      generatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}generated_at_utc'],
      )!,
      fetchedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at_utc'],
      )!,
      maxAgeSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}max_age_seconds'],
      )!,
      staleWhileRevalidateSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stale_while_revalidate_seconds'],
      )!,
    );
  }

  @override
  $TideSeriesTable createAlias(String alias) {
    return $TideSeriesTable(attachedDatabase, alias);
  }
}

class TideSery extends DataClass implements Insertable<TideSery> {
  final String cacheKey;
  final String stationId;
  final DateTime startUtc;
  final DateTime endUtc;
  final int intervalSeconds;
  final String modelId;
  final String? modelVersion;
  final String datumId;
  final String unit;
  final String timeZone;
  final String phaseConvention;
  final DateTime referenceEpochUtc;
  final int constituentCount;
  final String? provenanceSourceKey;
  final String? provenanceImportRunId;
  final DateTime generatedAtUtc;
  final DateTime fetchedAtUtc;
  final int maxAgeSeconds;
  final int staleWhileRevalidateSeconds;
  const TideSery({
    required this.cacheKey,
    required this.stationId,
    required this.startUtc,
    required this.endUtc,
    required this.intervalSeconds,
    required this.modelId,
    this.modelVersion,
    required this.datumId,
    required this.unit,
    required this.timeZone,
    required this.phaseConvention,
    required this.referenceEpochUtc,
    required this.constituentCount,
    this.provenanceSourceKey,
    this.provenanceImportRunId,
    required this.generatedAtUtc,
    required this.fetchedAtUtc,
    required this.maxAgeSeconds,
    required this.staleWhileRevalidateSeconds,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['station_id'] = Variable<String>(stationId);
    map['start_utc'] = Variable<DateTime>(startUtc);
    map['end_utc'] = Variable<DateTime>(endUtc);
    map['interval_seconds'] = Variable<int>(intervalSeconds);
    map['model_id'] = Variable<String>(modelId);
    if (!nullToAbsent || modelVersion != null) {
      map['model_version'] = Variable<String>(modelVersion);
    }
    map['datum_id'] = Variable<String>(datumId);
    map['unit'] = Variable<String>(unit);
    map['time_zone'] = Variable<String>(timeZone);
    map['phase_convention'] = Variable<String>(phaseConvention);
    map['reference_epoch_utc'] = Variable<DateTime>(referenceEpochUtc);
    map['constituent_count'] = Variable<int>(constituentCount);
    if (!nullToAbsent || provenanceSourceKey != null) {
      map['provenance_source_key'] = Variable<String>(provenanceSourceKey);
    }
    if (!nullToAbsent || provenanceImportRunId != null) {
      map['provenance_import_run_id'] = Variable<String>(provenanceImportRunId);
    }
    map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc);
    map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc);
    map['max_age_seconds'] = Variable<int>(maxAgeSeconds);
    map['stale_while_revalidate_seconds'] = Variable<int>(
      staleWhileRevalidateSeconds,
    );
    return map;
  }

  TideSeriesCompanion toCompanion(bool nullToAbsent) {
    return TideSeriesCompanion(
      cacheKey: Value(cacheKey),
      stationId: Value(stationId),
      startUtc: Value(startUtc),
      endUtc: Value(endUtc),
      intervalSeconds: Value(intervalSeconds),
      modelId: Value(modelId),
      modelVersion: modelVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(modelVersion),
      datumId: Value(datumId),
      unit: Value(unit),
      timeZone: Value(timeZone),
      phaseConvention: Value(phaseConvention),
      referenceEpochUtc: Value(referenceEpochUtc),
      constituentCount: Value(constituentCount),
      provenanceSourceKey: provenanceSourceKey == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceSourceKey),
      provenanceImportRunId: provenanceImportRunId == null && nullToAbsent
          ? const Value.absent()
          : Value(provenanceImportRunId),
      generatedAtUtc: Value(generatedAtUtc),
      fetchedAtUtc: Value(fetchedAtUtc),
      maxAgeSeconds: Value(maxAgeSeconds),
      staleWhileRevalidateSeconds: Value(staleWhileRevalidateSeconds),
    );
  }

  factory TideSery.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TideSery(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      stationId: serializer.fromJson<String>(json['stationId']),
      startUtc: serializer.fromJson<DateTime>(json['startUtc']),
      endUtc: serializer.fromJson<DateTime>(json['endUtc']),
      intervalSeconds: serializer.fromJson<int>(json['intervalSeconds']),
      modelId: serializer.fromJson<String>(json['modelId']),
      modelVersion: serializer.fromJson<String?>(json['modelVersion']),
      datumId: serializer.fromJson<String>(json['datumId']),
      unit: serializer.fromJson<String>(json['unit']),
      timeZone: serializer.fromJson<String>(json['timeZone']),
      phaseConvention: serializer.fromJson<String>(json['phaseConvention']),
      referenceEpochUtc: serializer.fromJson<DateTime>(
        json['referenceEpochUtc'],
      ),
      constituentCount: serializer.fromJson<int>(json['constituentCount']),
      provenanceSourceKey: serializer.fromJson<String?>(
        json['provenanceSourceKey'],
      ),
      provenanceImportRunId: serializer.fromJson<String?>(
        json['provenanceImportRunId'],
      ),
      generatedAtUtc: serializer.fromJson<DateTime>(json['generatedAtUtc']),
      fetchedAtUtc: serializer.fromJson<DateTime>(json['fetchedAtUtc']),
      maxAgeSeconds: serializer.fromJson<int>(json['maxAgeSeconds']),
      staleWhileRevalidateSeconds: serializer.fromJson<int>(
        json['staleWhileRevalidateSeconds'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'stationId': serializer.toJson<String>(stationId),
      'startUtc': serializer.toJson<DateTime>(startUtc),
      'endUtc': serializer.toJson<DateTime>(endUtc),
      'intervalSeconds': serializer.toJson<int>(intervalSeconds),
      'modelId': serializer.toJson<String>(modelId),
      'modelVersion': serializer.toJson<String?>(modelVersion),
      'datumId': serializer.toJson<String>(datumId),
      'unit': serializer.toJson<String>(unit),
      'timeZone': serializer.toJson<String>(timeZone),
      'phaseConvention': serializer.toJson<String>(phaseConvention),
      'referenceEpochUtc': serializer.toJson<DateTime>(referenceEpochUtc),
      'constituentCount': serializer.toJson<int>(constituentCount),
      'provenanceSourceKey': serializer.toJson<String?>(provenanceSourceKey),
      'provenanceImportRunId': serializer.toJson<String?>(
        provenanceImportRunId,
      ),
      'generatedAtUtc': serializer.toJson<DateTime>(generatedAtUtc),
      'fetchedAtUtc': serializer.toJson<DateTime>(fetchedAtUtc),
      'maxAgeSeconds': serializer.toJson<int>(maxAgeSeconds),
      'staleWhileRevalidateSeconds': serializer.toJson<int>(
        staleWhileRevalidateSeconds,
      ),
    };
  }

  TideSery copyWith({
    String? cacheKey,
    String? stationId,
    DateTime? startUtc,
    DateTime? endUtc,
    int? intervalSeconds,
    String? modelId,
    Value<String?> modelVersion = const Value.absent(),
    String? datumId,
    String? unit,
    String? timeZone,
    String? phaseConvention,
    DateTime? referenceEpochUtc,
    int? constituentCount,
    Value<String?> provenanceSourceKey = const Value.absent(),
    Value<String?> provenanceImportRunId = const Value.absent(),
    DateTime? generatedAtUtc,
    DateTime? fetchedAtUtc,
    int? maxAgeSeconds,
    int? staleWhileRevalidateSeconds,
  }) => TideSery(
    cacheKey: cacheKey ?? this.cacheKey,
    stationId: stationId ?? this.stationId,
    startUtc: startUtc ?? this.startUtc,
    endUtc: endUtc ?? this.endUtc,
    intervalSeconds: intervalSeconds ?? this.intervalSeconds,
    modelId: modelId ?? this.modelId,
    modelVersion: modelVersion.present ? modelVersion.value : this.modelVersion,
    datumId: datumId ?? this.datumId,
    unit: unit ?? this.unit,
    timeZone: timeZone ?? this.timeZone,
    phaseConvention: phaseConvention ?? this.phaseConvention,
    referenceEpochUtc: referenceEpochUtc ?? this.referenceEpochUtc,
    constituentCount: constituentCount ?? this.constituentCount,
    provenanceSourceKey: provenanceSourceKey.present
        ? provenanceSourceKey.value
        : this.provenanceSourceKey,
    provenanceImportRunId: provenanceImportRunId.present
        ? provenanceImportRunId.value
        : this.provenanceImportRunId,
    generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
    fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
    maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
    staleWhileRevalidateSeconds:
        staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
  );
  TideSery copyWithCompanion(TideSeriesCompanion data) {
    return TideSery(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
      startUtc: data.startUtc.present ? data.startUtc.value : this.startUtc,
      endUtc: data.endUtc.present ? data.endUtc.value : this.endUtc,
      intervalSeconds: data.intervalSeconds.present
          ? data.intervalSeconds.value
          : this.intervalSeconds,
      modelId: data.modelId.present ? data.modelId.value : this.modelId,
      modelVersion: data.modelVersion.present
          ? data.modelVersion.value
          : this.modelVersion,
      datumId: data.datumId.present ? data.datumId.value : this.datumId,
      unit: data.unit.present ? data.unit.value : this.unit,
      timeZone: data.timeZone.present ? data.timeZone.value : this.timeZone,
      phaseConvention: data.phaseConvention.present
          ? data.phaseConvention.value
          : this.phaseConvention,
      referenceEpochUtc: data.referenceEpochUtc.present
          ? data.referenceEpochUtc.value
          : this.referenceEpochUtc,
      constituentCount: data.constituentCount.present
          ? data.constituentCount.value
          : this.constituentCount,
      provenanceSourceKey: data.provenanceSourceKey.present
          ? data.provenanceSourceKey.value
          : this.provenanceSourceKey,
      provenanceImportRunId: data.provenanceImportRunId.present
          ? data.provenanceImportRunId.value
          : this.provenanceImportRunId,
      generatedAtUtc: data.generatedAtUtc.present
          ? data.generatedAtUtc.value
          : this.generatedAtUtc,
      fetchedAtUtc: data.fetchedAtUtc.present
          ? data.fetchedAtUtc.value
          : this.fetchedAtUtc,
      maxAgeSeconds: data.maxAgeSeconds.present
          ? data.maxAgeSeconds.value
          : this.maxAgeSeconds,
      staleWhileRevalidateSeconds: data.staleWhileRevalidateSeconds.present
          ? data.staleWhileRevalidateSeconds.value
          : this.staleWhileRevalidateSeconds,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TideSery(')
          ..write('cacheKey: $cacheKey, ')
          ..write('stationId: $stationId, ')
          ..write('startUtc: $startUtc, ')
          ..write('endUtc: $endUtc, ')
          ..write('intervalSeconds: $intervalSeconds, ')
          ..write('modelId: $modelId, ')
          ..write('modelVersion: $modelVersion, ')
          ..write('datumId: $datumId, ')
          ..write('unit: $unit, ')
          ..write('timeZone: $timeZone, ')
          ..write('phaseConvention: $phaseConvention, ')
          ..write('referenceEpochUtc: $referenceEpochUtc, ')
          ..write('constituentCount: $constituentCount, ')
          ..write('provenanceSourceKey: $provenanceSourceKey, ')
          ..write('provenanceImportRunId: $provenanceImportRunId, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    cacheKey,
    stationId,
    startUtc,
    endUtc,
    intervalSeconds,
    modelId,
    modelVersion,
    datumId,
    unit,
    timeZone,
    phaseConvention,
    referenceEpochUtc,
    constituentCount,
    provenanceSourceKey,
    provenanceImportRunId,
    generatedAtUtc,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TideSery &&
          other.cacheKey == this.cacheKey &&
          other.stationId == this.stationId &&
          other.startUtc == this.startUtc &&
          other.endUtc == this.endUtc &&
          other.intervalSeconds == this.intervalSeconds &&
          other.modelId == this.modelId &&
          other.modelVersion == this.modelVersion &&
          other.datumId == this.datumId &&
          other.unit == this.unit &&
          other.timeZone == this.timeZone &&
          other.phaseConvention == this.phaseConvention &&
          other.referenceEpochUtc == this.referenceEpochUtc &&
          other.constituentCount == this.constituentCount &&
          other.provenanceSourceKey == this.provenanceSourceKey &&
          other.provenanceImportRunId == this.provenanceImportRunId &&
          other.generatedAtUtc == this.generatedAtUtc &&
          other.fetchedAtUtc == this.fetchedAtUtc &&
          other.maxAgeSeconds == this.maxAgeSeconds &&
          other.staleWhileRevalidateSeconds ==
              this.staleWhileRevalidateSeconds);
}

class TideSeriesCompanion extends UpdateCompanion<TideSery> {
  final Value<String> cacheKey;
  final Value<String> stationId;
  final Value<DateTime> startUtc;
  final Value<DateTime> endUtc;
  final Value<int> intervalSeconds;
  final Value<String> modelId;
  final Value<String?> modelVersion;
  final Value<String> datumId;
  final Value<String> unit;
  final Value<String> timeZone;
  final Value<String> phaseConvention;
  final Value<DateTime> referenceEpochUtc;
  final Value<int> constituentCount;
  final Value<String?> provenanceSourceKey;
  final Value<String?> provenanceImportRunId;
  final Value<DateTime> generatedAtUtc;
  final Value<DateTime> fetchedAtUtc;
  final Value<int> maxAgeSeconds;
  final Value<int> staleWhileRevalidateSeconds;
  final Value<int> rowid;
  const TideSeriesCompanion({
    this.cacheKey = const Value.absent(),
    this.stationId = const Value.absent(),
    this.startUtc = const Value.absent(),
    this.endUtc = const Value.absent(),
    this.intervalSeconds = const Value.absent(),
    this.modelId = const Value.absent(),
    this.modelVersion = const Value.absent(),
    this.datumId = const Value.absent(),
    this.unit = const Value.absent(),
    this.timeZone = const Value.absent(),
    this.phaseConvention = const Value.absent(),
    this.referenceEpochUtc = const Value.absent(),
    this.constituentCount = const Value.absent(),
    this.provenanceSourceKey = const Value.absent(),
    this.provenanceImportRunId = const Value.absent(),
    this.generatedAtUtc = const Value.absent(),
    this.fetchedAtUtc = const Value.absent(),
    this.maxAgeSeconds = const Value.absent(),
    this.staleWhileRevalidateSeconds = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TideSeriesCompanion.insert({
    required String cacheKey,
    required String stationId,
    required DateTime startUtc,
    required DateTime endUtc,
    required int intervalSeconds,
    required String modelId,
    this.modelVersion = const Value.absent(),
    required String datumId,
    required String unit,
    required String timeZone,
    required String phaseConvention,
    required DateTime referenceEpochUtc,
    required int constituentCount,
    this.provenanceSourceKey = const Value.absent(),
    this.provenanceImportRunId = const Value.absent(),
    required DateTime generatedAtUtc,
    required DateTime fetchedAtUtc,
    required int maxAgeSeconds,
    required int staleWhileRevalidateSeconds,
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       stationId = Value(stationId),
       startUtc = Value(startUtc),
       endUtc = Value(endUtc),
       intervalSeconds = Value(intervalSeconds),
       modelId = Value(modelId),
       datumId = Value(datumId),
       unit = Value(unit),
       timeZone = Value(timeZone),
       phaseConvention = Value(phaseConvention),
       referenceEpochUtc = Value(referenceEpochUtc),
       constituentCount = Value(constituentCount),
       generatedAtUtc = Value(generatedAtUtc),
       fetchedAtUtc = Value(fetchedAtUtc),
       maxAgeSeconds = Value(maxAgeSeconds),
       staleWhileRevalidateSeconds = Value(staleWhileRevalidateSeconds);
  static Insertable<TideSery> custom({
    Expression<String>? cacheKey,
    Expression<String>? stationId,
    Expression<DateTime>? startUtc,
    Expression<DateTime>? endUtc,
    Expression<int>? intervalSeconds,
    Expression<String>? modelId,
    Expression<String>? modelVersion,
    Expression<String>? datumId,
    Expression<String>? unit,
    Expression<String>? timeZone,
    Expression<String>? phaseConvention,
    Expression<DateTime>? referenceEpochUtc,
    Expression<int>? constituentCount,
    Expression<String>? provenanceSourceKey,
    Expression<String>? provenanceImportRunId,
    Expression<DateTime>? generatedAtUtc,
    Expression<DateTime>? fetchedAtUtc,
    Expression<int>? maxAgeSeconds,
    Expression<int>? staleWhileRevalidateSeconds,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (stationId != null) 'station_id': stationId,
      if (startUtc != null) 'start_utc': startUtc,
      if (endUtc != null) 'end_utc': endUtc,
      if (intervalSeconds != null) 'interval_seconds': intervalSeconds,
      if (modelId != null) 'model_id': modelId,
      if (modelVersion != null) 'model_version': modelVersion,
      if (datumId != null) 'datum_id': datumId,
      if (unit != null) 'unit': unit,
      if (timeZone != null) 'time_zone': timeZone,
      if (phaseConvention != null) 'phase_convention': phaseConvention,
      if (referenceEpochUtc != null) 'reference_epoch_utc': referenceEpochUtc,
      if (constituentCount != null) 'constituent_count': constituentCount,
      if (provenanceSourceKey != null)
        'provenance_source_key': provenanceSourceKey,
      if (provenanceImportRunId != null)
        'provenance_import_run_id': provenanceImportRunId,
      if (generatedAtUtc != null) 'generated_at_utc': generatedAtUtc,
      if (fetchedAtUtc != null) 'fetched_at_utc': fetchedAtUtc,
      if (maxAgeSeconds != null) 'max_age_seconds': maxAgeSeconds,
      if (staleWhileRevalidateSeconds != null)
        'stale_while_revalidate_seconds': staleWhileRevalidateSeconds,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TideSeriesCompanion copyWith({
    Value<String>? cacheKey,
    Value<String>? stationId,
    Value<DateTime>? startUtc,
    Value<DateTime>? endUtc,
    Value<int>? intervalSeconds,
    Value<String>? modelId,
    Value<String?>? modelVersion,
    Value<String>? datumId,
    Value<String>? unit,
    Value<String>? timeZone,
    Value<String>? phaseConvention,
    Value<DateTime>? referenceEpochUtc,
    Value<int>? constituentCount,
    Value<String?>? provenanceSourceKey,
    Value<String?>? provenanceImportRunId,
    Value<DateTime>? generatedAtUtc,
    Value<DateTime>? fetchedAtUtc,
    Value<int>? maxAgeSeconds,
    Value<int>? staleWhileRevalidateSeconds,
    Value<int>? rowid,
  }) {
    return TideSeriesCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      stationId: stationId ?? this.stationId,
      startUtc: startUtc ?? this.startUtc,
      endUtc: endUtc ?? this.endUtc,
      intervalSeconds: intervalSeconds ?? this.intervalSeconds,
      modelId: modelId ?? this.modelId,
      modelVersion: modelVersion ?? this.modelVersion,
      datumId: datumId ?? this.datumId,
      unit: unit ?? this.unit,
      timeZone: timeZone ?? this.timeZone,
      phaseConvention: phaseConvention ?? this.phaseConvention,
      referenceEpochUtc: referenceEpochUtc ?? this.referenceEpochUtc,
      constituentCount: constituentCount ?? this.constituentCount,
      provenanceSourceKey: provenanceSourceKey ?? this.provenanceSourceKey,
      provenanceImportRunId:
          provenanceImportRunId ?? this.provenanceImportRunId,
      generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
      fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
      maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
      staleWhileRevalidateSeconds:
          staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (startUtc.present) {
      map['start_utc'] = Variable<DateTime>(startUtc.value);
    }
    if (endUtc.present) {
      map['end_utc'] = Variable<DateTime>(endUtc.value);
    }
    if (intervalSeconds.present) {
      map['interval_seconds'] = Variable<int>(intervalSeconds.value);
    }
    if (modelId.present) {
      map['model_id'] = Variable<String>(modelId.value);
    }
    if (modelVersion.present) {
      map['model_version'] = Variable<String>(modelVersion.value);
    }
    if (datumId.present) {
      map['datum_id'] = Variable<String>(datumId.value);
    }
    if (unit.present) {
      map['unit'] = Variable<String>(unit.value);
    }
    if (timeZone.present) {
      map['time_zone'] = Variable<String>(timeZone.value);
    }
    if (phaseConvention.present) {
      map['phase_convention'] = Variable<String>(phaseConvention.value);
    }
    if (referenceEpochUtc.present) {
      map['reference_epoch_utc'] = Variable<DateTime>(referenceEpochUtc.value);
    }
    if (constituentCount.present) {
      map['constituent_count'] = Variable<int>(constituentCount.value);
    }
    if (provenanceSourceKey.present) {
      map['provenance_source_key'] = Variable<String>(
        provenanceSourceKey.value,
      );
    }
    if (provenanceImportRunId.present) {
      map['provenance_import_run_id'] = Variable<String>(
        provenanceImportRunId.value,
      );
    }
    if (generatedAtUtc.present) {
      map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc.value);
    }
    if (fetchedAtUtc.present) {
      map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc.value);
    }
    if (maxAgeSeconds.present) {
      map['max_age_seconds'] = Variable<int>(maxAgeSeconds.value);
    }
    if (staleWhileRevalidateSeconds.present) {
      map['stale_while_revalidate_seconds'] = Variable<int>(
        staleWhileRevalidateSeconds.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TideSeriesCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('stationId: $stationId, ')
          ..write('startUtc: $startUtc, ')
          ..write('endUtc: $endUtc, ')
          ..write('intervalSeconds: $intervalSeconds, ')
          ..write('modelId: $modelId, ')
          ..write('modelVersion: $modelVersion, ')
          ..write('datumId: $datumId, ')
          ..write('unit: $unit, ')
          ..write('timeZone: $timeZone, ')
          ..write('phaseConvention: $phaseConvention, ')
          ..write('referenceEpochUtc: $referenceEpochUtc, ')
          ..write('constituentCount: $constituentCount, ')
          ..write('provenanceSourceKey: $provenanceSourceKey, ')
          ..write('provenanceImportRunId: $provenanceImportRunId, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TidePointsTable extends TidePoints
    with TableInfo<$TidePointsTable, TidePoint> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TidePointsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _seriesKeyMeta = const VerificationMeta(
    'seriesKey',
  );
  @override
  late final GeneratedColumn<String> seriesKey = GeneratedColumn<String>(
    'series_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES tide_series (cache_key) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _timestampUtcMeta = const VerificationMeta(
    'timestampUtc',
  );
  @override
  late final GeneratedColumn<DateTime> timestampUtc = GeneratedColumn<DateTime>(
    'timestamp_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<double> value = GeneratedColumn<double>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [seriesKey, timestampUtc, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'tide_points';
  @override
  VerificationContext validateIntegrity(
    Insertable<TidePoint> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('series_key')) {
      context.handle(
        _seriesKeyMeta,
        seriesKey.isAcceptableOrUnknown(data['series_key']!, _seriesKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_seriesKeyMeta);
    }
    if (data.containsKey('timestamp_utc')) {
      context.handle(
        _timestampUtcMeta,
        timestampUtc.isAcceptableOrUnknown(
          data['timestamp_utc']!,
          _timestampUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_timestampUtcMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {seriesKey, timestampUtc};
  @override
  TidePoint map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TidePoint(
      seriesKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}series_key'],
      )!,
      timestampUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}timestamp_utc'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $TidePointsTable createAlias(String alias) {
    return $TidePointsTable(attachedDatabase, alias);
  }
}

class TidePoint extends DataClass implements Insertable<TidePoint> {
  final String seriesKey;
  final DateTime timestampUtc;
  final double value;
  const TidePoint({
    required this.seriesKey,
    required this.timestampUtc,
    required this.value,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['series_key'] = Variable<String>(seriesKey);
    map['timestamp_utc'] = Variable<DateTime>(timestampUtc);
    map['value'] = Variable<double>(value);
    return map;
  }

  TidePointsCompanion toCompanion(bool nullToAbsent) {
    return TidePointsCompanion(
      seriesKey: Value(seriesKey),
      timestampUtc: Value(timestampUtc),
      value: Value(value),
    );
  }

  factory TidePoint.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TidePoint(
      seriesKey: serializer.fromJson<String>(json['seriesKey']),
      timestampUtc: serializer.fromJson<DateTime>(json['timestampUtc']),
      value: serializer.fromJson<double>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'seriesKey': serializer.toJson<String>(seriesKey),
      'timestampUtc': serializer.toJson<DateTime>(timestampUtc),
      'value': serializer.toJson<double>(value),
    };
  }

  TidePoint copyWith({
    String? seriesKey,
    DateTime? timestampUtc,
    double? value,
  }) => TidePoint(
    seriesKey: seriesKey ?? this.seriesKey,
    timestampUtc: timestampUtc ?? this.timestampUtc,
    value: value ?? this.value,
  );
  TidePoint copyWithCompanion(TidePointsCompanion data) {
    return TidePoint(
      seriesKey: data.seriesKey.present ? data.seriesKey.value : this.seriesKey,
      timestampUtc: data.timestampUtc.present
          ? data.timestampUtc.value
          : this.timestampUtc,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TidePoint(')
          ..write('seriesKey: $seriesKey, ')
          ..write('timestampUtc: $timestampUtc, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(seriesKey, timestampUtc, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TidePoint &&
          other.seriesKey == this.seriesKey &&
          other.timestampUtc == this.timestampUtc &&
          other.value == this.value);
}

class TidePointsCompanion extends UpdateCompanion<TidePoint> {
  final Value<String> seriesKey;
  final Value<DateTime> timestampUtc;
  final Value<double> value;
  final Value<int> rowid;
  const TidePointsCompanion({
    this.seriesKey = const Value.absent(),
    this.timestampUtc = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TidePointsCompanion.insert({
    required String seriesKey,
    required DateTime timestampUtc,
    required double value,
    this.rowid = const Value.absent(),
  }) : seriesKey = Value(seriesKey),
       timestampUtc = Value(timestampUtc),
       value = Value(value);
  static Insertable<TidePoint> custom({
    Expression<String>? seriesKey,
    Expression<DateTime>? timestampUtc,
    Expression<double>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (seriesKey != null) 'series_key': seriesKey,
      if (timestampUtc != null) 'timestamp_utc': timestampUtc,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TidePointsCompanion copyWith({
    Value<String>? seriesKey,
    Value<DateTime>? timestampUtc,
    Value<double>? value,
    Value<int>? rowid,
  }) {
    return TidePointsCompanion(
      seriesKey: seriesKey ?? this.seriesKey,
      timestampUtc: timestampUtc ?? this.timestampUtc,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (seriesKey.present) {
      map['series_key'] = Variable<String>(seriesKey.value);
    }
    if (timestampUtc.present) {
      map['timestamp_utc'] = Variable<DateTime>(timestampUtc.value);
    }
    if (value.present) {
      map['value'] = Variable<double>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TidePointsCompanion(')
          ..write('seriesKey: $seriesKey, ')
          ..write('timestampUtc: $timestampUtc, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $WaterLevelPagesTable extends WaterLevelPages
    with TableInfo<$WaterLevelPagesTable, WaterLevelPage> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WaterLevelPagesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stationNameMeta = const VerificationMeta(
    'stationName',
  );
  @override
  late final GeneratedColumn<String> stationName = GeneratedColumn<String>(
    'station_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _timeZoneMeta = const VerificationMeta(
    'timeZone',
  );
  @override
  late final GeneratedColumn<String> timeZone = GeneratedColumn<String>(
    'time_zone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _defaultDatumIdMeta = const VerificationMeta(
    'defaultDatumId',
  );
  @override
  late final GeneratedColumn<String> defaultDatumId = GeneratedColumn<String>(
    'default_datum_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _startUtcMeta = const VerificationMeta(
    'startUtc',
  );
  @override
  late final GeneratedColumn<DateTime> startUtc = GeneratedColumn<DateTime>(
    'start_utc',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _endUtcMeta = const VerificationMeta('endUtc');
  @override
  late final GeneratedColumn<DateTime> endUtc = GeneratedColumn<DateTime>(
    'end_utc',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _limitMeta = const VerificationMeta('limit');
  @override
  late final GeneratedColumn<int> limit = GeneratedColumn<int>(
    'limit',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cursorMeta = const VerificationMeta('cursor');
  @override
  late final GeneratedColumn<String> cursor = GeneratedColumn<String>(
    'cursor',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _generatedAtUtcMeta = const VerificationMeta(
    'generatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> generatedAtUtc =
      GeneratedColumn<DateTime>(
        'generated_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _latestObservedAtUtcMeta =
      const VerificationMeta('latestObservedAtUtc');
  @override
  late final GeneratedColumn<DateTime> latestObservedAtUtc =
      GeneratedColumn<DateTime>(
        'latest_observed_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _nextCursorMeta = const VerificationMeta(
    'nextCursor',
  );
  @override
  late final GeneratedColumn<String> nextCursor = GeneratedColumn<String>(
    'next_cursor',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _fetchedAtUtcMeta = const VerificationMeta(
    'fetchedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAtUtc = GeneratedColumn<DateTime>(
    'fetched_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _maxAgeSecondsMeta = const VerificationMeta(
    'maxAgeSeconds',
  );
  @override
  late final GeneratedColumn<int> maxAgeSeconds = GeneratedColumn<int>(
    'max_age_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _staleWhileRevalidateSecondsMeta =
      const VerificationMeta('staleWhileRevalidateSeconds');
  @override
  late final GeneratedColumn<int> staleWhileRevalidateSeconds =
      GeneratedColumn<int>(
        'stale_while_revalidate_seconds',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    cacheKey,
    stationId,
    stationName,
    timeZone,
    defaultDatumId,
    startUtc,
    endUtc,
    limit,
    cursor,
    generatedAtUtc,
    latestObservedAtUtc,
    nextCursor,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'water_level_pages';
  @override
  VerificationContext validateIntegrity(
    Insertable<WaterLevelPage> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    if (data.containsKey('station_name')) {
      context.handle(
        _stationNameMeta,
        stationName.isAcceptableOrUnknown(
          data['station_name']!,
          _stationNameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_stationNameMeta);
    }
    if (data.containsKey('time_zone')) {
      context.handle(
        _timeZoneMeta,
        timeZone.isAcceptableOrUnknown(data['time_zone']!, _timeZoneMeta),
      );
    } else if (isInserting) {
      context.missing(_timeZoneMeta);
    }
    if (data.containsKey('default_datum_id')) {
      context.handle(
        _defaultDatumIdMeta,
        defaultDatumId.isAcceptableOrUnknown(
          data['default_datum_id']!,
          _defaultDatumIdMeta,
        ),
      );
    }
    if (data.containsKey('start_utc')) {
      context.handle(
        _startUtcMeta,
        startUtc.isAcceptableOrUnknown(data['start_utc']!, _startUtcMeta),
      );
    }
    if (data.containsKey('end_utc')) {
      context.handle(
        _endUtcMeta,
        endUtc.isAcceptableOrUnknown(data['end_utc']!, _endUtcMeta),
      );
    }
    if (data.containsKey('limit')) {
      context.handle(
        _limitMeta,
        limit.isAcceptableOrUnknown(data['limit']!, _limitMeta),
      );
    } else if (isInserting) {
      context.missing(_limitMeta);
    }
    if (data.containsKey('cursor')) {
      context.handle(
        _cursorMeta,
        cursor.isAcceptableOrUnknown(data['cursor']!, _cursorMeta),
      );
    }
    if (data.containsKey('generated_at_utc')) {
      context.handle(
        _generatedAtUtcMeta,
        generatedAtUtc.isAcceptableOrUnknown(
          data['generated_at_utc']!,
          _generatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_generatedAtUtcMeta);
    }
    if (data.containsKey('latest_observed_at_utc')) {
      context.handle(
        _latestObservedAtUtcMeta,
        latestObservedAtUtc.isAcceptableOrUnknown(
          data['latest_observed_at_utc']!,
          _latestObservedAtUtcMeta,
        ),
      );
    }
    if (data.containsKey('next_cursor')) {
      context.handle(
        _nextCursorMeta,
        nextCursor.isAcceptableOrUnknown(data['next_cursor']!, _nextCursorMeta),
      );
    }
    if (data.containsKey('fetched_at_utc')) {
      context.handle(
        _fetchedAtUtcMeta,
        fetchedAtUtc.isAcceptableOrUnknown(
          data['fetched_at_utc']!,
          _fetchedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtUtcMeta);
    }
    if (data.containsKey('max_age_seconds')) {
      context.handle(
        _maxAgeSecondsMeta,
        maxAgeSeconds.isAcceptableOrUnknown(
          data['max_age_seconds']!,
          _maxAgeSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_maxAgeSecondsMeta);
    }
    if (data.containsKey('stale_while_revalidate_seconds')) {
      context.handle(
        _staleWhileRevalidateSecondsMeta,
        staleWhileRevalidateSeconds.isAcceptableOrUnknown(
          data['stale_while_revalidate_seconds']!,
          _staleWhileRevalidateSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_staleWhileRevalidateSecondsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey};
  @override
  WaterLevelPage map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WaterLevelPage(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
      stationName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_name'],
      )!,
      timeZone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}time_zone'],
      )!,
      defaultDatumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}default_datum_id'],
      ),
      startUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}start_utc'],
      ),
      endUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}end_utc'],
      ),
      limit: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}limit'],
      )!,
      cursor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cursor'],
      ),
      generatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}generated_at_utc'],
      )!,
      latestObservedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}latest_observed_at_utc'],
      ),
      nextCursor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}next_cursor'],
      ),
      fetchedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at_utc'],
      )!,
      maxAgeSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}max_age_seconds'],
      )!,
      staleWhileRevalidateSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stale_while_revalidate_seconds'],
      )!,
    );
  }

  @override
  $WaterLevelPagesTable createAlias(String alias) {
    return $WaterLevelPagesTable(attachedDatabase, alias);
  }
}

class WaterLevelPage extends DataClass implements Insertable<WaterLevelPage> {
  final String cacheKey;
  final String stationId;
  final String stationName;
  final String timeZone;
  final String? defaultDatumId;
  final DateTime? startUtc;
  final DateTime? endUtc;
  final int limit;
  final String? cursor;
  final DateTime generatedAtUtc;
  final DateTime? latestObservedAtUtc;
  final String? nextCursor;
  final DateTime fetchedAtUtc;
  final int maxAgeSeconds;
  final int staleWhileRevalidateSeconds;
  const WaterLevelPage({
    required this.cacheKey,
    required this.stationId,
    required this.stationName,
    required this.timeZone,
    this.defaultDatumId,
    this.startUtc,
    this.endUtc,
    required this.limit,
    this.cursor,
    required this.generatedAtUtc,
    this.latestObservedAtUtc,
    this.nextCursor,
    required this.fetchedAtUtc,
    required this.maxAgeSeconds,
    required this.staleWhileRevalidateSeconds,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['station_id'] = Variable<String>(stationId);
    map['station_name'] = Variable<String>(stationName);
    map['time_zone'] = Variable<String>(timeZone);
    if (!nullToAbsent || defaultDatumId != null) {
      map['default_datum_id'] = Variable<String>(defaultDatumId);
    }
    if (!nullToAbsent || startUtc != null) {
      map['start_utc'] = Variable<DateTime>(startUtc);
    }
    if (!nullToAbsent || endUtc != null) {
      map['end_utc'] = Variable<DateTime>(endUtc);
    }
    map['limit'] = Variable<int>(limit);
    if (!nullToAbsent || cursor != null) {
      map['cursor'] = Variable<String>(cursor);
    }
    map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc);
    if (!nullToAbsent || latestObservedAtUtc != null) {
      map['latest_observed_at_utc'] = Variable<DateTime>(latestObservedAtUtc);
    }
    if (!nullToAbsent || nextCursor != null) {
      map['next_cursor'] = Variable<String>(nextCursor);
    }
    map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc);
    map['max_age_seconds'] = Variable<int>(maxAgeSeconds);
    map['stale_while_revalidate_seconds'] = Variable<int>(
      staleWhileRevalidateSeconds,
    );
    return map;
  }

  WaterLevelPagesCompanion toCompanion(bool nullToAbsent) {
    return WaterLevelPagesCompanion(
      cacheKey: Value(cacheKey),
      stationId: Value(stationId),
      stationName: Value(stationName),
      timeZone: Value(timeZone),
      defaultDatumId: defaultDatumId == null && nullToAbsent
          ? const Value.absent()
          : Value(defaultDatumId),
      startUtc: startUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(startUtc),
      endUtc: endUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(endUtc),
      limit: Value(limit),
      cursor: cursor == null && nullToAbsent
          ? const Value.absent()
          : Value(cursor),
      generatedAtUtc: Value(generatedAtUtc),
      latestObservedAtUtc: latestObservedAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(latestObservedAtUtc),
      nextCursor: nextCursor == null && nullToAbsent
          ? const Value.absent()
          : Value(nextCursor),
      fetchedAtUtc: Value(fetchedAtUtc),
      maxAgeSeconds: Value(maxAgeSeconds),
      staleWhileRevalidateSeconds: Value(staleWhileRevalidateSeconds),
    );
  }

  factory WaterLevelPage.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WaterLevelPage(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      stationId: serializer.fromJson<String>(json['stationId']),
      stationName: serializer.fromJson<String>(json['stationName']),
      timeZone: serializer.fromJson<String>(json['timeZone']),
      defaultDatumId: serializer.fromJson<String?>(json['defaultDatumId']),
      startUtc: serializer.fromJson<DateTime?>(json['startUtc']),
      endUtc: serializer.fromJson<DateTime?>(json['endUtc']),
      limit: serializer.fromJson<int>(json['limit']),
      cursor: serializer.fromJson<String?>(json['cursor']),
      generatedAtUtc: serializer.fromJson<DateTime>(json['generatedAtUtc']),
      latestObservedAtUtc: serializer.fromJson<DateTime?>(
        json['latestObservedAtUtc'],
      ),
      nextCursor: serializer.fromJson<String?>(json['nextCursor']),
      fetchedAtUtc: serializer.fromJson<DateTime>(json['fetchedAtUtc']),
      maxAgeSeconds: serializer.fromJson<int>(json['maxAgeSeconds']),
      staleWhileRevalidateSeconds: serializer.fromJson<int>(
        json['staleWhileRevalidateSeconds'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'stationId': serializer.toJson<String>(stationId),
      'stationName': serializer.toJson<String>(stationName),
      'timeZone': serializer.toJson<String>(timeZone),
      'defaultDatumId': serializer.toJson<String?>(defaultDatumId),
      'startUtc': serializer.toJson<DateTime?>(startUtc),
      'endUtc': serializer.toJson<DateTime?>(endUtc),
      'limit': serializer.toJson<int>(limit),
      'cursor': serializer.toJson<String?>(cursor),
      'generatedAtUtc': serializer.toJson<DateTime>(generatedAtUtc),
      'latestObservedAtUtc': serializer.toJson<DateTime?>(latestObservedAtUtc),
      'nextCursor': serializer.toJson<String?>(nextCursor),
      'fetchedAtUtc': serializer.toJson<DateTime>(fetchedAtUtc),
      'maxAgeSeconds': serializer.toJson<int>(maxAgeSeconds),
      'staleWhileRevalidateSeconds': serializer.toJson<int>(
        staleWhileRevalidateSeconds,
      ),
    };
  }

  WaterLevelPage copyWith({
    String? cacheKey,
    String? stationId,
    String? stationName,
    String? timeZone,
    Value<String?> defaultDatumId = const Value.absent(),
    Value<DateTime?> startUtc = const Value.absent(),
    Value<DateTime?> endUtc = const Value.absent(),
    int? limit,
    Value<String?> cursor = const Value.absent(),
    DateTime? generatedAtUtc,
    Value<DateTime?> latestObservedAtUtc = const Value.absent(),
    Value<String?> nextCursor = const Value.absent(),
    DateTime? fetchedAtUtc,
    int? maxAgeSeconds,
    int? staleWhileRevalidateSeconds,
  }) => WaterLevelPage(
    cacheKey: cacheKey ?? this.cacheKey,
    stationId: stationId ?? this.stationId,
    stationName: stationName ?? this.stationName,
    timeZone: timeZone ?? this.timeZone,
    defaultDatumId: defaultDatumId.present
        ? defaultDatumId.value
        : this.defaultDatumId,
    startUtc: startUtc.present ? startUtc.value : this.startUtc,
    endUtc: endUtc.present ? endUtc.value : this.endUtc,
    limit: limit ?? this.limit,
    cursor: cursor.present ? cursor.value : this.cursor,
    generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
    latestObservedAtUtc: latestObservedAtUtc.present
        ? latestObservedAtUtc.value
        : this.latestObservedAtUtc,
    nextCursor: nextCursor.present ? nextCursor.value : this.nextCursor,
    fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
    maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
    staleWhileRevalidateSeconds:
        staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
  );
  WaterLevelPage copyWithCompanion(WaterLevelPagesCompanion data) {
    return WaterLevelPage(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
      stationName: data.stationName.present
          ? data.stationName.value
          : this.stationName,
      timeZone: data.timeZone.present ? data.timeZone.value : this.timeZone,
      defaultDatumId: data.defaultDatumId.present
          ? data.defaultDatumId.value
          : this.defaultDatumId,
      startUtc: data.startUtc.present ? data.startUtc.value : this.startUtc,
      endUtc: data.endUtc.present ? data.endUtc.value : this.endUtc,
      limit: data.limit.present ? data.limit.value : this.limit,
      cursor: data.cursor.present ? data.cursor.value : this.cursor,
      generatedAtUtc: data.generatedAtUtc.present
          ? data.generatedAtUtc.value
          : this.generatedAtUtc,
      latestObservedAtUtc: data.latestObservedAtUtc.present
          ? data.latestObservedAtUtc.value
          : this.latestObservedAtUtc,
      nextCursor: data.nextCursor.present
          ? data.nextCursor.value
          : this.nextCursor,
      fetchedAtUtc: data.fetchedAtUtc.present
          ? data.fetchedAtUtc.value
          : this.fetchedAtUtc,
      maxAgeSeconds: data.maxAgeSeconds.present
          ? data.maxAgeSeconds.value
          : this.maxAgeSeconds,
      staleWhileRevalidateSeconds: data.staleWhileRevalidateSeconds.present
          ? data.staleWhileRevalidateSeconds.value
          : this.staleWhileRevalidateSeconds,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WaterLevelPage(')
          ..write('cacheKey: $cacheKey, ')
          ..write('stationId: $stationId, ')
          ..write('stationName: $stationName, ')
          ..write('timeZone: $timeZone, ')
          ..write('defaultDatumId: $defaultDatumId, ')
          ..write('startUtc: $startUtc, ')
          ..write('endUtc: $endUtc, ')
          ..write('limit: $limit, ')
          ..write('cursor: $cursor, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('latestObservedAtUtc: $latestObservedAtUtc, ')
          ..write('nextCursor: $nextCursor, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    cacheKey,
    stationId,
    stationName,
    timeZone,
    defaultDatumId,
    startUtc,
    endUtc,
    limit,
    cursor,
    generatedAtUtc,
    latestObservedAtUtc,
    nextCursor,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WaterLevelPage &&
          other.cacheKey == this.cacheKey &&
          other.stationId == this.stationId &&
          other.stationName == this.stationName &&
          other.timeZone == this.timeZone &&
          other.defaultDatumId == this.defaultDatumId &&
          other.startUtc == this.startUtc &&
          other.endUtc == this.endUtc &&
          other.limit == this.limit &&
          other.cursor == this.cursor &&
          other.generatedAtUtc == this.generatedAtUtc &&
          other.latestObservedAtUtc == this.latestObservedAtUtc &&
          other.nextCursor == this.nextCursor &&
          other.fetchedAtUtc == this.fetchedAtUtc &&
          other.maxAgeSeconds == this.maxAgeSeconds &&
          other.staleWhileRevalidateSeconds ==
              this.staleWhileRevalidateSeconds);
}

class WaterLevelPagesCompanion extends UpdateCompanion<WaterLevelPage> {
  final Value<String> cacheKey;
  final Value<String> stationId;
  final Value<String> stationName;
  final Value<String> timeZone;
  final Value<String?> defaultDatumId;
  final Value<DateTime?> startUtc;
  final Value<DateTime?> endUtc;
  final Value<int> limit;
  final Value<String?> cursor;
  final Value<DateTime> generatedAtUtc;
  final Value<DateTime?> latestObservedAtUtc;
  final Value<String?> nextCursor;
  final Value<DateTime> fetchedAtUtc;
  final Value<int> maxAgeSeconds;
  final Value<int> staleWhileRevalidateSeconds;
  final Value<int> rowid;
  const WaterLevelPagesCompanion({
    this.cacheKey = const Value.absent(),
    this.stationId = const Value.absent(),
    this.stationName = const Value.absent(),
    this.timeZone = const Value.absent(),
    this.defaultDatumId = const Value.absent(),
    this.startUtc = const Value.absent(),
    this.endUtc = const Value.absent(),
    this.limit = const Value.absent(),
    this.cursor = const Value.absent(),
    this.generatedAtUtc = const Value.absent(),
    this.latestObservedAtUtc = const Value.absent(),
    this.nextCursor = const Value.absent(),
    this.fetchedAtUtc = const Value.absent(),
    this.maxAgeSeconds = const Value.absent(),
    this.staleWhileRevalidateSeconds = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  WaterLevelPagesCompanion.insert({
    required String cacheKey,
    required String stationId,
    required String stationName,
    required String timeZone,
    this.defaultDatumId = const Value.absent(),
    this.startUtc = const Value.absent(),
    this.endUtc = const Value.absent(),
    required int limit,
    this.cursor = const Value.absent(),
    required DateTime generatedAtUtc,
    this.latestObservedAtUtc = const Value.absent(),
    this.nextCursor = const Value.absent(),
    required DateTime fetchedAtUtc,
    required int maxAgeSeconds,
    required int staleWhileRevalidateSeconds,
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       stationId = Value(stationId),
       stationName = Value(stationName),
       timeZone = Value(timeZone),
       limit = Value(limit),
       generatedAtUtc = Value(generatedAtUtc),
       fetchedAtUtc = Value(fetchedAtUtc),
       maxAgeSeconds = Value(maxAgeSeconds),
       staleWhileRevalidateSeconds = Value(staleWhileRevalidateSeconds);
  static Insertable<WaterLevelPage> custom({
    Expression<String>? cacheKey,
    Expression<String>? stationId,
    Expression<String>? stationName,
    Expression<String>? timeZone,
    Expression<String>? defaultDatumId,
    Expression<DateTime>? startUtc,
    Expression<DateTime>? endUtc,
    Expression<int>? limit,
    Expression<String>? cursor,
    Expression<DateTime>? generatedAtUtc,
    Expression<DateTime>? latestObservedAtUtc,
    Expression<String>? nextCursor,
    Expression<DateTime>? fetchedAtUtc,
    Expression<int>? maxAgeSeconds,
    Expression<int>? staleWhileRevalidateSeconds,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (stationId != null) 'station_id': stationId,
      if (stationName != null) 'station_name': stationName,
      if (timeZone != null) 'time_zone': timeZone,
      if (defaultDatumId != null) 'default_datum_id': defaultDatumId,
      if (startUtc != null) 'start_utc': startUtc,
      if (endUtc != null) 'end_utc': endUtc,
      if (limit != null) 'limit': limit,
      if (cursor != null) 'cursor': cursor,
      if (generatedAtUtc != null) 'generated_at_utc': generatedAtUtc,
      if (latestObservedAtUtc != null)
        'latest_observed_at_utc': latestObservedAtUtc,
      if (nextCursor != null) 'next_cursor': nextCursor,
      if (fetchedAtUtc != null) 'fetched_at_utc': fetchedAtUtc,
      if (maxAgeSeconds != null) 'max_age_seconds': maxAgeSeconds,
      if (staleWhileRevalidateSeconds != null)
        'stale_while_revalidate_seconds': staleWhileRevalidateSeconds,
      if (rowid != null) 'rowid': rowid,
    });
  }

  WaterLevelPagesCompanion copyWith({
    Value<String>? cacheKey,
    Value<String>? stationId,
    Value<String>? stationName,
    Value<String>? timeZone,
    Value<String?>? defaultDatumId,
    Value<DateTime?>? startUtc,
    Value<DateTime?>? endUtc,
    Value<int>? limit,
    Value<String?>? cursor,
    Value<DateTime>? generatedAtUtc,
    Value<DateTime?>? latestObservedAtUtc,
    Value<String?>? nextCursor,
    Value<DateTime>? fetchedAtUtc,
    Value<int>? maxAgeSeconds,
    Value<int>? staleWhileRevalidateSeconds,
    Value<int>? rowid,
  }) {
    return WaterLevelPagesCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      stationId: stationId ?? this.stationId,
      stationName: stationName ?? this.stationName,
      timeZone: timeZone ?? this.timeZone,
      defaultDatumId: defaultDatumId ?? this.defaultDatumId,
      startUtc: startUtc ?? this.startUtc,
      endUtc: endUtc ?? this.endUtc,
      limit: limit ?? this.limit,
      cursor: cursor ?? this.cursor,
      generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
      latestObservedAtUtc: latestObservedAtUtc ?? this.latestObservedAtUtc,
      nextCursor: nextCursor ?? this.nextCursor,
      fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
      maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
      staleWhileRevalidateSeconds:
          staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (stationName.present) {
      map['station_name'] = Variable<String>(stationName.value);
    }
    if (timeZone.present) {
      map['time_zone'] = Variable<String>(timeZone.value);
    }
    if (defaultDatumId.present) {
      map['default_datum_id'] = Variable<String>(defaultDatumId.value);
    }
    if (startUtc.present) {
      map['start_utc'] = Variable<DateTime>(startUtc.value);
    }
    if (endUtc.present) {
      map['end_utc'] = Variable<DateTime>(endUtc.value);
    }
    if (limit.present) {
      map['limit'] = Variable<int>(limit.value);
    }
    if (cursor.present) {
      map['cursor'] = Variable<String>(cursor.value);
    }
    if (generatedAtUtc.present) {
      map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc.value);
    }
    if (latestObservedAtUtc.present) {
      map['latest_observed_at_utc'] = Variable<DateTime>(
        latestObservedAtUtc.value,
      );
    }
    if (nextCursor.present) {
      map['next_cursor'] = Variable<String>(nextCursor.value);
    }
    if (fetchedAtUtc.present) {
      map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc.value);
    }
    if (maxAgeSeconds.present) {
      map['max_age_seconds'] = Variable<int>(maxAgeSeconds.value);
    }
    if (staleWhileRevalidateSeconds.present) {
      map['stale_while_revalidate_seconds'] = Variable<int>(
        staleWhileRevalidateSeconds.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WaterLevelPagesCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('stationId: $stationId, ')
          ..write('stationName: $stationName, ')
          ..write('timeZone: $timeZone, ')
          ..write('defaultDatumId: $defaultDatumId, ')
          ..write('startUtc: $startUtc, ')
          ..write('endUtc: $endUtc, ')
          ..write('limit: $limit, ')
          ..write('cursor: $cursor, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('latestObservedAtUtc: $latestObservedAtUtc, ')
          ..write('nextCursor: $nextCursor, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $WaterLevelObservationsTable extends WaterLevelObservations
    with TableInfo<$WaterLevelObservationsTable, WaterLevelObservation> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WaterLevelObservationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sourceRecordKeyMeta = const VerificationMeta(
    'sourceRecordKey',
  );
  @override
  late final GeneratedColumn<String> sourceRecordKey = GeneratedColumn<String>(
    'source_record_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _observedAtUtcMeta = const VerificationMeta(
    'observedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> observedAtUtc =
      GeneratedColumn<DateTime>(
        'observed_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<double> value = GeneratedColumn<double>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _unitMeta = const VerificationMeta('unit');
  @override
  late final GeneratedColumn<String> unit = GeneratedColumn<String>(
    'unit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _datumIdMeta = const VerificationMeta(
    'datumId',
  );
  @override
  late final GeneratedColumn<String> datumId = GeneratedColumn<String>(
    'datum_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _qualityStateMeta = const VerificationMeta(
    'qualityState',
  );
  @override
  late final GeneratedColumn<String> qualityState = GeneratedColumn<String>(
    'quality_state',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _provenanceSourceKeyMeta =
      const VerificationMeta('provenanceSourceKey');
  @override
  late final GeneratedColumn<String> provenanceSourceKey =
      GeneratedColumn<String>(
        'provenance_source_key',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _provenanceImportRunIdMeta =
      const VerificationMeta('provenanceImportRunId');
  @override
  late final GeneratedColumn<String> provenanceImportRunId =
      GeneratedColumn<String>(
        'provenance_import_run_id',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _rawChecksumSha256Meta = const VerificationMeta(
    'rawChecksumSha256',
  );
  @override
  late final GeneratedColumn<String> rawChecksumSha256 =
      GeneratedColumn<String>(
        'raw_checksum_sha256',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _parserVersionMeta = const VerificationMeta(
    'parserVersion',
  );
  @override
  late final GeneratedColumn<String> parserVersion = GeneratedColumn<String>(
    'parser_version',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _normalizerVersionMeta = const VerificationMeta(
    'normalizerVersion',
  );
  @override
  late final GeneratedColumn<String> normalizerVersion =
      GeneratedColumn<String>(
        'normalizer_version',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _provenanceObservedAtUtcMeta =
      const VerificationMeta('provenanceObservedAtUtc');
  @override
  late final GeneratedColumn<DateTime> provenanceObservedAtUtc =
      GeneratedColumn<DateTime>(
        'provenance_observed_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    stationId,
    sourceRecordKey,
    observedAtUtc,
    value,
    unit,
    datumId,
    qualityState,
    provenanceSourceKey,
    provenanceImportRunId,
    rawChecksumSha256,
    parserVersion,
    normalizerVersion,
    provenanceObservedAtUtc,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'water_level_observations';
  @override
  VerificationContext validateIntegrity(
    Insertable<WaterLevelObservation> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    if (data.containsKey('source_record_key')) {
      context.handle(
        _sourceRecordKeyMeta,
        sourceRecordKey.isAcceptableOrUnknown(
          data['source_record_key']!,
          _sourceRecordKeyMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_sourceRecordKeyMeta);
    }
    if (data.containsKey('observed_at_utc')) {
      context.handle(
        _observedAtUtcMeta,
        observedAtUtc.isAcceptableOrUnknown(
          data['observed_at_utc']!,
          _observedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_observedAtUtcMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    if (data.containsKey('unit')) {
      context.handle(
        _unitMeta,
        unit.isAcceptableOrUnknown(data['unit']!, _unitMeta),
      );
    } else if (isInserting) {
      context.missing(_unitMeta);
    }
    if (data.containsKey('datum_id')) {
      context.handle(
        _datumIdMeta,
        datumId.isAcceptableOrUnknown(data['datum_id']!, _datumIdMeta),
      );
    }
    if (data.containsKey('quality_state')) {
      context.handle(
        _qualityStateMeta,
        qualityState.isAcceptableOrUnknown(
          data['quality_state']!,
          _qualityStateMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_qualityStateMeta);
    }
    if (data.containsKey('provenance_source_key')) {
      context.handle(
        _provenanceSourceKeyMeta,
        provenanceSourceKey.isAcceptableOrUnknown(
          data['provenance_source_key']!,
          _provenanceSourceKeyMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_provenanceSourceKeyMeta);
    }
    if (data.containsKey('provenance_import_run_id')) {
      context.handle(
        _provenanceImportRunIdMeta,
        provenanceImportRunId.isAcceptableOrUnknown(
          data['provenance_import_run_id']!,
          _provenanceImportRunIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_provenanceImportRunIdMeta);
    }
    if (data.containsKey('raw_checksum_sha256')) {
      context.handle(
        _rawChecksumSha256Meta,
        rawChecksumSha256.isAcceptableOrUnknown(
          data['raw_checksum_sha256']!,
          _rawChecksumSha256Meta,
        ),
      );
    } else if (isInserting) {
      context.missing(_rawChecksumSha256Meta);
    }
    if (data.containsKey('parser_version')) {
      context.handle(
        _parserVersionMeta,
        parserVersion.isAcceptableOrUnknown(
          data['parser_version']!,
          _parserVersionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_parserVersionMeta);
    }
    if (data.containsKey('normalizer_version')) {
      context.handle(
        _normalizerVersionMeta,
        normalizerVersion.isAcceptableOrUnknown(
          data['normalizer_version']!,
          _normalizerVersionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_normalizerVersionMeta);
    }
    if (data.containsKey('provenance_observed_at_utc')) {
      context.handle(
        _provenanceObservedAtUtcMeta,
        provenanceObservedAtUtc.isAcceptableOrUnknown(
          data['provenance_observed_at_utc']!,
          _provenanceObservedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_provenanceObservedAtUtcMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {stationId, sourceRecordKey};
  @override
  WaterLevelObservation map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WaterLevelObservation(
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
      sourceRecordKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_record_key'],
      )!,
      observedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}observed_at_utc'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}value'],
      )!,
      unit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}unit'],
      )!,
      datumId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}datum_id'],
      ),
      qualityState: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}quality_state'],
      )!,
      provenanceSourceKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_source_key'],
      )!,
      provenanceImportRunId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}provenance_import_run_id'],
      )!,
      rawChecksumSha256: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}raw_checksum_sha256'],
      )!,
      parserVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}parser_version'],
      )!,
      normalizerVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}normalizer_version'],
      )!,
      provenanceObservedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}provenance_observed_at_utc'],
      )!,
    );
  }

  @override
  $WaterLevelObservationsTable createAlias(String alias) {
    return $WaterLevelObservationsTable(attachedDatabase, alias);
  }
}

class WaterLevelObservation extends DataClass
    implements Insertable<WaterLevelObservation> {
  final String stationId;
  final String sourceRecordKey;
  final DateTime observedAtUtc;
  final double value;
  final String unit;
  final String? datumId;
  final String qualityState;
  final String provenanceSourceKey;
  final String provenanceImportRunId;
  final String rawChecksumSha256;
  final String parserVersion;
  final String normalizerVersion;
  final DateTime provenanceObservedAtUtc;
  const WaterLevelObservation({
    required this.stationId,
    required this.sourceRecordKey,
    required this.observedAtUtc,
    required this.value,
    required this.unit,
    this.datumId,
    required this.qualityState,
    required this.provenanceSourceKey,
    required this.provenanceImportRunId,
    required this.rawChecksumSha256,
    required this.parserVersion,
    required this.normalizerVersion,
    required this.provenanceObservedAtUtc,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['station_id'] = Variable<String>(stationId);
    map['source_record_key'] = Variable<String>(sourceRecordKey);
    map['observed_at_utc'] = Variable<DateTime>(observedAtUtc);
    map['value'] = Variable<double>(value);
    map['unit'] = Variable<String>(unit);
    if (!nullToAbsent || datumId != null) {
      map['datum_id'] = Variable<String>(datumId);
    }
    map['quality_state'] = Variable<String>(qualityState);
    map['provenance_source_key'] = Variable<String>(provenanceSourceKey);
    map['provenance_import_run_id'] = Variable<String>(provenanceImportRunId);
    map['raw_checksum_sha256'] = Variable<String>(rawChecksumSha256);
    map['parser_version'] = Variable<String>(parserVersion);
    map['normalizer_version'] = Variable<String>(normalizerVersion);
    map['provenance_observed_at_utc'] = Variable<DateTime>(
      provenanceObservedAtUtc,
    );
    return map;
  }

  WaterLevelObservationsCompanion toCompanion(bool nullToAbsent) {
    return WaterLevelObservationsCompanion(
      stationId: Value(stationId),
      sourceRecordKey: Value(sourceRecordKey),
      observedAtUtc: Value(observedAtUtc),
      value: Value(value),
      unit: Value(unit),
      datumId: datumId == null && nullToAbsent
          ? const Value.absent()
          : Value(datumId),
      qualityState: Value(qualityState),
      provenanceSourceKey: Value(provenanceSourceKey),
      provenanceImportRunId: Value(provenanceImportRunId),
      rawChecksumSha256: Value(rawChecksumSha256),
      parserVersion: Value(parserVersion),
      normalizerVersion: Value(normalizerVersion),
      provenanceObservedAtUtc: Value(provenanceObservedAtUtc),
    );
  }

  factory WaterLevelObservation.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WaterLevelObservation(
      stationId: serializer.fromJson<String>(json['stationId']),
      sourceRecordKey: serializer.fromJson<String>(json['sourceRecordKey']),
      observedAtUtc: serializer.fromJson<DateTime>(json['observedAtUtc']),
      value: serializer.fromJson<double>(json['value']),
      unit: serializer.fromJson<String>(json['unit']),
      datumId: serializer.fromJson<String?>(json['datumId']),
      qualityState: serializer.fromJson<String>(json['qualityState']),
      provenanceSourceKey: serializer.fromJson<String>(
        json['provenanceSourceKey'],
      ),
      provenanceImportRunId: serializer.fromJson<String>(
        json['provenanceImportRunId'],
      ),
      rawChecksumSha256: serializer.fromJson<String>(json['rawChecksumSha256']),
      parserVersion: serializer.fromJson<String>(json['parserVersion']),
      normalizerVersion: serializer.fromJson<String>(json['normalizerVersion']),
      provenanceObservedAtUtc: serializer.fromJson<DateTime>(
        json['provenanceObservedAtUtc'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'stationId': serializer.toJson<String>(stationId),
      'sourceRecordKey': serializer.toJson<String>(sourceRecordKey),
      'observedAtUtc': serializer.toJson<DateTime>(observedAtUtc),
      'value': serializer.toJson<double>(value),
      'unit': serializer.toJson<String>(unit),
      'datumId': serializer.toJson<String?>(datumId),
      'qualityState': serializer.toJson<String>(qualityState),
      'provenanceSourceKey': serializer.toJson<String>(provenanceSourceKey),
      'provenanceImportRunId': serializer.toJson<String>(provenanceImportRunId),
      'rawChecksumSha256': serializer.toJson<String>(rawChecksumSha256),
      'parserVersion': serializer.toJson<String>(parserVersion),
      'normalizerVersion': serializer.toJson<String>(normalizerVersion),
      'provenanceObservedAtUtc': serializer.toJson<DateTime>(
        provenanceObservedAtUtc,
      ),
    };
  }

  WaterLevelObservation copyWith({
    String? stationId,
    String? sourceRecordKey,
    DateTime? observedAtUtc,
    double? value,
    String? unit,
    Value<String?> datumId = const Value.absent(),
    String? qualityState,
    String? provenanceSourceKey,
    String? provenanceImportRunId,
    String? rawChecksumSha256,
    String? parserVersion,
    String? normalizerVersion,
    DateTime? provenanceObservedAtUtc,
  }) => WaterLevelObservation(
    stationId: stationId ?? this.stationId,
    sourceRecordKey: sourceRecordKey ?? this.sourceRecordKey,
    observedAtUtc: observedAtUtc ?? this.observedAtUtc,
    value: value ?? this.value,
    unit: unit ?? this.unit,
    datumId: datumId.present ? datumId.value : this.datumId,
    qualityState: qualityState ?? this.qualityState,
    provenanceSourceKey: provenanceSourceKey ?? this.provenanceSourceKey,
    provenanceImportRunId: provenanceImportRunId ?? this.provenanceImportRunId,
    rawChecksumSha256: rawChecksumSha256 ?? this.rawChecksumSha256,
    parserVersion: parserVersion ?? this.parserVersion,
    normalizerVersion: normalizerVersion ?? this.normalizerVersion,
    provenanceObservedAtUtc:
        provenanceObservedAtUtc ?? this.provenanceObservedAtUtc,
  );
  WaterLevelObservation copyWithCompanion(
    WaterLevelObservationsCompanion data,
  ) {
    return WaterLevelObservation(
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
      sourceRecordKey: data.sourceRecordKey.present
          ? data.sourceRecordKey.value
          : this.sourceRecordKey,
      observedAtUtc: data.observedAtUtc.present
          ? data.observedAtUtc.value
          : this.observedAtUtc,
      value: data.value.present ? data.value.value : this.value,
      unit: data.unit.present ? data.unit.value : this.unit,
      datumId: data.datumId.present ? data.datumId.value : this.datumId,
      qualityState: data.qualityState.present
          ? data.qualityState.value
          : this.qualityState,
      provenanceSourceKey: data.provenanceSourceKey.present
          ? data.provenanceSourceKey.value
          : this.provenanceSourceKey,
      provenanceImportRunId: data.provenanceImportRunId.present
          ? data.provenanceImportRunId.value
          : this.provenanceImportRunId,
      rawChecksumSha256: data.rawChecksumSha256.present
          ? data.rawChecksumSha256.value
          : this.rawChecksumSha256,
      parserVersion: data.parserVersion.present
          ? data.parserVersion.value
          : this.parserVersion,
      normalizerVersion: data.normalizerVersion.present
          ? data.normalizerVersion.value
          : this.normalizerVersion,
      provenanceObservedAtUtc: data.provenanceObservedAtUtc.present
          ? data.provenanceObservedAtUtc.value
          : this.provenanceObservedAtUtc,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WaterLevelObservation(')
          ..write('stationId: $stationId, ')
          ..write('sourceRecordKey: $sourceRecordKey, ')
          ..write('observedAtUtc: $observedAtUtc, ')
          ..write('value: $value, ')
          ..write('unit: $unit, ')
          ..write('datumId: $datumId, ')
          ..write('qualityState: $qualityState, ')
          ..write('provenanceSourceKey: $provenanceSourceKey, ')
          ..write('provenanceImportRunId: $provenanceImportRunId, ')
          ..write('rawChecksumSha256: $rawChecksumSha256, ')
          ..write('parserVersion: $parserVersion, ')
          ..write('normalizerVersion: $normalizerVersion, ')
          ..write('provenanceObservedAtUtc: $provenanceObservedAtUtc')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    stationId,
    sourceRecordKey,
    observedAtUtc,
    value,
    unit,
    datumId,
    qualityState,
    provenanceSourceKey,
    provenanceImportRunId,
    rawChecksumSha256,
    parserVersion,
    normalizerVersion,
    provenanceObservedAtUtc,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WaterLevelObservation &&
          other.stationId == this.stationId &&
          other.sourceRecordKey == this.sourceRecordKey &&
          other.observedAtUtc == this.observedAtUtc &&
          other.value == this.value &&
          other.unit == this.unit &&
          other.datumId == this.datumId &&
          other.qualityState == this.qualityState &&
          other.provenanceSourceKey == this.provenanceSourceKey &&
          other.provenanceImportRunId == this.provenanceImportRunId &&
          other.rawChecksumSha256 == this.rawChecksumSha256 &&
          other.parserVersion == this.parserVersion &&
          other.normalizerVersion == this.normalizerVersion &&
          other.provenanceObservedAtUtc == this.provenanceObservedAtUtc);
}

class WaterLevelObservationsCompanion
    extends UpdateCompanion<WaterLevelObservation> {
  final Value<String> stationId;
  final Value<String> sourceRecordKey;
  final Value<DateTime> observedAtUtc;
  final Value<double> value;
  final Value<String> unit;
  final Value<String?> datumId;
  final Value<String> qualityState;
  final Value<String> provenanceSourceKey;
  final Value<String> provenanceImportRunId;
  final Value<String> rawChecksumSha256;
  final Value<String> parserVersion;
  final Value<String> normalizerVersion;
  final Value<DateTime> provenanceObservedAtUtc;
  final Value<int> rowid;
  const WaterLevelObservationsCompanion({
    this.stationId = const Value.absent(),
    this.sourceRecordKey = const Value.absent(),
    this.observedAtUtc = const Value.absent(),
    this.value = const Value.absent(),
    this.unit = const Value.absent(),
    this.datumId = const Value.absent(),
    this.qualityState = const Value.absent(),
    this.provenanceSourceKey = const Value.absent(),
    this.provenanceImportRunId = const Value.absent(),
    this.rawChecksumSha256 = const Value.absent(),
    this.parserVersion = const Value.absent(),
    this.normalizerVersion = const Value.absent(),
    this.provenanceObservedAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  WaterLevelObservationsCompanion.insert({
    required String stationId,
    required String sourceRecordKey,
    required DateTime observedAtUtc,
    required double value,
    required String unit,
    this.datumId = const Value.absent(),
    required String qualityState,
    required String provenanceSourceKey,
    required String provenanceImportRunId,
    required String rawChecksumSha256,
    required String parserVersion,
    required String normalizerVersion,
    required DateTime provenanceObservedAtUtc,
    this.rowid = const Value.absent(),
  }) : stationId = Value(stationId),
       sourceRecordKey = Value(sourceRecordKey),
       observedAtUtc = Value(observedAtUtc),
       value = Value(value),
       unit = Value(unit),
       qualityState = Value(qualityState),
       provenanceSourceKey = Value(provenanceSourceKey),
       provenanceImportRunId = Value(provenanceImportRunId),
       rawChecksumSha256 = Value(rawChecksumSha256),
       parserVersion = Value(parserVersion),
       normalizerVersion = Value(normalizerVersion),
       provenanceObservedAtUtc = Value(provenanceObservedAtUtc);
  static Insertable<WaterLevelObservation> custom({
    Expression<String>? stationId,
    Expression<String>? sourceRecordKey,
    Expression<DateTime>? observedAtUtc,
    Expression<double>? value,
    Expression<String>? unit,
    Expression<String>? datumId,
    Expression<String>? qualityState,
    Expression<String>? provenanceSourceKey,
    Expression<String>? provenanceImportRunId,
    Expression<String>? rawChecksumSha256,
    Expression<String>? parserVersion,
    Expression<String>? normalizerVersion,
    Expression<DateTime>? provenanceObservedAtUtc,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (stationId != null) 'station_id': stationId,
      if (sourceRecordKey != null) 'source_record_key': sourceRecordKey,
      if (observedAtUtc != null) 'observed_at_utc': observedAtUtc,
      if (value != null) 'value': value,
      if (unit != null) 'unit': unit,
      if (datumId != null) 'datum_id': datumId,
      if (qualityState != null) 'quality_state': qualityState,
      if (provenanceSourceKey != null)
        'provenance_source_key': provenanceSourceKey,
      if (provenanceImportRunId != null)
        'provenance_import_run_id': provenanceImportRunId,
      if (rawChecksumSha256 != null) 'raw_checksum_sha256': rawChecksumSha256,
      if (parserVersion != null) 'parser_version': parserVersion,
      if (normalizerVersion != null) 'normalizer_version': normalizerVersion,
      if (provenanceObservedAtUtc != null)
        'provenance_observed_at_utc': provenanceObservedAtUtc,
      if (rowid != null) 'rowid': rowid,
    });
  }

  WaterLevelObservationsCompanion copyWith({
    Value<String>? stationId,
    Value<String>? sourceRecordKey,
    Value<DateTime>? observedAtUtc,
    Value<double>? value,
    Value<String>? unit,
    Value<String?>? datumId,
    Value<String>? qualityState,
    Value<String>? provenanceSourceKey,
    Value<String>? provenanceImportRunId,
    Value<String>? rawChecksumSha256,
    Value<String>? parserVersion,
    Value<String>? normalizerVersion,
    Value<DateTime>? provenanceObservedAtUtc,
    Value<int>? rowid,
  }) {
    return WaterLevelObservationsCompanion(
      stationId: stationId ?? this.stationId,
      sourceRecordKey: sourceRecordKey ?? this.sourceRecordKey,
      observedAtUtc: observedAtUtc ?? this.observedAtUtc,
      value: value ?? this.value,
      unit: unit ?? this.unit,
      datumId: datumId ?? this.datumId,
      qualityState: qualityState ?? this.qualityState,
      provenanceSourceKey: provenanceSourceKey ?? this.provenanceSourceKey,
      provenanceImportRunId:
          provenanceImportRunId ?? this.provenanceImportRunId,
      rawChecksumSha256: rawChecksumSha256 ?? this.rawChecksumSha256,
      parserVersion: parserVersion ?? this.parserVersion,
      normalizerVersion: normalizerVersion ?? this.normalizerVersion,
      provenanceObservedAtUtc:
          provenanceObservedAtUtc ?? this.provenanceObservedAtUtc,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (sourceRecordKey.present) {
      map['source_record_key'] = Variable<String>(sourceRecordKey.value);
    }
    if (observedAtUtc.present) {
      map['observed_at_utc'] = Variable<DateTime>(observedAtUtc.value);
    }
    if (value.present) {
      map['value'] = Variable<double>(value.value);
    }
    if (unit.present) {
      map['unit'] = Variable<String>(unit.value);
    }
    if (datumId.present) {
      map['datum_id'] = Variable<String>(datumId.value);
    }
    if (qualityState.present) {
      map['quality_state'] = Variable<String>(qualityState.value);
    }
    if (provenanceSourceKey.present) {
      map['provenance_source_key'] = Variable<String>(
        provenanceSourceKey.value,
      );
    }
    if (provenanceImportRunId.present) {
      map['provenance_import_run_id'] = Variable<String>(
        provenanceImportRunId.value,
      );
    }
    if (rawChecksumSha256.present) {
      map['raw_checksum_sha256'] = Variable<String>(rawChecksumSha256.value);
    }
    if (parserVersion.present) {
      map['parser_version'] = Variable<String>(parserVersion.value);
    }
    if (normalizerVersion.present) {
      map['normalizer_version'] = Variable<String>(normalizerVersion.value);
    }
    if (provenanceObservedAtUtc.present) {
      map['provenance_observed_at_utc'] = Variable<DateTime>(
        provenanceObservedAtUtc.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WaterLevelObservationsCompanion(')
          ..write('stationId: $stationId, ')
          ..write('sourceRecordKey: $sourceRecordKey, ')
          ..write('observedAtUtc: $observedAtUtc, ')
          ..write('value: $value, ')
          ..write('unit: $unit, ')
          ..write('datumId: $datumId, ')
          ..write('qualityState: $qualityState, ')
          ..write('provenanceSourceKey: $provenanceSourceKey, ')
          ..write('provenanceImportRunId: $provenanceImportRunId, ')
          ..write('rawChecksumSha256: $rawChecksumSha256, ')
          ..write('parserVersion: $parserVersion, ')
          ..write('normalizerVersion: $normalizerVersion, ')
          ..write('provenanceObservedAtUtc: $provenanceObservedAtUtc, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $WaterLevelPageItemsTable extends WaterLevelPageItems
    with TableInfo<$WaterLevelPageItemsTable, WaterLevelPageItem> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WaterLevelPageItemsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _pageKeyMeta = const VerificationMeta(
    'pageKey',
  );
  @override
  late final GeneratedColumn<String> pageKey = GeneratedColumn<String>(
    'page_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES water_level_pages (cache_key) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _ordinalMeta = const VerificationMeta(
    'ordinal',
  );
  @override
  late final GeneratedColumn<int> ordinal = GeneratedColumn<int>(
    'ordinal',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sourceRecordKeyMeta = const VerificationMeta(
    'sourceRecordKey',
  );
  @override
  late final GeneratedColumn<String> sourceRecordKey = GeneratedColumn<String>(
    'source_record_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    pageKey,
    ordinal,
    stationId,
    sourceRecordKey,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'water_level_page_items';
  @override
  VerificationContext validateIntegrity(
    Insertable<WaterLevelPageItem> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('page_key')) {
      context.handle(
        _pageKeyMeta,
        pageKey.isAcceptableOrUnknown(data['page_key']!, _pageKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_pageKeyMeta);
    }
    if (data.containsKey('ordinal')) {
      context.handle(
        _ordinalMeta,
        ordinal.isAcceptableOrUnknown(data['ordinal']!, _ordinalMeta),
      );
    } else if (isInserting) {
      context.missing(_ordinalMeta);
    }
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    if (data.containsKey('source_record_key')) {
      context.handle(
        _sourceRecordKeyMeta,
        sourceRecordKey.isAcceptableOrUnknown(
          data['source_record_key']!,
          _sourceRecordKeyMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_sourceRecordKeyMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {pageKey, ordinal};
  @override
  WaterLevelPageItem map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return WaterLevelPageItem(
      pageKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}page_key'],
      )!,
      ordinal: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}ordinal'],
      )!,
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
      sourceRecordKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_record_key'],
      )!,
    );
  }

  @override
  $WaterLevelPageItemsTable createAlias(String alias) {
    return $WaterLevelPageItemsTable(attachedDatabase, alias);
  }
}

class WaterLevelPageItem extends DataClass
    implements Insertable<WaterLevelPageItem> {
  final String pageKey;
  final int ordinal;
  final String stationId;
  final String sourceRecordKey;
  const WaterLevelPageItem({
    required this.pageKey,
    required this.ordinal,
    required this.stationId,
    required this.sourceRecordKey,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['page_key'] = Variable<String>(pageKey);
    map['ordinal'] = Variable<int>(ordinal);
    map['station_id'] = Variable<String>(stationId);
    map['source_record_key'] = Variable<String>(sourceRecordKey);
    return map;
  }

  WaterLevelPageItemsCompanion toCompanion(bool nullToAbsent) {
    return WaterLevelPageItemsCompanion(
      pageKey: Value(pageKey),
      ordinal: Value(ordinal),
      stationId: Value(stationId),
      sourceRecordKey: Value(sourceRecordKey),
    );
  }

  factory WaterLevelPageItem.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return WaterLevelPageItem(
      pageKey: serializer.fromJson<String>(json['pageKey']),
      ordinal: serializer.fromJson<int>(json['ordinal']),
      stationId: serializer.fromJson<String>(json['stationId']),
      sourceRecordKey: serializer.fromJson<String>(json['sourceRecordKey']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'pageKey': serializer.toJson<String>(pageKey),
      'ordinal': serializer.toJson<int>(ordinal),
      'stationId': serializer.toJson<String>(stationId),
      'sourceRecordKey': serializer.toJson<String>(sourceRecordKey),
    };
  }

  WaterLevelPageItem copyWith({
    String? pageKey,
    int? ordinal,
    String? stationId,
    String? sourceRecordKey,
  }) => WaterLevelPageItem(
    pageKey: pageKey ?? this.pageKey,
    ordinal: ordinal ?? this.ordinal,
    stationId: stationId ?? this.stationId,
    sourceRecordKey: sourceRecordKey ?? this.sourceRecordKey,
  );
  WaterLevelPageItem copyWithCompanion(WaterLevelPageItemsCompanion data) {
    return WaterLevelPageItem(
      pageKey: data.pageKey.present ? data.pageKey.value : this.pageKey,
      ordinal: data.ordinal.present ? data.ordinal.value : this.ordinal,
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
      sourceRecordKey: data.sourceRecordKey.present
          ? data.sourceRecordKey.value
          : this.sourceRecordKey,
    );
  }

  @override
  String toString() {
    return (StringBuffer('WaterLevelPageItem(')
          ..write('pageKey: $pageKey, ')
          ..write('ordinal: $ordinal, ')
          ..write('stationId: $stationId, ')
          ..write('sourceRecordKey: $sourceRecordKey')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(pageKey, ordinal, stationId, sourceRecordKey);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is WaterLevelPageItem &&
          other.pageKey == this.pageKey &&
          other.ordinal == this.ordinal &&
          other.stationId == this.stationId &&
          other.sourceRecordKey == this.sourceRecordKey);
}

class WaterLevelPageItemsCompanion extends UpdateCompanion<WaterLevelPageItem> {
  final Value<String> pageKey;
  final Value<int> ordinal;
  final Value<String> stationId;
  final Value<String> sourceRecordKey;
  final Value<int> rowid;
  const WaterLevelPageItemsCompanion({
    this.pageKey = const Value.absent(),
    this.ordinal = const Value.absent(),
    this.stationId = const Value.absent(),
    this.sourceRecordKey = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  WaterLevelPageItemsCompanion.insert({
    required String pageKey,
    required int ordinal,
    required String stationId,
    required String sourceRecordKey,
    this.rowid = const Value.absent(),
  }) : pageKey = Value(pageKey),
       ordinal = Value(ordinal),
       stationId = Value(stationId),
       sourceRecordKey = Value(sourceRecordKey);
  static Insertable<WaterLevelPageItem> custom({
    Expression<String>? pageKey,
    Expression<int>? ordinal,
    Expression<String>? stationId,
    Expression<String>? sourceRecordKey,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (pageKey != null) 'page_key': pageKey,
      if (ordinal != null) 'ordinal': ordinal,
      if (stationId != null) 'station_id': stationId,
      if (sourceRecordKey != null) 'source_record_key': sourceRecordKey,
      if (rowid != null) 'rowid': rowid,
    });
  }

  WaterLevelPageItemsCompanion copyWith({
    Value<String>? pageKey,
    Value<int>? ordinal,
    Value<String>? stationId,
    Value<String>? sourceRecordKey,
    Value<int>? rowid,
  }) {
    return WaterLevelPageItemsCompanion(
      pageKey: pageKey ?? this.pageKey,
      ordinal: ordinal ?? this.ordinal,
      stationId: stationId ?? this.stationId,
      sourceRecordKey: sourceRecordKey ?? this.sourceRecordKey,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (pageKey.present) {
      map['page_key'] = Variable<String>(pageKey.value);
    }
    if (ordinal.present) {
      map['ordinal'] = Variable<int>(ordinal.value);
    }
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (sourceRecordKey.present) {
      map['source_record_key'] = Variable<String>(sourceRecordKey.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WaterLevelPageItemsCompanion(')
          ..write('pageKey: $pageKey, ')
          ..write('ordinal: $ordinal, ')
          ..write('stationId: $stationId, ')
          ..write('sourceRecordKey: $sourceRecordKey, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CalendarDaysTable extends CalendarDays
    with TableInfo<$CalendarDaysTable, CalendarDay> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CalendarDaysTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _solarYearMeta = const VerificationMeta(
    'solarYear',
  );
  @override
  late final GeneratedColumn<int> solarYear = GeneratedColumn<int>(
    'solar_year',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _solarMonthMeta = const VerificationMeta(
    'solarMonth',
  );
  @override
  late final GeneratedColumn<int> solarMonth = GeneratedColumn<int>(
    'solar_month',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _solarDayMeta = const VerificationMeta(
    'solarDay',
  );
  @override
  late final GeneratedColumn<int> solarDay = GeneratedColumn<int>(
    'solar_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lunarYearMeta = const VerificationMeta(
    'lunarYear',
  );
  @override
  late final GeneratedColumn<int> lunarYear = GeneratedColumn<int>(
    'lunar_year',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lunarMonthMeta = const VerificationMeta(
    'lunarMonth',
  );
  @override
  late final GeneratedColumn<int> lunarMonth = GeneratedColumn<int>(
    'lunar_month',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lunarDayMeta = const VerificationMeta(
    'lunarDay',
  );
  @override
  late final GeneratedColumn<int> lunarDay = GeneratedColumn<int>(
    'lunar_day',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isLeapMonthMeta = const VerificationMeta(
    'isLeapMonth',
  );
  @override
  late final GeneratedColumn<bool> isLeapMonth = GeneratedColumn<bool>(
    'is_leap_month',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_leap_month" IN (0, 1))',
    ),
  );
  static const VerificationMeta _timeZoneMeta = const VerificationMeta(
    'timeZone',
  );
  @override
  late final GeneratedColumn<String> timeZone = GeneratedColumn<String>(
    'time_zone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _generatedAtUtcMeta = const VerificationMeta(
    'generatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> generatedAtUtc =
      GeneratedColumn<DateTime>(
        'generated_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _fetchedAtUtcMeta = const VerificationMeta(
    'fetchedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAtUtc = GeneratedColumn<DateTime>(
    'fetched_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _maxAgeSecondsMeta = const VerificationMeta(
    'maxAgeSeconds',
  );
  @override
  late final GeneratedColumn<int> maxAgeSeconds = GeneratedColumn<int>(
    'max_age_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _staleWhileRevalidateSecondsMeta =
      const VerificationMeta('staleWhileRevalidateSeconds');
  @override
  late final GeneratedColumn<int> staleWhileRevalidateSeconds =
      GeneratedColumn<int>(
        'stale_while_revalidate_seconds',
        aliasedName,
        false,
        type: DriftSqlType.int,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    cacheKey,
    solarYear,
    solarMonth,
    solarDay,
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    timeZone,
    generatedAtUtc,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'calendar_days';
  @override
  VerificationContext validateIntegrity(
    Insertable<CalendarDay> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('solar_year')) {
      context.handle(
        _solarYearMeta,
        solarYear.isAcceptableOrUnknown(data['solar_year']!, _solarYearMeta),
      );
    } else if (isInserting) {
      context.missing(_solarYearMeta);
    }
    if (data.containsKey('solar_month')) {
      context.handle(
        _solarMonthMeta,
        solarMonth.isAcceptableOrUnknown(data['solar_month']!, _solarMonthMeta),
      );
    } else if (isInserting) {
      context.missing(_solarMonthMeta);
    }
    if (data.containsKey('solar_day')) {
      context.handle(
        _solarDayMeta,
        solarDay.isAcceptableOrUnknown(data['solar_day']!, _solarDayMeta),
      );
    } else if (isInserting) {
      context.missing(_solarDayMeta);
    }
    if (data.containsKey('lunar_year')) {
      context.handle(
        _lunarYearMeta,
        lunarYear.isAcceptableOrUnknown(data['lunar_year']!, _lunarYearMeta),
      );
    } else if (isInserting) {
      context.missing(_lunarYearMeta);
    }
    if (data.containsKey('lunar_month')) {
      context.handle(
        _lunarMonthMeta,
        lunarMonth.isAcceptableOrUnknown(data['lunar_month']!, _lunarMonthMeta),
      );
    } else if (isInserting) {
      context.missing(_lunarMonthMeta);
    }
    if (data.containsKey('lunar_day')) {
      context.handle(
        _lunarDayMeta,
        lunarDay.isAcceptableOrUnknown(data['lunar_day']!, _lunarDayMeta),
      );
    } else if (isInserting) {
      context.missing(_lunarDayMeta);
    }
    if (data.containsKey('is_leap_month')) {
      context.handle(
        _isLeapMonthMeta,
        isLeapMonth.isAcceptableOrUnknown(
          data['is_leap_month']!,
          _isLeapMonthMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_isLeapMonthMeta);
    }
    if (data.containsKey('time_zone')) {
      context.handle(
        _timeZoneMeta,
        timeZone.isAcceptableOrUnknown(data['time_zone']!, _timeZoneMeta),
      );
    } else if (isInserting) {
      context.missing(_timeZoneMeta);
    }
    if (data.containsKey('generated_at_utc')) {
      context.handle(
        _generatedAtUtcMeta,
        generatedAtUtc.isAcceptableOrUnknown(
          data['generated_at_utc']!,
          _generatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_generatedAtUtcMeta);
    }
    if (data.containsKey('fetched_at_utc')) {
      context.handle(
        _fetchedAtUtcMeta,
        fetchedAtUtc.isAcceptableOrUnknown(
          data['fetched_at_utc']!,
          _fetchedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtUtcMeta);
    }
    if (data.containsKey('max_age_seconds')) {
      context.handle(
        _maxAgeSecondsMeta,
        maxAgeSeconds.isAcceptableOrUnknown(
          data['max_age_seconds']!,
          _maxAgeSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_maxAgeSecondsMeta);
    }
    if (data.containsKey('stale_while_revalidate_seconds')) {
      context.handle(
        _staleWhileRevalidateSecondsMeta,
        staleWhileRevalidateSeconds.isAcceptableOrUnknown(
          data['stale_while_revalidate_seconds']!,
          _staleWhileRevalidateSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_staleWhileRevalidateSecondsMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey};
  @override
  CalendarDay map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CalendarDay(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      solarYear: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}solar_year'],
      )!,
      solarMonth: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}solar_month'],
      )!,
      solarDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}solar_day'],
      )!,
      lunarYear: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}lunar_year'],
      )!,
      lunarMonth: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}lunar_month'],
      )!,
      lunarDay: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}lunar_day'],
      )!,
      isLeapMonth: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_leap_month'],
      )!,
      timeZone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}time_zone'],
      )!,
      generatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}generated_at_utc'],
      )!,
      fetchedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at_utc'],
      )!,
      maxAgeSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}max_age_seconds'],
      )!,
      staleWhileRevalidateSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stale_while_revalidate_seconds'],
      )!,
    );
  }

  @override
  $CalendarDaysTable createAlias(String alias) {
    return $CalendarDaysTable(attachedDatabase, alias);
  }
}

class CalendarDay extends DataClass implements Insertable<CalendarDay> {
  final String cacheKey;
  final int solarYear;
  final int solarMonth;
  final int solarDay;
  final int lunarYear;
  final int lunarMonth;
  final int lunarDay;
  final bool isLeapMonth;
  final String timeZone;
  final DateTime generatedAtUtc;
  final DateTime fetchedAtUtc;
  final int maxAgeSeconds;
  final int staleWhileRevalidateSeconds;
  const CalendarDay({
    required this.cacheKey,
    required this.solarYear,
    required this.solarMonth,
    required this.solarDay,
    required this.lunarYear,
    required this.lunarMonth,
    required this.lunarDay,
    required this.isLeapMonth,
    required this.timeZone,
    required this.generatedAtUtc,
    required this.fetchedAtUtc,
    required this.maxAgeSeconds,
    required this.staleWhileRevalidateSeconds,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['solar_year'] = Variable<int>(solarYear);
    map['solar_month'] = Variable<int>(solarMonth);
    map['solar_day'] = Variable<int>(solarDay);
    map['lunar_year'] = Variable<int>(lunarYear);
    map['lunar_month'] = Variable<int>(lunarMonth);
    map['lunar_day'] = Variable<int>(lunarDay);
    map['is_leap_month'] = Variable<bool>(isLeapMonth);
    map['time_zone'] = Variable<String>(timeZone);
    map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc);
    map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc);
    map['max_age_seconds'] = Variable<int>(maxAgeSeconds);
    map['stale_while_revalidate_seconds'] = Variable<int>(
      staleWhileRevalidateSeconds,
    );
    return map;
  }

  CalendarDaysCompanion toCompanion(bool nullToAbsent) {
    return CalendarDaysCompanion(
      cacheKey: Value(cacheKey),
      solarYear: Value(solarYear),
      solarMonth: Value(solarMonth),
      solarDay: Value(solarDay),
      lunarYear: Value(lunarYear),
      lunarMonth: Value(lunarMonth),
      lunarDay: Value(lunarDay),
      isLeapMonth: Value(isLeapMonth),
      timeZone: Value(timeZone),
      generatedAtUtc: Value(generatedAtUtc),
      fetchedAtUtc: Value(fetchedAtUtc),
      maxAgeSeconds: Value(maxAgeSeconds),
      staleWhileRevalidateSeconds: Value(staleWhileRevalidateSeconds),
    );
  }

  factory CalendarDay.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CalendarDay(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      solarYear: serializer.fromJson<int>(json['solarYear']),
      solarMonth: serializer.fromJson<int>(json['solarMonth']),
      solarDay: serializer.fromJson<int>(json['solarDay']),
      lunarYear: serializer.fromJson<int>(json['lunarYear']),
      lunarMonth: serializer.fromJson<int>(json['lunarMonth']),
      lunarDay: serializer.fromJson<int>(json['lunarDay']),
      isLeapMonth: serializer.fromJson<bool>(json['isLeapMonth']),
      timeZone: serializer.fromJson<String>(json['timeZone']),
      generatedAtUtc: serializer.fromJson<DateTime>(json['generatedAtUtc']),
      fetchedAtUtc: serializer.fromJson<DateTime>(json['fetchedAtUtc']),
      maxAgeSeconds: serializer.fromJson<int>(json['maxAgeSeconds']),
      staleWhileRevalidateSeconds: serializer.fromJson<int>(
        json['staleWhileRevalidateSeconds'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'solarYear': serializer.toJson<int>(solarYear),
      'solarMonth': serializer.toJson<int>(solarMonth),
      'solarDay': serializer.toJson<int>(solarDay),
      'lunarYear': serializer.toJson<int>(lunarYear),
      'lunarMonth': serializer.toJson<int>(lunarMonth),
      'lunarDay': serializer.toJson<int>(lunarDay),
      'isLeapMonth': serializer.toJson<bool>(isLeapMonth),
      'timeZone': serializer.toJson<String>(timeZone),
      'generatedAtUtc': serializer.toJson<DateTime>(generatedAtUtc),
      'fetchedAtUtc': serializer.toJson<DateTime>(fetchedAtUtc),
      'maxAgeSeconds': serializer.toJson<int>(maxAgeSeconds),
      'staleWhileRevalidateSeconds': serializer.toJson<int>(
        staleWhileRevalidateSeconds,
      ),
    };
  }

  CalendarDay copyWith({
    String? cacheKey,
    int? solarYear,
    int? solarMonth,
    int? solarDay,
    int? lunarYear,
    int? lunarMonth,
    int? lunarDay,
    bool? isLeapMonth,
    String? timeZone,
    DateTime? generatedAtUtc,
    DateTime? fetchedAtUtc,
    int? maxAgeSeconds,
    int? staleWhileRevalidateSeconds,
  }) => CalendarDay(
    cacheKey: cacheKey ?? this.cacheKey,
    solarYear: solarYear ?? this.solarYear,
    solarMonth: solarMonth ?? this.solarMonth,
    solarDay: solarDay ?? this.solarDay,
    lunarYear: lunarYear ?? this.lunarYear,
    lunarMonth: lunarMonth ?? this.lunarMonth,
    lunarDay: lunarDay ?? this.lunarDay,
    isLeapMonth: isLeapMonth ?? this.isLeapMonth,
    timeZone: timeZone ?? this.timeZone,
    generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
    fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
    maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
    staleWhileRevalidateSeconds:
        staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
  );
  CalendarDay copyWithCompanion(CalendarDaysCompanion data) {
    return CalendarDay(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      solarYear: data.solarYear.present ? data.solarYear.value : this.solarYear,
      solarMonth: data.solarMonth.present
          ? data.solarMonth.value
          : this.solarMonth,
      solarDay: data.solarDay.present ? data.solarDay.value : this.solarDay,
      lunarYear: data.lunarYear.present ? data.lunarYear.value : this.lunarYear,
      lunarMonth: data.lunarMonth.present
          ? data.lunarMonth.value
          : this.lunarMonth,
      lunarDay: data.lunarDay.present ? data.lunarDay.value : this.lunarDay,
      isLeapMonth: data.isLeapMonth.present
          ? data.isLeapMonth.value
          : this.isLeapMonth,
      timeZone: data.timeZone.present ? data.timeZone.value : this.timeZone,
      generatedAtUtc: data.generatedAtUtc.present
          ? data.generatedAtUtc.value
          : this.generatedAtUtc,
      fetchedAtUtc: data.fetchedAtUtc.present
          ? data.fetchedAtUtc.value
          : this.fetchedAtUtc,
      maxAgeSeconds: data.maxAgeSeconds.present
          ? data.maxAgeSeconds.value
          : this.maxAgeSeconds,
      staleWhileRevalidateSeconds: data.staleWhileRevalidateSeconds.present
          ? data.staleWhileRevalidateSeconds.value
          : this.staleWhileRevalidateSeconds,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CalendarDay(')
          ..write('cacheKey: $cacheKey, ')
          ..write('solarYear: $solarYear, ')
          ..write('solarMonth: $solarMonth, ')
          ..write('solarDay: $solarDay, ')
          ..write('lunarYear: $lunarYear, ')
          ..write('lunarMonth: $lunarMonth, ')
          ..write('lunarDay: $lunarDay, ')
          ..write('isLeapMonth: $isLeapMonth, ')
          ..write('timeZone: $timeZone, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    cacheKey,
    solarYear,
    solarMonth,
    solarDay,
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    timeZone,
    generatedAtUtc,
    fetchedAtUtc,
    maxAgeSeconds,
    staleWhileRevalidateSeconds,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CalendarDay &&
          other.cacheKey == this.cacheKey &&
          other.solarYear == this.solarYear &&
          other.solarMonth == this.solarMonth &&
          other.solarDay == this.solarDay &&
          other.lunarYear == this.lunarYear &&
          other.lunarMonth == this.lunarMonth &&
          other.lunarDay == this.lunarDay &&
          other.isLeapMonth == this.isLeapMonth &&
          other.timeZone == this.timeZone &&
          other.generatedAtUtc == this.generatedAtUtc &&
          other.fetchedAtUtc == this.fetchedAtUtc &&
          other.maxAgeSeconds == this.maxAgeSeconds &&
          other.staleWhileRevalidateSeconds ==
              this.staleWhileRevalidateSeconds);
}

class CalendarDaysCompanion extends UpdateCompanion<CalendarDay> {
  final Value<String> cacheKey;
  final Value<int> solarYear;
  final Value<int> solarMonth;
  final Value<int> solarDay;
  final Value<int> lunarYear;
  final Value<int> lunarMonth;
  final Value<int> lunarDay;
  final Value<bool> isLeapMonth;
  final Value<String> timeZone;
  final Value<DateTime> generatedAtUtc;
  final Value<DateTime> fetchedAtUtc;
  final Value<int> maxAgeSeconds;
  final Value<int> staleWhileRevalidateSeconds;
  final Value<int> rowid;
  const CalendarDaysCompanion({
    this.cacheKey = const Value.absent(),
    this.solarYear = const Value.absent(),
    this.solarMonth = const Value.absent(),
    this.solarDay = const Value.absent(),
    this.lunarYear = const Value.absent(),
    this.lunarMonth = const Value.absent(),
    this.lunarDay = const Value.absent(),
    this.isLeapMonth = const Value.absent(),
    this.timeZone = const Value.absent(),
    this.generatedAtUtc = const Value.absent(),
    this.fetchedAtUtc = const Value.absent(),
    this.maxAgeSeconds = const Value.absent(),
    this.staleWhileRevalidateSeconds = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CalendarDaysCompanion.insert({
    required String cacheKey,
    required int solarYear,
    required int solarMonth,
    required int solarDay,
    required int lunarYear,
    required int lunarMonth,
    required int lunarDay,
    required bool isLeapMonth,
    required String timeZone,
    required DateTime generatedAtUtc,
    required DateTime fetchedAtUtc,
    required int maxAgeSeconds,
    required int staleWhileRevalidateSeconds,
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       solarYear = Value(solarYear),
       solarMonth = Value(solarMonth),
       solarDay = Value(solarDay),
       lunarYear = Value(lunarYear),
       lunarMonth = Value(lunarMonth),
       lunarDay = Value(lunarDay),
       isLeapMonth = Value(isLeapMonth),
       timeZone = Value(timeZone),
       generatedAtUtc = Value(generatedAtUtc),
       fetchedAtUtc = Value(fetchedAtUtc),
       maxAgeSeconds = Value(maxAgeSeconds),
       staleWhileRevalidateSeconds = Value(staleWhileRevalidateSeconds);
  static Insertable<CalendarDay> custom({
    Expression<String>? cacheKey,
    Expression<int>? solarYear,
    Expression<int>? solarMonth,
    Expression<int>? solarDay,
    Expression<int>? lunarYear,
    Expression<int>? lunarMonth,
    Expression<int>? lunarDay,
    Expression<bool>? isLeapMonth,
    Expression<String>? timeZone,
    Expression<DateTime>? generatedAtUtc,
    Expression<DateTime>? fetchedAtUtc,
    Expression<int>? maxAgeSeconds,
    Expression<int>? staleWhileRevalidateSeconds,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (solarYear != null) 'solar_year': solarYear,
      if (solarMonth != null) 'solar_month': solarMonth,
      if (solarDay != null) 'solar_day': solarDay,
      if (lunarYear != null) 'lunar_year': lunarYear,
      if (lunarMonth != null) 'lunar_month': lunarMonth,
      if (lunarDay != null) 'lunar_day': lunarDay,
      if (isLeapMonth != null) 'is_leap_month': isLeapMonth,
      if (timeZone != null) 'time_zone': timeZone,
      if (generatedAtUtc != null) 'generated_at_utc': generatedAtUtc,
      if (fetchedAtUtc != null) 'fetched_at_utc': fetchedAtUtc,
      if (maxAgeSeconds != null) 'max_age_seconds': maxAgeSeconds,
      if (staleWhileRevalidateSeconds != null)
        'stale_while_revalidate_seconds': staleWhileRevalidateSeconds,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CalendarDaysCompanion copyWith({
    Value<String>? cacheKey,
    Value<int>? solarYear,
    Value<int>? solarMonth,
    Value<int>? solarDay,
    Value<int>? lunarYear,
    Value<int>? lunarMonth,
    Value<int>? lunarDay,
    Value<bool>? isLeapMonth,
    Value<String>? timeZone,
    Value<DateTime>? generatedAtUtc,
    Value<DateTime>? fetchedAtUtc,
    Value<int>? maxAgeSeconds,
    Value<int>? staleWhileRevalidateSeconds,
    Value<int>? rowid,
  }) {
    return CalendarDaysCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      solarYear: solarYear ?? this.solarYear,
      solarMonth: solarMonth ?? this.solarMonth,
      solarDay: solarDay ?? this.solarDay,
      lunarYear: lunarYear ?? this.lunarYear,
      lunarMonth: lunarMonth ?? this.lunarMonth,
      lunarDay: lunarDay ?? this.lunarDay,
      isLeapMonth: isLeapMonth ?? this.isLeapMonth,
      timeZone: timeZone ?? this.timeZone,
      generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
      fetchedAtUtc: fetchedAtUtc ?? this.fetchedAtUtc,
      maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
      staleWhileRevalidateSeconds:
          staleWhileRevalidateSeconds ?? this.staleWhileRevalidateSeconds,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (solarYear.present) {
      map['solar_year'] = Variable<int>(solarYear.value);
    }
    if (solarMonth.present) {
      map['solar_month'] = Variable<int>(solarMonth.value);
    }
    if (solarDay.present) {
      map['solar_day'] = Variable<int>(solarDay.value);
    }
    if (lunarYear.present) {
      map['lunar_year'] = Variable<int>(lunarYear.value);
    }
    if (lunarMonth.present) {
      map['lunar_month'] = Variable<int>(lunarMonth.value);
    }
    if (lunarDay.present) {
      map['lunar_day'] = Variable<int>(lunarDay.value);
    }
    if (isLeapMonth.present) {
      map['is_leap_month'] = Variable<bool>(isLeapMonth.value);
    }
    if (timeZone.present) {
      map['time_zone'] = Variable<String>(timeZone.value);
    }
    if (generatedAtUtc.present) {
      map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc.value);
    }
    if (fetchedAtUtc.present) {
      map['fetched_at_utc'] = Variable<DateTime>(fetchedAtUtc.value);
    }
    if (maxAgeSeconds.present) {
      map['max_age_seconds'] = Variable<int>(maxAgeSeconds.value);
    }
    if (staleWhileRevalidateSeconds.present) {
      map['stale_while_revalidate_seconds'] = Variable<int>(
        staleWhileRevalidateSeconds.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CalendarDaysCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('solarYear: $solarYear, ')
          ..write('solarMonth: $solarMonth, ')
          ..write('solarDay: $solarDay, ')
          ..write('lunarYear: $lunarYear, ')
          ..write('lunarMonth: $lunarMonth, ')
          ..write('lunarDay: $lunarDay, ')
          ..write('isLeapMonth: $isLeapMonth, ')
          ..write('timeZone: $timeZone, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('fetchedAtUtc: $fetchedAtUtc, ')
          ..write('maxAgeSeconds: $maxAgeSeconds, ')
          ..write('staleWhileRevalidateSeconds: $staleWhileRevalidateSeconds, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FavoritesTable extends Favorites
    with TableInfo<$FavoritesTable, Favorite> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FavoritesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _stationIdMeta = const VerificationMeta(
    'stationId',
  );
  @override
  late final GeneratedColumn<String> stationId = GeneratedColumn<String>(
    'station_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtUtcMeta = const VerificationMeta(
    'createdAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> createdAtUtc = GeneratedColumn<DateTime>(
    'created_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [stationId, createdAtUtc];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'favorites';
  @override
  VerificationContext validateIntegrity(
    Insertable<Favorite> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('station_id')) {
      context.handle(
        _stationIdMeta,
        stationId.isAcceptableOrUnknown(data['station_id']!, _stationIdMeta),
      );
    } else if (isInserting) {
      context.missing(_stationIdMeta);
    }
    if (data.containsKey('created_at_utc')) {
      context.handle(
        _createdAtUtcMeta,
        createdAtUtc.isAcceptableOrUnknown(
          data['created_at_utc']!,
          _createdAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_createdAtUtcMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {stationId};
  @override
  Favorite map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Favorite(
      stationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}station_id'],
      )!,
      createdAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at_utc'],
      )!,
    );
  }

  @override
  $FavoritesTable createAlias(String alias) {
    return $FavoritesTable(attachedDatabase, alias);
  }
}

class Favorite extends DataClass implements Insertable<Favorite> {
  final String stationId;
  final DateTime createdAtUtc;
  const Favorite({required this.stationId, required this.createdAtUtc});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['station_id'] = Variable<String>(stationId);
    map['created_at_utc'] = Variable<DateTime>(createdAtUtc);
    return map;
  }

  FavoritesCompanion toCompanion(bool nullToAbsent) {
    return FavoritesCompanion(
      stationId: Value(stationId),
      createdAtUtc: Value(createdAtUtc),
    );
  }

  factory Favorite.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Favorite(
      stationId: serializer.fromJson<String>(json['stationId']),
      createdAtUtc: serializer.fromJson<DateTime>(json['createdAtUtc']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'stationId': serializer.toJson<String>(stationId),
      'createdAtUtc': serializer.toJson<DateTime>(createdAtUtc),
    };
  }

  Favorite copyWith({String? stationId, DateTime? createdAtUtc}) => Favorite(
    stationId: stationId ?? this.stationId,
    createdAtUtc: createdAtUtc ?? this.createdAtUtc,
  );
  Favorite copyWithCompanion(FavoritesCompanion data) {
    return Favorite(
      stationId: data.stationId.present ? data.stationId.value : this.stationId,
      createdAtUtc: data.createdAtUtc.present
          ? data.createdAtUtc.value
          : this.createdAtUtc,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Favorite(')
          ..write('stationId: $stationId, ')
          ..write('createdAtUtc: $createdAtUtc')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(stationId, createdAtUtc);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Favorite &&
          other.stationId == this.stationId &&
          other.createdAtUtc == this.createdAtUtc);
}

class FavoritesCompanion extends UpdateCompanion<Favorite> {
  final Value<String> stationId;
  final Value<DateTime> createdAtUtc;
  final Value<int> rowid;
  const FavoritesCompanion({
    this.stationId = const Value.absent(),
    this.createdAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FavoritesCompanion.insert({
    required String stationId,
    required DateTime createdAtUtc,
    this.rowid = const Value.absent(),
  }) : stationId = Value(stationId),
       createdAtUtc = Value(createdAtUtc);
  static Insertable<Favorite> custom({
    Expression<String>? stationId,
    Expression<DateTime>? createdAtUtc,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (stationId != null) 'station_id': stationId,
      if (createdAtUtc != null) 'created_at_utc': createdAtUtc,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FavoritesCompanion copyWith({
    Value<String>? stationId,
    Value<DateTime>? createdAtUtc,
    Value<int>? rowid,
  }) {
    return FavoritesCompanion(
      stationId: stationId ?? this.stationId,
      createdAtUtc: createdAtUtc ?? this.createdAtUtc,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (stationId.present) {
      map['station_id'] = Variable<String>(stationId.value);
    }
    if (createdAtUtc.present) {
      map['created_at_utc'] = Variable<DateTime>(createdAtUtc.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FavoritesCompanion(')
          ..write('stationId: $stationId, ')
          ..write('createdAtUtc: $createdAtUtc, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PreferencesTable extends Preferences
    with TableInfo<$PreferencesTable, Preference> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PreferencesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _jsonScalarValueMeta = const VerificationMeta(
    'jsonScalarValue',
  );
  @override
  late final GeneratedColumn<String> jsonScalarValue = GeneratedColumn<String>(
    'json_scalar_value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtUtcMeta = const VerificationMeta(
    'updatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAtUtc = GeneratedColumn<DateTime>(
    'updated_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, jsonScalarValue, updatedAtUtc];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'preferences';
  @override
  VerificationContext validateIntegrity(
    Insertable<Preference> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('json_scalar_value')) {
      context.handle(
        _jsonScalarValueMeta,
        jsonScalarValue.isAcceptableOrUnknown(
          data['json_scalar_value']!,
          _jsonScalarValueMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_jsonScalarValueMeta);
    }
    if (data.containsKey('updated_at_utc')) {
      context.handle(
        _updatedAtUtcMeta,
        updatedAtUtc.isAcceptableOrUnknown(
          data['updated_at_utc']!,
          _updatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_updatedAtUtcMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  Preference map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Preference(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      jsonScalarValue: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}json_scalar_value'],
      )!,
      updatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at_utc'],
      )!,
    );
  }

  @override
  $PreferencesTable createAlias(String alias) {
    return $PreferencesTable(attachedDatabase, alias);
  }
}

class Preference extends DataClass implements Insertable<Preference> {
  final String key;
  final String jsonScalarValue;
  final DateTime updatedAtUtc;
  const Preference({
    required this.key,
    required this.jsonScalarValue,
    required this.updatedAtUtc,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['json_scalar_value'] = Variable<String>(jsonScalarValue);
    map['updated_at_utc'] = Variable<DateTime>(updatedAtUtc);
    return map;
  }

  PreferencesCompanion toCompanion(bool nullToAbsent) {
    return PreferencesCompanion(
      key: Value(key),
      jsonScalarValue: Value(jsonScalarValue),
      updatedAtUtc: Value(updatedAtUtc),
    );
  }

  factory Preference.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Preference(
      key: serializer.fromJson<String>(json['key']),
      jsonScalarValue: serializer.fromJson<String>(json['jsonScalarValue']),
      updatedAtUtc: serializer.fromJson<DateTime>(json['updatedAtUtc']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'jsonScalarValue': serializer.toJson<String>(jsonScalarValue),
      'updatedAtUtc': serializer.toJson<DateTime>(updatedAtUtc),
    };
  }

  Preference copyWith({
    String? key,
    String? jsonScalarValue,
    DateTime? updatedAtUtc,
  }) => Preference(
    key: key ?? this.key,
    jsonScalarValue: jsonScalarValue ?? this.jsonScalarValue,
    updatedAtUtc: updatedAtUtc ?? this.updatedAtUtc,
  );
  Preference copyWithCompanion(PreferencesCompanion data) {
    return Preference(
      key: data.key.present ? data.key.value : this.key,
      jsonScalarValue: data.jsonScalarValue.present
          ? data.jsonScalarValue.value
          : this.jsonScalarValue,
      updatedAtUtc: data.updatedAtUtc.present
          ? data.updatedAtUtc.value
          : this.updatedAtUtc,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Preference(')
          ..write('key: $key, ')
          ..write('jsonScalarValue: $jsonScalarValue, ')
          ..write('updatedAtUtc: $updatedAtUtc')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, jsonScalarValue, updatedAtUtc);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Preference &&
          other.key == this.key &&
          other.jsonScalarValue == this.jsonScalarValue &&
          other.updatedAtUtc == this.updatedAtUtc);
}

class PreferencesCompanion extends UpdateCompanion<Preference> {
  final Value<String> key;
  final Value<String> jsonScalarValue;
  final Value<DateTime> updatedAtUtc;
  final Value<int> rowid;
  const PreferencesCompanion({
    this.key = const Value.absent(),
    this.jsonScalarValue = const Value.absent(),
    this.updatedAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PreferencesCompanion.insert({
    required String key,
    required String jsonScalarValue,
    required DateTime updatedAtUtc,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       jsonScalarValue = Value(jsonScalarValue),
       updatedAtUtc = Value(updatedAtUtc);
  static Insertable<Preference> custom({
    Expression<String>? key,
    Expression<String>? jsonScalarValue,
    Expression<DateTime>? updatedAtUtc,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (jsonScalarValue != null) 'json_scalar_value': jsonScalarValue,
      if (updatedAtUtc != null) 'updated_at_utc': updatedAtUtc,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PreferencesCompanion copyWith({
    Value<String>? key,
    Value<String>? jsonScalarValue,
    Value<DateTime>? updatedAtUtc,
    Value<int>? rowid,
  }) {
    return PreferencesCompanion(
      key: key ?? this.key,
      jsonScalarValue: jsonScalarValue ?? this.jsonScalarValue,
      updatedAtUtc: updatedAtUtc ?? this.updatedAtUtc,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (jsonScalarValue.present) {
      map['json_scalar_value'] = Variable<String>(jsonScalarValue.value);
    }
    if (updatedAtUtc.present) {
      map['updated_at_utc'] = Variable<DateTime>(updatedAtUtc.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PreferencesCompanion(')
          ..write('key: $key, ')
          ..write('jsonScalarValue: $jsonScalarValue, ')
          ..write('updatedAtUtc: $updatedAtUtc, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $OfflineManifestsTable extends OfflineManifests
    with TableInfo<$OfflineManifestsTable, OfflineManifest> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OfflineManifestsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _packIdMeta = const VerificationMeta('packId');
  @override
  late final GeneratedColumn<String> packId = GeneratedColumn<String>(
    'pack_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _versionMeta = const VerificationMeta(
    'version',
  );
  @override
  late final GeneratedColumn<String> version = GeneratedColumn<String>(
    'version',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _packSchemaVersionMeta = const VerificationMeta(
    'packSchemaVersion',
  );
  @override
  late final GeneratedColumn<int> packSchemaVersion = GeneratedColumn<int>(
    'pack_schema_version',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _generatedAtUtcMeta = const VerificationMeta(
    'generatedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> generatedAtUtc =
      GeneratedColumn<DateTime>(
        'generated_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _expiresAtUtcMeta = const VerificationMeta(
    'expiresAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> expiresAtUtc = GeneratedColumn<DateTime>(
    'expires_at_utc',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _checksumMeta = const VerificationMeta(
    'checksum',
  );
  @override
  late final GeneratedColumn<String> checksum = GeneratedColumn<String>(
    'checksum',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _contentSummaryJsonMeta =
      const VerificationMeta('contentSummaryJson');
  @override
  late final GeneratedColumn<String> contentSummaryJson =
      GeneratedColumn<String>(
        'content_summary_json',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _sourceSummaryJsonMeta = const VerificationMeta(
    'sourceSummaryJson',
  );
  @override
  late final GeneratedColumn<String> sourceSummaryJson =
      GeneratedColumn<String>(
        'source_summary_json',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _minimumAppVersionMeta = const VerificationMeta(
    'minimumAppVersion',
  );
  @override
  late final GeneratedColumn<String> minimumAppVersion =
      GeneratedColumn<String>(
        'minimum_app_version',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _installedAtUtcMeta = const VerificationMeta(
    'installedAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> installedAtUtc =
      GeneratedColumn<DateTime>(
        'installed_at_utc',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    packId,
    version,
    packSchemaVersion,
    generatedAtUtc,
    expiresAtUtc,
    checksum,
    contentSummaryJson,
    sourceSummaryJson,
    minimumAppVersion,
    installedAtUtc,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'offline_manifests';
  @override
  VerificationContext validateIntegrity(
    Insertable<OfflineManifest> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('pack_id')) {
      context.handle(
        _packIdMeta,
        packId.isAcceptableOrUnknown(data['pack_id']!, _packIdMeta),
      );
    } else if (isInserting) {
      context.missing(_packIdMeta);
    }
    if (data.containsKey('version')) {
      context.handle(
        _versionMeta,
        version.isAcceptableOrUnknown(data['version']!, _versionMeta),
      );
    } else if (isInserting) {
      context.missing(_versionMeta);
    }
    if (data.containsKey('pack_schema_version')) {
      context.handle(
        _packSchemaVersionMeta,
        packSchemaVersion.isAcceptableOrUnknown(
          data['pack_schema_version']!,
          _packSchemaVersionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_packSchemaVersionMeta);
    }
    if (data.containsKey('generated_at_utc')) {
      context.handle(
        _generatedAtUtcMeta,
        generatedAtUtc.isAcceptableOrUnknown(
          data['generated_at_utc']!,
          _generatedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_generatedAtUtcMeta);
    }
    if (data.containsKey('expires_at_utc')) {
      context.handle(
        _expiresAtUtcMeta,
        expiresAtUtc.isAcceptableOrUnknown(
          data['expires_at_utc']!,
          _expiresAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_expiresAtUtcMeta);
    }
    if (data.containsKey('checksum')) {
      context.handle(
        _checksumMeta,
        checksum.isAcceptableOrUnknown(data['checksum']!, _checksumMeta),
      );
    } else if (isInserting) {
      context.missing(_checksumMeta);
    }
    if (data.containsKey('content_summary_json')) {
      context.handle(
        _contentSummaryJsonMeta,
        contentSummaryJson.isAcceptableOrUnknown(
          data['content_summary_json']!,
          _contentSummaryJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_contentSummaryJsonMeta);
    }
    if (data.containsKey('source_summary_json')) {
      context.handle(
        _sourceSummaryJsonMeta,
        sourceSummaryJson.isAcceptableOrUnknown(
          data['source_summary_json']!,
          _sourceSummaryJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_sourceSummaryJsonMeta);
    }
    if (data.containsKey('minimum_app_version')) {
      context.handle(
        _minimumAppVersionMeta,
        minimumAppVersion.isAcceptableOrUnknown(
          data['minimum_app_version']!,
          _minimumAppVersionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_minimumAppVersionMeta);
    }
    if (data.containsKey('installed_at_utc')) {
      context.handle(
        _installedAtUtcMeta,
        installedAtUtc.isAcceptableOrUnknown(
          data['installed_at_utc']!,
          _installedAtUtcMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_installedAtUtcMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {packId};
  @override
  OfflineManifest map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OfflineManifest(
      packId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pack_id'],
      )!,
      version: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}version'],
      )!,
      packSchemaVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}pack_schema_version'],
      )!,
      generatedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}generated_at_utc'],
      )!,
      expiresAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}expires_at_utc'],
      )!,
      checksum: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}checksum'],
      )!,
      contentSummaryJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}content_summary_json'],
      )!,
      sourceSummaryJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_summary_json'],
      )!,
      minimumAppVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}minimum_app_version'],
      )!,
      installedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}installed_at_utc'],
      )!,
    );
  }

  @override
  $OfflineManifestsTable createAlias(String alias) {
    return $OfflineManifestsTable(attachedDatabase, alias);
  }
}

class OfflineManifest extends DataClass implements Insertable<OfflineManifest> {
  final String packId;
  final String version;
  final int packSchemaVersion;
  final DateTime generatedAtUtc;
  final DateTime expiresAtUtc;
  final String checksum;
  final String contentSummaryJson;
  final String sourceSummaryJson;
  final String minimumAppVersion;
  final DateTime installedAtUtc;
  const OfflineManifest({
    required this.packId,
    required this.version,
    required this.packSchemaVersion,
    required this.generatedAtUtc,
    required this.expiresAtUtc,
    required this.checksum,
    required this.contentSummaryJson,
    required this.sourceSummaryJson,
    required this.minimumAppVersion,
    required this.installedAtUtc,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['pack_id'] = Variable<String>(packId);
    map['version'] = Variable<String>(version);
    map['pack_schema_version'] = Variable<int>(packSchemaVersion);
    map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc);
    map['expires_at_utc'] = Variable<DateTime>(expiresAtUtc);
    map['checksum'] = Variable<String>(checksum);
    map['content_summary_json'] = Variable<String>(contentSummaryJson);
    map['source_summary_json'] = Variable<String>(sourceSummaryJson);
    map['minimum_app_version'] = Variable<String>(minimumAppVersion);
    map['installed_at_utc'] = Variable<DateTime>(installedAtUtc);
    return map;
  }

  OfflineManifestsCompanion toCompanion(bool nullToAbsent) {
    return OfflineManifestsCompanion(
      packId: Value(packId),
      version: Value(version),
      packSchemaVersion: Value(packSchemaVersion),
      generatedAtUtc: Value(generatedAtUtc),
      expiresAtUtc: Value(expiresAtUtc),
      checksum: Value(checksum),
      contentSummaryJson: Value(contentSummaryJson),
      sourceSummaryJson: Value(sourceSummaryJson),
      minimumAppVersion: Value(minimumAppVersion),
      installedAtUtc: Value(installedAtUtc),
    );
  }

  factory OfflineManifest.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OfflineManifest(
      packId: serializer.fromJson<String>(json['packId']),
      version: serializer.fromJson<String>(json['version']),
      packSchemaVersion: serializer.fromJson<int>(json['packSchemaVersion']),
      generatedAtUtc: serializer.fromJson<DateTime>(json['generatedAtUtc']),
      expiresAtUtc: serializer.fromJson<DateTime>(json['expiresAtUtc']),
      checksum: serializer.fromJson<String>(json['checksum']),
      contentSummaryJson: serializer.fromJson<String>(
        json['contentSummaryJson'],
      ),
      sourceSummaryJson: serializer.fromJson<String>(json['sourceSummaryJson']),
      minimumAppVersion: serializer.fromJson<String>(json['minimumAppVersion']),
      installedAtUtc: serializer.fromJson<DateTime>(json['installedAtUtc']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'packId': serializer.toJson<String>(packId),
      'version': serializer.toJson<String>(version),
      'packSchemaVersion': serializer.toJson<int>(packSchemaVersion),
      'generatedAtUtc': serializer.toJson<DateTime>(generatedAtUtc),
      'expiresAtUtc': serializer.toJson<DateTime>(expiresAtUtc),
      'checksum': serializer.toJson<String>(checksum),
      'contentSummaryJson': serializer.toJson<String>(contentSummaryJson),
      'sourceSummaryJson': serializer.toJson<String>(sourceSummaryJson),
      'minimumAppVersion': serializer.toJson<String>(minimumAppVersion),
      'installedAtUtc': serializer.toJson<DateTime>(installedAtUtc),
    };
  }

  OfflineManifest copyWith({
    String? packId,
    String? version,
    int? packSchemaVersion,
    DateTime? generatedAtUtc,
    DateTime? expiresAtUtc,
    String? checksum,
    String? contentSummaryJson,
    String? sourceSummaryJson,
    String? minimumAppVersion,
    DateTime? installedAtUtc,
  }) => OfflineManifest(
    packId: packId ?? this.packId,
    version: version ?? this.version,
    packSchemaVersion: packSchemaVersion ?? this.packSchemaVersion,
    generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
    expiresAtUtc: expiresAtUtc ?? this.expiresAtUtc,
    checksum: checksum ?? this.checksum,
    contentSummaryJson: contentSummaryJson ?? this.contentSummaryJson,
    sourceSummaryJson: sourceSummaryJson ?? this.sourceSummaryJson,
    minimumAppVersion: minimumAppVersion ?? this.minimumAppVersion,
    installedAtUtc: installedAtUtc ?? this.installedAtUtc,
  );
  OfflineManifest copyWithCompanion(OfflineManifestsCompanion data) {
    return OfflineManifest(
      packId: data.packId.present ? data.packId.value : this.packId,
      version: data.version.present ? data.version.value : this.version,
      packSchemaVersion: data.packSchemaVersion.present
          ? data.packSchemaVersion.value
          : this.packSchemaVersion,
      generatedAtUtc: data.generatedAtUtc.present
          ? data.generatedAtUtc.value
          : this.generatedAtUtc,
      expiresAtUtc: data.expiresAtUtc.present
          ? data.expiresAtUtc.value
          : this.expiresAtUtc,
      checksum: data.checksum.present ? data.checksum.value : this.checksum,
      contentSummaryJson: data.contentSummaryJson.present
          ? data.contentSummaryJson.value
          : this.contentSummaryJson,
      sourceSummaryJson: data.sourceSummaryJson.present
          ? data.sourceSummaryJson.value
          : this.sourceSummaryJson,
      minimumAppVersion: data.minimumAppVersion.present
          ? data.minimumAppVersion.value
          : this.minimumAppVersion,
      installedAtUtc: data.installedAtUtc.present
          ? data.installedAtUtc.value
          : this.installedAtUtc,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OfflineManifest(')
          ..write('packId: $packId, ')
          ..write('version: $version, ')
          ..write('packSchemaVersion: $packSchemaVersion, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('expiresAtUtc: $expiresAtUtc, ')
          ..write('checksum: $checksum, ')
          ..write('contentSummaryJson: $contentSummaryJson, ')
          ..write('sourceSummaryJson: $sourceSummaryJson, ')
          ..write('minimumAppVersion: $minimumAppVersion, ')
          ..write('installedAtUtc: $installedAtUtc')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    packId,
    version,
    packSchemaVersion,
    generatedAtUtc,
    expiresAtUtc,
    checksum,
    contentSummaryJson,
    sourceSummaryJson,
    minimumAppVersion,
    installedAtUtc,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OfflineManifest &&
          other.packId == this.packId &&
          other.version == this.version &&
          other.packSchemaVersion == this.packSchemaVersion &&
          other.generatedAtUtc == this.generatedAtUtc &&
          other.expiresAtUtc == this.expiresAtUtc &&
          other.checksum == this.checksum &&
          other.contentSummaryJson == this.contentSummaryJson &&
          other.sourceSummaryJson == this.sourceSummaryJson &&
          other.minimumAppVersion == this.minimumAppVersion &&
          other.installedAtUtc == this.installedAtUtc);
}

class OfflineManifestsCompanion extends UpdateCompanion<OfflineManifest> {
  final Value<String> packId;
  final Value<String> version;
  final Value<int> packSchemaVersion;
  final Value<DateTime> generatedAtUtc;
  final Value<DateTime> expiresAtUtc;
  final Value<String> checksum;
  final Value<String> contentSummaryJson;
  final Value<String> sourceSummaryJson;
  final Value<String> minimumAppVersion;
  final Value<DateTime> installedAtUtc;
  final Value<int> rowid;
  const OfflineManifestsCompanion({
    this.packId = const Value.absent(),
    this.version = const Value.absent(),
    this.packSchemaVersion = const Value.absent(),
    this.generatedAtUtc = const Value.absent(),
    this.expiresAtUtc = const Value.absent(),
    this.checksum = const Value.absent(),
    this.contentSummaryJson = const Value.absent(),
    this.sourceSummaryJson = const Value.absent(),
    this.minimumAppVersion = const Value.absent(),
    this.installedAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  OfflineManifestsCompanion.insert({
    required String packId,
    required String version,
    required int packSchemaVersion,
    required DateTime generatedAtUtc,
    required DateTime expiresAtUtc,
    required String checksum,
    required String contentSummaryJson,
    required String sourceSummaryJson,
    required String minimumAppVersion,
    required DateTime installedAtUtc,
    this.rowid = const Value.absent(),
  }) : packId = Value(packId),
       version = Value(version),
       packSchemaVersion = Value(packSchemaVersion),
       generatedAtUtc = Value(generatedAtUtc),
       expiresAtUtc = Value(expiresAtUtc),
       checksum = Value(checksum),
       contentSummaryJson = Value(contentSummaryJson),
       sourceSummaryJson = Value(sourceSummaryJson),
       minimumAppVersion = Value(minimumAppVersion),
       installedAtUtc = Value(installedAtUtc);
  static Insertable<OfflineManifest> custom({
    Expression<String>? packId,
    Expression<String>? version,
    Expression<int>? packSchemaVersion,
    Expression<DateTime>? generatedAtUtc,
    Expression<DateTime>? expiresAtUtc,
    Expression<String>? checksum,
    Expression<String>? contentSummaryJson,
    Expression<String>? sourceSummaryJson,
    Expression<String>? minimumAppVersion,
    Expression<DateTime>? installedAtUtc,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (packId != null) 'pack_id': packId,
      if (version != null) 'version': version,
      if (packSchemaVersion != null) 'pack_schema_version': packSchemaVersion,
      if (generatedAtUtc != null) 'generated_at_utc': generatedAtUtc,
      if (expiresAtUtc != null) 'expires_at_utc': expiresAtUtc,
      if (checksum != null) 'checksum': checksum,
      if (contentSummaryJson != null)
        'content_summary_json': contentSummaryJson,
      if (sourceSummaryJson != null) 'source_summary_json': sourceSummaryJson,
      if (minimumAppVersion != null) 'minimum_app_version': minimumAppVersion,
      if (installedAtUtc != null) 'installed_at_utc': installedAtUtc,
      if (rowid != null) 'rowid': rowid,
    });
  }

  OfflineManifestsCompanion copyWith({
    Value<String>? packId,
    Value<String>? version,
    Value<int>? packSchemaVersion,
    Value<DateTime>? generatedAtUtc,
    Value<DateTime>? expiresAtUtc,
    Value<String>? checksum,
    Value<String>? contentSummaryJson,
    Value<String>? sourceSummaryJson,
    Value<String>? minimumAppVersion,
    Value<DateTime>? installedAtUtc,
    Value<int>? rowid,
  }) {
    return OfflineManifestsCompanion(
      packId: packId ?? this.packId,
      version: version ?? this.version,
      packSchemaVersion: packSchemaVersion ?? this.packSchemaVersion,
      generatedAtUtc: generatedAtUtc ?? this.generatedAtUtc,
      expiresAtUtc: expiresAtUtc ?? this.expiresAtUtc,
      checksum: checksum ?? this.checksum,
      contentSummaryJson: contentSummaryJson ?? this.contentSummaryJson,
      sourceSummaryJson: sourceSummaryJson ?? this.sourceSummaryJson,
      minimumAppVersion: minimumAppVersion ?? this.minimumAppVersion,
      installedAtUtc: installedAtUtc ?? this.installedAtUtc,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (packId.present) {
      map['pack_id'] = Variable<String>(packId.value);
    }
    if (version.present) {
      map['version'] = Variable<String>(version.value);
    }
    if (packSchemaVersion.present) {
      map['pack_schema_version'] = Variable<int>(packSchemaVersion.value);
    }
    if (generatedAtUtc.present) {
      map['generated_at_utc'] = Variable<DateTime>(generatedAtUtc.value);
    }
    if (expiresAtUtc.present) {
      map['expires_at_utc'] = Variable<DateTime>(expiresAtUtc.value);
    }
    if (checksum.present) {
      map['checksum'] = Variable<String>(checksum.value);
    }
    if (contentSummaryJson.present) {
      map['content_summary_json'] = Variable<String>(contentSummaryJson.value);
    }
    if (sourceSummaryJson.present) {
      map['source_summary_json'] = Variable<String>(sourceSummaryJson.value);
    }
    if (minimumAppVersion.present) {
      map['minimum_app_version'] = Variable<String>(minimumAppVersion.value);
    }
    if (installedAtUtc.present) {
      map['installed_at_utc'] = Variable<DateTime>(installedAtUtc.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OfflineManifestsCompanion(')
          ..write('packId: $packId, ')
          ..write('version: $version, ')
          ..write('packSchemaVersion: $packSchemaVersion, ')
          ..write('generatedAtUtc: $generatedAtUtc, ')
          ..write('expiresAtUtc: $expiresAtUtc, ')
          ..write('checksum: $checksum, ')
          ..write('contentSummaryJson: $contentSummaryJson, ')
          ..write('sourceSummaryJson: $sourceSummaryJson, ')
          ..write('minimumAppVersion: $minimumAppVersion, ')
          ..write('installedAtUtc: $installedAtUtc, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $OfflinePackEntriesTable extends OfflinePackEntries
    with TableInfo<$OfflinePackEntriesTable, OfflinePackEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OfflinePackEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _packIdMeta = const VerificationMeta('packId');
  @override
  late final GeneratedColumn<String> packId = GeneratedColumn<String>(
    'pack_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES offline_manifests (pack_id) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _entityTypeMeta = const VerificationMeta(
    'entityType',
  );
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
    'entity_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityKeyMeta = const VerificationMeta(
    'entityKey',
  );
  @override
  late final GeneratedColumn<String> entityKey = GeneratedColumn<String>(
    'entity_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [packId, entityType, entityKey];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'offline_pack_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<OfflinePackEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('pack_id')) {
      context.handle(
        _packIdMeta,
        packId.isAcceptableOrUnknown(data['pack_id']!, _packIdMeta),
      );
    } else if (isInserting) {
      context.missing(_packIdMeta);
    }
    if (data.containsKey('entity_type')) {
      context.handle(
        _entityTypeMeta,
        entityType.isAcceptableOrUnknown(data['entity_type']!, _entityTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_key')) {
      context.handle(
        _entityKeyMeta,
        entityKey.isAcceptableOrUnknown(data['entity_key']!, _entityKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_entityKeyMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {packId, entityType, entityKey};
  @override
  OfflinePackEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OfflinePackEntry(
      packId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pack_id'],
      )!,
      entityType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_type'],
      )!,
      entityKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_key'],
      )!,
    );
  }

  @override
  $OfflinePackEntriesTable createAlias(String alias) {
    return $OfflinePackEntriesTable(attachedDatabase, alias);
  }
}

class OfflinePackEntry extends DataClass
    implements Insertable<OfflinePackEntry> {
  final String packId;
  final String entityType;
  final String entityKey;
  const OfflinePackEntry({
    required this.packId,
    required this.entityType,
    required this.entityKey,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['pack_id'] = Variable<String>(packId);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_key'] = Variable<String>(entityKey);
    return map;
  }

  OfflinePackEntriesCompanion toCompanion(bool nullToAbsent) {
    return OfflinePackEntriesCompanion(
      packId: Value(packId),
      entityType: Value(entityType),
      entityKey: Value(entityKey),
    );
  }

  factory OfflinePackEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OfflinePackEntry(
      packId: serializer.fromJson<String>(json['packId']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityKey: serializer.fromJson<String>(json['entityKey']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'packId': serializer.toJson<String>(packId),
      'entityType': serializer.toJson<String>(entityType),
      'entityKey': serializer.toJson<String>(entityKey),
    };
  }

  OfflinePackEntry copyWith({
    String? packId,
    String? entityType,
    String? entityKey,
  }) => OfflinePackEntry(
    packId: packId ?? this.packId,
    entityType: entityType ?? this.entityType,
    entityKey: entityKey ?? this.entityKey,
  );
  OfflinePackEntry copyWithCompanion(OfflinePackEntriesCompanion data) {
    return OfflinePackEntry(
      packId: data.packId.present ? data.packId.value : this.packId,
      entityType: data.entityType.present
          ? data.entityType.value
          : this.entityType,
      entityKey: data.entityKey.present ? data.entityKey.value : this.entityKey,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OfflinePackEntry(')
          ..write('packId: $packId, ')
          ..write('entityType: $entityType, ')
          ..write('entityKey: $entityKey')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(packId, entityType, entityKey);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OfflinePackEntry &&
          other.packId == this.packId &&
          other.entityType == this.entityType &&
          other.entityKey == this.entityKey);
}

class OfflinePackEntriesCompanion extends UpdateCompanion<OfflinePackEntry> {
  final Value<String> packId;
  final Value<String> entityType;
  final Value<String> entityKey;
  final Value<int> rowid;
  const OfflinePackEntriesCompanion({
    this.packId = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityKey = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  OfflinePackEntriesCompanion.insert({
    required String packId,
    required String entityType,
    required String entityKey,
    this.rowid = const Value.absent(),
  }) : packId = Value(packId),
       entityType = Value(entityType),
       entityKey = Value(entityKey);
  static Insertable<OfflinePackEntry> custom({
    Expression<String>? packId,
    Expression<String>? entityType,
    Expression<String>? entityKey,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (packId != null) 'pack_id': packId,
      if (entityType != null) 'entity_type': entityType,
      if (entityKey != null) 'entity_key': entityKey,
      if (rowid != null) 'rowid': rowid,
    });
  }

  OfflinePackEntriesCompanion copyWith({
    Value<String>? packId,
    Value<String>? entityType,
    Value<String>? entityKey,
    Value<int>? rowid,
  }) {
    return OfflinePackEntriesCompanion(
      packId: packId ?? this.packId,
      entityType: entityType ?? this.entityType,
      entityKey: entityKey ?? this.entityKey,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (packId.present) {
      map['pack_id'] = Variable<String>(packId.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityKey.present) {
      map['entity_key'] = Variable<String>(entityKey.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OfflinePackEntriesCompanion(')
          ..write('packId: $packId, ')
          ..write('entityType: $entityType, ')
          ..write('entityKey: $entityKey, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncStatesTable extends SyncStates
    with TableInfo<$SyncStatesTable, SyncState> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncStatesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _resourceKeyMeta = const VerificationMeta(
    'resourceKey',
  );
  @override
  late final GeneratedColumn<String> resourceKey = GeneratedColumn<String>(
    'resource_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _resourceKindMeta = const VerificationMeta(
    'resourceKind',
  );
  @override
  late final GeneratedColumn<String> resourceKind = GeneratedColumn<String>(
    'resource_kind',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastAttemptAtUtcMeta = const VerificationMeta(
    'lastAttemptAtUtc',
  );
  @override
  late final GeneratedColumn<DateTime> lastAttemptAtUtc =
      GeneratedColumn<DateTime>(
        'last_attempt_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _lastSuccessfulRefreshAtUtcMeta =
      const VerificationMeta('lastSuccessfulRefreshAtUtc');
  @override
  late final GeneratedColumn<DateTime> lastSuccessfulRefreshAtUtc =
      GeneratedColumn<DateTime>(
        'last_successful_refresh_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _lastFailureKindMeta = const VerificationMeta(
    'lastFailureKind',
  );
  @override
  late final GeneratedColumn<String> lastFailureKind = GeneratedColumn<String>(
    'last_failure_kind',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _latestRemoteGeneratedAtUtcMeta =
      const VerificationMeta('latestRemoteGeneratedAtUtc');
  @override
  late final GeneratedColumn<DateTime> latestRemoteGeneratedAtUtc =
      GeneratedColumn<DateTime>(
        'latest_remote_generated_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _latestObservedAtUtcMeta =
      const VerificationMeta('latestObservedAtUtc');
  @override
  late final GeneratedColumn<DateTime> latestObservedAtUtc =
      GeneratedColumn<DateTime>(
        'latest_observed_at_utc',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    resourceKey,
    resourceKind,
    lastAttemptAtUtc,
    lastSuccessfulRefreshAtUtc,
    lastFailureKind,
    latestRemoteGeneratedAtUtc,
    latestObservedAtUtc,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_states';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncState> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('resource_key')) {
      context.handle(
        _resourceKeyMeta,
        resourceKey.isAcceptableOrUnknown(
          data['resource_key']!,
          _resourceKeyMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_resourceKeyMeta);
    }
    if (data.containsKey('resource_kind')) {
      context.handle(
        _resourceKindMeta,
        resourceKind.isAcceptableOrUnknown(
          data['resource_kind']!,
          _resourceKindMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_resourceKindMeta);
    }
    if (data.containsKey('last_attempt_at_utc')) {
      context.handle(
        _lastAttemptAtUtcMeta,
        lastAttemptAtUtc.isAcceptableOrUnknown(
          data['last_attempt_at_utc']!,
          _lastAttemptAtUtcMeta,
        ),
      );
    }
    if (data.containsKey('last_successful_refresh_at_utc')) {
      context.handle(
        _lastSuccessfulRefreshAtUtcMeta,
        lastSuccessfulRefreshAtUtc.isAcceptableOrUnknown(
          data['last_successful_refresh_at_utc']!,
          _lastSuccessfulRefreshAtUtcMeta,
        ),
      );
    }
    if (data.containsKey('last_failure_kind')) {
      context.handle(
        _lastFailureKindMeta,
        lastFailureKind.isAcceptableOrUnknown(
          data['last_failure_kind']!,
          _lastFailureKindMeta,
        ),
      );
    }
    if (data.containsKey('latest_remote_generated_at_utc')) {
      context.handle(
        _latestRemoteGeneratedAtUtcMeta,
        latestRemoteGeneratedAtUtc.isAcceptableOrUnknown(
          data['latest_remote_generated_at_utc']!,
          _latestRemoteGeneratedAtUtcMeta,
        ),
      );
    }
    if (data.containsKey('latest_observed_at_utc')) {
      context.handle(
        _latestObservedAtUtcMeta,
        latestObservedAtUtc.isAcceptableOrUnknown(
          data['latest_observed_at_utc']!,
          _latestObservedAtUtcMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {resourceKey};
  @override
  SyncState map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncState(
      resourceKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}resource_key'],
      )!,
      resourceKind: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}resource_kind'],
      )!,
      lastAttemptAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_attempt_at_utc'],
      ),
      lastSuccessfulRefreshAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_successful_refresh_at_utc'],
      ),
      lastFailureKind: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_failure_kind'],
      ),
      latestRemoteGeneratedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}latest_remote_generated_at_utc'],
      ),
      latestObservedAtUtc: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}latest_observed_at_utc'],
      ),
    );
  }

  @override
  $SyncStatesTable createAlias(String alias) {
    return $SyncStatesTable(attachedDatabase, alias);
  }
}

class SyncState extends DataClass implements Insertable<SyncState> {
  final String resourceKey;
  final String resourceKind;
  final DateTime? lastAttemptAtUtc;
  final DateTime? lastSuccessfulRefreshAtUtc;
  final String? lastFailureKind;
  final DateTime? latestRemoteGeneratedAtUtc;
  final DateTime? latestObservedAtUtc;
  const SyncState({
    required this.resourceKey,
    required this.resourceKind,
    this.lastAttemptAtUtc,
    this.lastSuccessfulRefreshAtUtc,
    this.lastFailureKind,
    this.latestRemoteGeneratedAtUtc,
    this.latestObservedAtUtc,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['resource_key'] = Variable<String>(resourceKey);
    map['resource_kind'] = Variable<String>(resourceKind);
    if (!nullToAbsent || lastAttemptAtUtc != null) {
      map['last_attempt_at_utc'] = Variable<DateTime>(lastAttemptAtUtc);
    }
    if (!nullToAbsent || lastSuccessfulRefreshAtUtc != null) {
      map['last_successful_refresh_at_utc'] = Variable<DateTime>(
        lastSuccessfulRefreshAtUtc,
      );
    }
    if (!nullToAbsent || lastFailureKind != null) {
      map['last_failure_kind'] = Variable<String>(lastFailureKind);
    }
    if (!nullToAbsent || latestRemoteGeneratedAtUtc != null) {
      map['latest_remote_generated_at_utc'] = Variable<DateTime>(
        latestRemoteGeneratedAtUtc,
      );
    }
    if (!nullToAbsent || latestObservedAtUtc != null) {
      map['latest_observed_at_utc'] = Variable<DateTime>(latestObservedAtUtc);
    }
    return map;
  }

  SyncStatesCompanion toCompanion(bool nullToAbsent) {
    return SyncStatesCompanion(
      resourceKey: Value(resourceKey),
      resourceKind: Value(resourceKind),
      lastAttemptAtUtc: lastAttemptAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(lastAttemptAtUtc),
      lastSuccessfulRefreshAtUtc:
          lastSuccessfulRefreshAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSuccessfulRefreshAtUtc),
      lastFailureKind: lastFailureKind == null && nullToAbsent
          ? const Value.absent()
          : Value(lastFailureKind),
      latestRemoteGeneratedAtUtc:
          latestRemoteGeneratedAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(latestRemoteGeneratedAtUtc),
      latestObservedAtUtc: latestObservedAtUtc == null && nullToAbsent
          ? const Value.absent()
          : Value(latestObservedAtUtc),
    );
  }

  factory SyncState.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncState(
      resourceKey: serializer.fromJson<String>(json['resourceKey']),
      resourceKind: serializer.fromJson<String>(json['resourceKind']),
      lastAttemptAtUtc: serializer.fromJson<DateTime?>(
        json['lastAttemptAtUtc'],
      ),
      lastSuccessfulRefreshAtUtc: serializer.fromJson<DateTime?>(
        json['lastSuccessfulRefreshAtUtc'],
      ),
      lastFailureKind: serializer.fromJson<String?>(json['lastFailureKind']),
      latestRemoteGeneratedAtUtc: serializer.fromJson<DateTime?>(
        json['latestRemoteGeneratedAtUtc'],
      ),
      latestObservedAtUtc: serializer.fromJson<DateTime?>(
        json['latestObservedAtUtc'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'resourceKey': serializer.toJson<String>(resourceKey),
      'resourceKind': serializer.toJson<String>(resourceKind),
      'lastAttemptAtUtc': serializer.toJson<DateTime?>(lastAttemptAtUtc),
      'lastSuccessfulRefreshAtUtc': serializer.toJson<DateTime?>(
        lastSuccessfulRefreshAtUtc,
      ),
      'lastFailureKind': serializer.toJson<String?>(lastFailureKind),
      'latestRemoteGeneratedAtUtc': serializer.toJson<DateTime?>(
        latestRemoteGeneratedAtUtc,
      ),
      'latestObservedAtUtc': serializer.toJson<DateTime?>(latestObservedAtUtc),
    };
  }

  SyncState copyWith({
    String? resourceKey,
    String? resourceKind,
    Value<DateTime?> lastAttemptAtUtc = const Value.absent(),
    Value<DateTime?> lastSuccessfulRefreshAtUtc = const Value.absent(),
    Value<String?> lastFailureKind = const Value.absent(),
    Value<DateTime?> latestRemoteGeneratedAtUtc = const Value.absent(),
    Value<DateTime?> latestObservedAtUtc = const Value.absent(),
  }) => SyncState(
    resourceKey: resourceKey ?? this.resourceKey,
    resourceKind: resourceKind ?? this.resourceKind,
    lastAttemptAtUtc: lastAttemptAtUtc.present
        ? lastAttemptAtUtc.value
        : this.lastAttemptAtUtc,
    lastSuccessfulRefreshAtUtc: lastSuccessfulRefreshAtUtc.present
        ? lastSuccessfulRefreshAtUtc.value
        : this.lastSuccessfulRefreshAtUtc,
    lastFailureKind: lastFailureKind.present
        ? lastFailureKind.value
        : this.lastFailureKind,
    latestRemoteGeneratedAtUtc: latestRemoteGeneratedAtUtc.present
        ? latestRemoteGeneratedAtUtc.value
        : this.latestRemoteGeneratedAtUtc,
    latestObservedAtUtc: latestObservedAtUtc.present
        ? latestObservedAtUtc.value
        : this.latestObservedAtUtc,
  );
  SyncState copyWithCompanion(SyncStatesCompanion data) {
    return SyncState(
      resourceKey: data.resourceKey.present
          ? data.resourceKey.value
          : this.resourceKey,
      resourceKind: data.resourceKind.present
          ? data.resourceKind.value
          : this.resourceKind,
      lastAttemptAtUtc: data.lastAttemptAtUtc.present
          ? data.lastAttemptAtUtc.value
          : this.lastAttemptAtUtc,
      lastSuccessfulRefreshAtUtc: data.lastSuccessfulRefreshAtUtc.present
          ? data.lastSuccessfulRefreshAtUtc.value
          : this.lastSuccessfulRefreshAtUtc,
      lastFailureKind: data.lastFailureKind.present
          ? data.lastFailureKind.value
          : this.lastFailureKind,
      latestRemoteGeneratedAtUtc: data.latestRemoteGeneratedAtUtc.present
          ? data.latestRemoteGeneratedAtUtc.value
          : this.latestRemoteGeneratedAtUtc,
      latestObservedAtUtc: data.latestObservedAtUtc.present
          ? data.latestObservedAtUtc.value
          : this.latestObservedAtUtc,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncState(')
          ..write('resourceKey: $resourceKey, ')
          ..write('resourceKind: $resourceKind, ')
          ..write('lastAttemptAtUtc: $lastAttemptAtUtc, ')
          ..write('lastSuccessfulRefreshAtUtc: $lastSuccessfulRefreshAtUtc, ')
          ..write('lastFailureKind: $lastFailureKind, ')
          ..write('latestRemoteGeneratedAtUtc: $latestRemoteGeneratedAtUtc, ')
          ..write('latestObservedAtUtc: $latestObservedAtUtc')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    resourceKey,
    resourceKind,
    lastAttemptAtUtc,
    lastSuccessfulRefreshAtUtc,
    lastFailureKind,
    latestRemoteGeneratedAtUtc,
    latestObservedAtUtc,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncState &&
          other.resourceKey == this.resourceKey &&
          other.resourceKind == this.resourceKind &&
          other.lastAttemptAtUtc == this.lastAttemptAtUtc &&
          other.lastSuccessfulRefreshAtUtc == this.lastSuccessfulRefreshAtUtc &&
          other.lastFailureKind == this.lastFailureKind &&
          other.latestRemoteGeneratedAtUtc == this.latestRemoteGeneratedAtUtc &&
          other.latestObservedAtUtc == this.latestObservedAtUtc);
}

class SyncStatesCompanion extends UpdateCompanion<SyncState> {
  final Value<String> resourceKey;
  final Value<String> resourceKind;
  final Value<DateTime?> lastAttemptAtUtc;
  final Value<DateTime?> lastSuccessfulRefreshAtUtc;
  final Value<String?> lastFailureKind;
  final Value<DateTime?> latestRemoteGeneratedAtUtc;
  final Value<DateTime?> latestObservedAtUtc;
  final Value<int> rowid;
  const SyncStatesCompanion({
    this.resourceKey = const Value.absent(),
    this.resourceKind = const Value.absent(),
    this.lastAttemptAtUtc = const Value.absent(),
    this.lastSuccessfulRefreshAtUtc = const Value.absent(),
    this.lastFailureKind = const Value.absent(),
    this.latestRemoteGeneratedAtUtc = const Value.absent(),
    this.latestObservedAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncStatesCompanion.insert({
    required String resourceKey,
    required String resourceKind,
    this.lastAttemptAtUtc = const Value.absent(),
    this.lastSuccessfulRefreshAtUtc = const Value.absent(),
    this.lastFailureKind = const Value.absent(),
    this.latestRemoteGeneratedAtUtc = const Value.absent(),
    this.latestObservedAtUtc = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : resourceKey = Value(resourceKey),
       resourceKind = Value(resourceKind);
  static Insertable<SyncState> custom({
    Expression<String>? resourceKey,
    Expression<String>? resourceKind,
    Expression<DateTime>? lastAttemptAtUtc,
    Expression<DateTime>? lastSuccessfulRefreshAtUtc,
    Expression<String>? lastFailureKind,
    Expression<DateTime>? latestRemoteGeneratedAtUtc,
    Expression<DateTime>? latestObservedAtUtc,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (resourceKey != null) 'resource_key': resourceKey,
      if (resourceKind != null) 'resource_kind': resourceKind,
      if (lastAttemptAtUtc != null) 'last_attempt_at_utc': lastAttemptAtUtc,
      if (lastSuccessfulRefreshAtUtc != null)
        'last_successful_refresh_at_utc': lastSuccessfulRefreshAtUtc,
      if (lastFailureKind != null) 'last_failure_kind': lastFailureKind,
      if (latestRemoteGeneratedAtUtc != null)
        'latest_remote_generated_at_utc': latestRemoteGeneratedAtUtc,
      if (latestObservedAtUtc != null)
        'latest_observed_at_utc': latestObservedAtUtc,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncStatesCompanion copyWith({
    Value<String>? resourceKey,
    Value<String>? resourceKind,
    Value<DateTime?>? lastAttemptAtUtc,
    Value<DateTime?>? lastSuccessfulRefreshAtUtc,
    Value<String?>? lastFailureKind,
    Value<DateTime?>? latestRemoteGeneratedAtUtc,
    Value<DateTime?>? latestObservedAtUtc,
    Value<int>? rowid,
  }) {
    return SyncStatesCompanion(
      resourceKey: resourceKey ?? this.resourceKey,
      resourceKind: resourceKind ?? this.resourceKind,
      lastAttemptAtUtc: lastAttemptAtUtc ?? this.lastAttemptAtUtc,
      lastSuccessfulRefreshAtUtc:
          lastSuccessfulRefreshAtUtc ?? this.lastSuccessfulRefreshAtUtc,
      lastFailureKind: lastFailureKind ?? this.lastFailureKind,
      latestRemoteGeneratedAtUtc:
          latestRemoteGeneratedAtUtc ?? this.latestRemoteGeneratedAtUtc,
      latestObservedAtUtc: latestObservedAtUtc ?? this.latestObservedAtUtc,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (resourceKey.present) {
      map['resource_key'] = Variable<String>(resourceKey.value);
    }
    if (resourceKind.present) {
      map['resource_kind'] = Variable<String>(resourceKind.value);
    }
    if (lastAttemptAtUtc.present) {
      map['last_attempt_at_utc'] = Variable<DateTime>(lastAttemptAtUtc.value);
    }
    if (lastSuccessfulRefreshAtUtc.present) {
      map['last_successful_refresh_at_utc'] = Variable<DateTime>(
        lastSuccessfulRefreshAtUtc.value,
      );
    }
    if (lastFailureKind.present) {
      map['last_failure_kind'] = Variable<String>(lastFailureKind.value);
    }
    if (latestRemoteGeneratedAtUtc.present) {
      map['latest_remote_generated_at_utc'] = Variable<DateTime>(
        latestRemoteGeneratedAtUtc.value,
      );
    }
    if (latestObservedAtUtc.present) {
      map['latest_observed_at_utc'] = Variable<DateTime>(
        latestObservedAtUtc.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncStatesCompanion(')
          ..write('resourceKey: $resourceKey, ')
          ..write('resourceKind: $resourceKind, ')
          ..write('lastAttemptAtUtc: $lastAttemptAtUtc, ')
          ..write('lastSuccessfulRefreshAtUtc: $lastSuccessfulRefreshAtUtc, ')
          ..write('lastFailureKind: $lastFailureKind, ')
          ..write('latestRemoteGeneratedAtUtc: $latestRemoteGeneratedAtUtc, ')
          ..write('latestObservedAtUtc: $latestObservedAtUtc, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $StationsTable stations = $StationsTable(this);
  late final $StationAliasesTable stationAliases = $StationAliasesTable(this);
  late final $LocationSearchPagesTable locationSearchPages =
      $LocationSearchPagesTable(this);
  late final $LocationSearchPageItemsTable locationSearchPageItems =
      $LocationSearchPageItemsTable(this);
  late final $TideSeriesTable tideSeries = $TideSeriesTable(this);
  late final $TidePointsTable tidePoints = $TidePointsTable(this);
  late final $WaterLevelPagesTable waterLevelPages = $WaterLevelPagesTable(
    this,
  );
  late final $WaterLevelObservationsTable waterLevelObservations =
      $WaterLevelObservationsTable(this);
  late final $WaterLevelPageItemsTable waterLevelPageItems =
      $WaterLevelPageItemsTable(this);
  late final $CalendarDaysTable calendarDays = $CalendarDaysTable(this);
  late final $FavoritesTable favorites = $FavoritesTable(this);
  late final $PreferencesTable preferences = $PreferencesTable(this);
  late final $OfflineManifestsTable offlineManifests = $OfflineManifestsTable(
    this,
  );
  late final $OfflinePackEntriesTable offlinePackEntries =
      $OfflinePackEntriesTable(this);
  late final $SyncStatesTable syncStates = $SyncStatesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    stations,
    stationAliases,
    locationSearchPages,
    locationSearchPageItems,
    tideSeries,
    tidePoints,
    waterLevelPages,
    waterLevelObservations,
    waterLevelPageItems,
    calendarDays,
    favorites,
    preferences,
    offlineManifests,
    offlinePackEntries,
    syncStates,
  ];
  @override
  StreamQueryUpdateRules get streamUpdateRules => const StreamQueryUpdateRules([
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'stations',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('station_aliases', kind: UpdateKind.delete)],
    ),
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'location_search_pages',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [
        TableUpdate('location_search_page_items', kind: UpdateKind.delete),
      ],
    ),
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'tide_series',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('tide_points', kind: UpdateKind.delete)],
    ),
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'water_level_pages',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('water_level_page_items', kind: UpdateKind.delete)],
    ),
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'offline_manifests',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('offline_pack_entries', kind: UpdateKind.delete)],
    ),
  ]);
}

typedef $$StationsTableCreateCompanionBuilder =
    StationsCompanion Function({
      required String id,
      required String name,
      required String stationType,
      required String timeZone,
      required double latitude,
      required double longitude,
      Value<String?> defaultDatumId,
      Value<DateTime?> detailGeneratedAtUtc,
      Value<String?> provenanceSourceKey,
      Value<String?> provenanceImportRunId,
      Value<String?> provenanceRawChecksumSha256,
      Value<String?> provenanceParserVersion,
      Value<String?> provenanceNormalizerVersion,
      Value<DateTime?> provenanceObservedAtUtc,
      required DateTime localUpdatedAtUtc,
      Value<int> rowid,
    });
typedef $$StationsTableUpdateCompanionBuilder =
    StationsCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<String> stationType,
      Value<String> timeZone,
      Value<double> latitude,
      Value<double> longitude,
      Value<String?> defaultDatumId,
      Value<DateTime?> detailGeneratedAtUtc,
      Value<String?> provenanceSourceKey,
      Value<String?> provenanceImportRunId,
      Value<String?> provenanceRawChecksumSha256,
      Value<String?> provenanceParserVersion,
      Value<String?> provenanceNormalizerVersion,
      Value<DateTime?> provenanceObservedAtUtc,
      Value<DateTime> localUpdatedAtUtc,
      Value<int> rowid,
    });

final class $$StationsTableReferences
    extends BaseReferences<_$AppDatabase, $StationsTable, Station> {
  $$StationsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$StationAliasesTable, List<StationAliase>>
  _stationAliasesRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.stationAliases,
    aliasName: 'stations__id__station_aliases__station_id',
  );

  $$StationAliasesTableProcessedTableManager get stationAliasesRefs {
    final manager = $$StationAliasesTableTableManager(
      $_db,
      $_db.stationAliases,
    ).filter((f) => f.stationId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_stationAliasesRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<
    $LocationSearchPageItemsTable,
    List<LocationSearchPageItem>
  >
  _locationSearchPageItemsRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.locationSearchPageItems,
        aliasName: 'stations__id__location_search_page_items__station_id',
      );

  $$LocationSearchPageItemsTableProcessedTableManager
  get locationSearchPageItemsRefs {
    final manager = $$LocationSearchPageItemsTableTableManager(
      $_db,
      $_db.locationSearchPageItems,
    ).filter((f) => f.stationId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _locationSearchPageItemsRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<$TideSeriesTable, List<TideSery>>
  _tideSeriesRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.tideSeries,
    aliasName: 'stations__id__tide_series__station_id',
  );

  $$TideSeriesTableProcessedTableManager get tideSeriesRefs {
    final manager = $$TideSeriesTableTableManager(
      $_db,
      $_db.tideSeries,
    ).filter((f) => f.stationId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_tideSeriesRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$StationsTableFilterComposer
    extends Composer<_$AppDatabase, $StationsTable> {
  $$StationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get stationType => $composableBuilder(
    column: $table.stationType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get defaultDatumId => $composableBuilder(
    column: $table.defaultDatumId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get detailGeneratedAtUtc => $composableBuilder(
    column: $table.detailGeneratedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceRawChecksumSha256 => $composableBuilder(
    column: $table.provenanceRawChecksumSha256,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceParserVersion => $composableBuilder(
    column: $table.provenanceParserVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceNormalizerVersion => $composableBuilder(
    column: $table.provenanceNormalizerVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get provenanceObservedAtUtc => $composableBuilder(
    column: $table.provenanceObservedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get localUpdatedAtUtc => $composableBuilder(
    column: $table.localUpdatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> stationAliasesRefs(
    Expression<bool> Function($$StationAliasesTableFilterComposer f) f,
  ) {
    final $$StationAliasesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.stationAliases,
      getReferencedColumn: (t) => t.stationId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationAliasesTableFilterComposer(
            $db: $db,
            $table: $db.stationAliases,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> locationSearchPageItemsRefs(
    Expression<bool> Function($$LocationSearchPageItemsTableFilterComposer f) f,
  ) {
    final $$LocationSearchPageItemsTableFilterComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.locationSearchPageItems,
          getReferencedColumn: (t) => t.stationId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocationSearchPageItemsTableFilterComposer(
                $db: $db,
                $table: $db.locationSearchPageItems,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }

  Expression<bool> tideSeriesRefs(
    Expression<bool> Function($$TideSeriesTableFilterComposer f) f,
  ) {
    final $$TideSeriesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.tideSeries,
      getReferencedColumn: (t) => t.stationId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TideSeriesTableFilterComposer(
            $db: $db,
            $table: $db.tideSeries,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$StationsTableOrderingComposer
    extends Composer<_$AppDatabase, $StationsTable> {
  $$StationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get stationType => $composableBuilder(
    column: $table.stationType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get defaultDatumId => $composableBuilder(
    column: $table.defaultDatumId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get detailGeneratedAtUtc => $composableBuilder(
    column: $table.detailGeneratedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceRawChecksumSha256 => $composableBuilder(
    column: $table.provenanceRawChecksumSha256,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceParserVersion => $composableBuilder(
    column: $table.provenanceParserVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceNormalizerVersion => $composableBuilder(
    column: $table.provenanceNormalizerVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get provenanceObservedAtUtc => $composableBuilder(
    column: $table.provenanceObservedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get localUpdatedAtUtc => $composableBuilder(
    column: $table.localUpdatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$StationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $StationsTable> {
  $$StationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get stationType => $composableBuilder(
    column: $table.stationType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get timeZone =>
      $composableBuilder(column: $table.timeZone, builder: (column) => column);

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<String> get defaultDatumId => $composableBuilder(
    column: $table.defaultDatumId,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get detailGeneratedAtUtc => $composableBuilder(
    column: $table.detailGeneratedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceRawChecksumSha256 => $composableBuilder(
    column: $table.provenanceRawChecksumSha256,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceParserVersion => $composableBuilder(
    column: $table.provenanceParserVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceNormalizerVersion => $composableBuilder(
    column: $table.provenanceNormalizerVersion,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get provenanceObservedAtUtc => $composableBuilder(
    column: $table.provenanceObservedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get localUpdatedAtUtc => $composableBuilder(
    column: $table.localUpdatedAtUtc,
    builder: (column) => column,
  );

  Expression<T> stationAliasesRefs<T extends Object>(
    Expression<T> Function($$StationAliasesTableAnnotationComposer a) f,
  ) {
    final $$StationAliasesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.stationAliases,
      getReferencedColumn: (t) => t.stationId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationAliasesTableAnnotationComposer(
            $db: $db,
            $table: $db.stationAliases,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<T> locationSearchPageItemsRefs<T extends Object>(
    Expression<T> Function($$LocationSearchPageItemsTableAnnotationComposer a)
    f,
  ) {
    final $$LocationSearchPageItemsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.locationSearchPageItems,
          getReferencedColumn: (t) => t.stationId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocationSearchPageItemsTableAnnotationComposer(
                $db: $db,
                $table: $db.locationSearchPageItems,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }

  Expression<T> tideSeriesRefs<T extends Object>(
    Expression<T> Function($$TideSeriesTableAnnotationComposer a) f,
  ) {
    final $$TideSeriesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.tideSeries,
      getReferencedColumn: (t) => t.stationId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TideSeriesTableAnnotationComposer(
            $db: $db,
            $table: $db.tideSeries,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$StationsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $StationsTable,
          Station,
          $$StationsTableFilterComposer,
          $$StationsTableOrderingComposer,
          $$StationsTableAnnotationComposer,
          $$StationsTableCreateCompanionBuilder,
          $$StationsTableUpdateCompanionBuilder,
          (Station, $$StationsTableReferences),
          Station,
          PrefetchHooks Function({
            bool stationAliasesRefs,
            bool locationSearchPageItemsRefs,
            bool tideSeriesRefs,
          })
        > {
  $$StationsTableTableManager(_$AppDatabase db, $StationsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StationsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StationsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StationsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String> stationType = const Value.absent(),
                Value<String> timeZone = const Value.absent(),
                Value<double> latitude = const Value.absent(),
                Value<double> longitude = const Value.absent(),
                Value<String?> defaultDatumId = const Value.absent(),
                Value<DateTime?> detailGeneratedAtUtc = const Value.absent(),
                Value<String?> provenanceSourceKey = const Value.absent(),
                Value<String?> provenanceImportRunId = const Value.absent(),
                Value<String?> provenanceRawChecksumSha256 =
                    const Value.absent(),
                Value<String?> provenanceParserVersion = const Value.absent(),
                Value<String?> provenanceNormalizerVersion =
                    const Value.absent(),
                Value<DateTime?> provenanceObservedAtUtc = const Value.absent(),
                Value<DateTime> localUpdatedAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StationsCompanion(
                id: id,
                name: name,
                stationType: stationType,
                timeZone: timeZone,
                latitude: latitude,
                longitude: longitude,
                defaultDatumId: defaultDatumId,
                detailGeneratedAtUtc: detailGeneratedAtUtc,
                provenanceSourceKey: provenanceSourceKey,
                provenanceImportRunId: provenanceImportRunId,
                provenanceRawChecksumSha256: provenanceRawChecksumSha256,
                provenanceParserVersion: provenanceParserVersion,
                provenanceNormalizerVersion: provenanceNormalizerVersion,
                provenanceObservedAtUtc: provenanceObservedAtUtc,
                localUpdatedAtUtc: localUpdatedAtUtc,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                required String stationType,
                required String timeZone,
                required double latitude,
                required double longitude,
                Value<String?> defaultDatumId = const Value.absent(),
                Value<DateTime?> detailGeneratedAtUtc = const Value.absent(),
                Value<String?> provenanceSourceKey = const Value.absent(),
                Value<String?> provenanceImportRunId = const Value.absent(),
                Value<String?> provenanceRawChecksumSha256 =
                    const Value.absent(),
                Value<String?> provenanceParserVersion = const Value.absent(),
                Value<String?> provenanceNormalizerVersion =
                    const Value.absent(),
                Value<DateTime?> provenanceObservedAtUtc = const Value.absent(),
                required DateTime localUpdatedAtUtc,
                Value<int> rowid = const Value.absent(),
              }) => StationsCompanion.insert(
                id: id,
                name: name,
                stationType: stationType,
                timeZone: timeZone,
                latitude: latitude,
                longitude: longitude,
                defaultDatumId: defaultDatumId,
                detailGeneratedAtUtc: detailGeneratedAtUtc,
                provenanceSourceKey: provenanceSourceKey,
                provenanceImportRunId: provenanceImportRunId,
                provenanceRawChecksumSha256: provenanceRawChecksumSha256,
                provenanceParserVersion: provenanceParserVersion,
                provenanceNormalizerVersion: provenanceNormalizerVersion,
                provenanceObservedAtUtc: provenanceObservedAtUtc,
                localUpdatedAtUtc: localUpdatedAtUtc,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$StationsTable, Station>(table),
                  $$StationsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({
                stationAliasesRefs = false,
                locationSearchPageItemsRefs = false,
                tideSeriesRefs = false,
              }) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (stationAliasesRefs) db.stationAliases,
                    if (locationSearchPageItemsRefs) db.locationSearchPageItems,
                    if (tideSeriesRefs) db.tideSeries,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (stationAliasesRefs)
                        await $_getPrefetchedData<
                          Station,
                          $StationsTable,
                          StationAliase
                        >(
                          currentTable: table,
                          referencedTable: $$StationsTableReferences
                              ._stationAliasesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$StationsTableReferences(
                                db,
                                table,
                                p0,
                              ).stationAliasesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.stationId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (locationSearchPageItemsRefs)
                        await $_getPrefetchedData<
                          Station,
                          $StationsTable,
                          LocationSearchPageItem
                        >(
                          currentTable: table,
                          referencedTable: $$StationsTableReferences
                              ._locationSearchPageItemsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$StationsTableReferences(
                                db,
                                table,
                                p0,
                              ).locationSearchPageItemsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.stationId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (tideSeriesRefs)
                        await $_getPrefetchedData<
                          Station,
                          $StationsTable,
                          TideSery
                        >(
                          currentTable: table,
                          referencedTable: $$StationsTableReferences
                              ._tideSeriesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$StationsTableReferences(
                                db,
                                table,
                                p0,
                              ).tideSeriesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.stationId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$StationsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $StationsTable,
      Station,
      $$StationsTableFilterComposer,
      $$StationsTableOrderingComposer,
      $$StationsTableAnnotationComposer,
      $$StationsTableCreateCompanionBuilder,
      $$StationsTableUpdateCompanionBuilder,
      (Station, $$StationsTableReferences),
      Station,
      PrefetchHooks Function({
        bool stationAliasesRefs,
        bool locationSearchPageItemsRefs,
        bool tideSeriesRefs,
      })
    >;
typedef $$StationAliasesTableCreateCompanionBuilder =
    StationAliasesCompanion Function({
      required String stationId,
      required String alias,
      Value<int> rowid,
    });
typedef $$StationAliasesTableUpdateCompanionBuilder =
    StationAliasesCompanion Function({
      Value<String> stationId,
      Value<String> alias,
      Value<int> rowid,
    });

final class $$StationAliasesTableReferences
    extends BaseReferences<_$AppDatabase, $StationAliasesTable, StationAliase> {
  $$StationAliasesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $StationsTable _stationIdTable(_$AppDatabase db) =>
      db.stations.createAlias('station_aliases__station_id__stations__id');

  $$StationsTableProcessedTableManager get stationId {
    final $_column = $_itemColumn<String>('station_id')!;

    final manager = $$StationsTableTableManager(
      $_db,
      $_db.stations,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_stationIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$StationAliasesTableFilterComposer
    extends Composer<_$AppDatabase, $StationAliasesTable> {
  $$StationAliasesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get alias => $composableBuilder(
    column: $table.alias,
    builder: (column) => ColumnFilters(column),
  );

  $$StationsTableFilterComposer get stationId {
    final $$StationsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableFilterComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$StationAliasesTableOrderingComposer
    extends Composer<_$AppDatabase, $StationAliasesTable> {
  $$StationAliasesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get alias => $composableBuilder(
    column: $table.alias,
    builder: (column) => ColumnOrderings(column),
  );

  $$StationsTableOrderingComposer get stationId {
    final $$StationsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableOrderingComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$StationAliasesTableAnnotationComposer
    extends Composer<_$AppDatabase, $StationAliasesTable> {
  $$StationAliasesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get alias =>
      $composableBuilder(column: $table.alias, builder: (column) => column);

  $$StationsTableAnnotationComposer get stationId {
    final $$StationsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableAnnotationComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$StationAliasesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $StationAliasesTable,
          StationAliase,
          $$StationAliasesTableFilterComposer,
          $$StationAliasesTableOrderingComposer,
          $$StationAliasesTableAnnotationComposer,
          $$StationAliasesTableCreateCompanionBuilder,
          $$StationAliasesTableUpdateCompanionBuilder,
          (StationAliase, $$StationAliasesTableReferences),
          StationAliase,
          PrefetchHooks Function({bool stationId})
        > {
  $$StationAliasesTableTableManager(
    _$AppDatabase db,
    $StationAliasesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StationAliasesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StationAliasesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StationAliasesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> stationId = const Value.absent(),
                Value<String> alias = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StationAliasesCompanion(
                stationId: stationId,
                alias: alias,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String stationId,
                required String alias,
                Value<int> rowid = const Value.absent(),
              }) => StationAliasesCompanion.insert(
                stationId: stationId,
                alias: alias,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$StationAliasesTable, StationAliase>(table),
                  $$StationAliasesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({stationId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (stationId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.stationId,
                                referencedTable: $$StationAliasesTableReferences
                                    ._stationIdTable(db),
                                referencedColumn:
                                    $$StationAliasesTableReferences
                                        ._stationIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$StationAliasesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $StationAliasesTable,
      StationAliase,
      $$StationAliasesTableFilterComposer,
      $$StationAliasesTableOrderingComposer,
      $$StationAliasesTableAnnotationComposer,
      $$StationAliasesTableCreateCompanionBuilder,
      $$StationAliasesTableUpdateCompanionBuilder,
      (StationAliase, $$StationAliasesTableReferences),
      StationAliase,
      PrefetchHooks Function({bool stationId})
    >;
typedef $$LocationSearchPagesTableCreateCompanionBuilder =
    LocationSearchPagesCompanion Function({
      required String cacheKey,
      required String query,
      required int limit,
      Value<String?> cursor,
      required DateTime generatedAtUtc,
      Value<String?> nextCursor,
      required DateTime fetchedAtUtc,
      required int maxAgeSeconds,
      required int staleWhileRevalidateSeconds,
      Value<int> rowid,
    });
typedef $$LocationSearchPagesTableUpdateCompanionBuilder =
    LocationSearchPagesCompanion Function({
      Value<String> cacheKey,
      Value<String> query,
      Value<int> limit,
      Value<String?> cursor,
      Value<DateTime> generatedAtUtc,
      Value<String?> nextCursor,
      Value<DateTime> fetchedAtUtc,
      Value<int> maxAgeSeconds,
      Value<int> staleWhileRevalidateSeconds,
      Value<int> rowid,
    });

final class $$LocationSearchPagesTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $LocationSearchPagesTable,
          LocationSearchPage
        > {
  $$LocationSearchPagesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static MultiTypedResultKey<
    $LocationSearchPageItemsTable,
    List<LocationSearchPageItem>
  >
  _locationSearchPageItemsRefsTable(
    _$AppDatabase db,
  ) => MultiTypedResultKey.fromTable(
    db.locationSearchPageItems,
    aliasName:
        'location_search_pages__cache_key__location_search_page_items__cache_key',
  );

  $$LocationSearchPageItemsTableProcessedTableManager
  get locationSearchPageItemsRefs {
    final manager =
        $$LocationSearchPageItemsTableTableManager(
          $_db,
          $_db.locationSearchPageItems,
        ).filter(
          (f) =>
              f.cacheKey.cacheKey.sqlEquals($_itemColumn<String>('cache_key')!),
        );

    final cache = $_typedResult.readTableOrNull(
      _locationSearchPageItemsRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$LocationSearchPagesTableFilterComposer
    extends Composer<_$AppDatabase, $LocationSearchPagesTable> {
  $$LocationSearchPagesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get query => $composableBuilder(
    column: $table.query,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get limit => $composableBuilder(
    column: $table.limit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cursor => $composableBuilder(
    column: $table.cursor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get nextCursor => $composableBuilder(
    column: $table.nextCursor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> locationSearchPageItemsRefs(
    Expression<bool> Function($$LocationSearchPageItemsTableFilterComposer f) f,
  ) {
    final $$LocationSearchPageItemsTableFilterComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.cacheKey,
          referencedTable: $db.locationSearchPageItems,
          getReferencedColumn: (t) => t.cacheKey,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocationSearchPageItemsTableFilterComposer(
                $db: $db,
                $table: $db.locationSearchPageItems,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$LocationSearchPagesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocationSearchPagesTable> {
  $$LocationSearchPagesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get query => $composableBuilder(
    column: $table.query,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get limit => $composableBuilder(
    column: $table.limit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cursor => $composableBuilder(
    column: $table.cursor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nextCursor => $composableBuilder(
    column: $table.nextCursor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocationSearchPagesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocationSearchPagesTable> {
  $$LocationSearchPagesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get cacheKey =>
      $composableBuilder(column: $table.cacheKey, builder: (column) => column);

  GeneratedColumn<String> get query =>
      $composableBuilder(column: $table.query, builder: (column) => column);

  GeneratedColumn<int> get limit =>
      $composableBuilder(column: $table.limit, builder: (column) => column);

  GeneratedColumn<String> get cursor =>
      $composableBuilder(column: $table.cursor, builder: (column) => column);

  GeneratedColumn<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<String> get nextCursor => $composableBuilder(
    column: $table.nextCursor,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => column,
  );

  Expression<T> locationSearchPageItemsRefs<T extends Object>(
    Expression<T> Function($$LocationSearchPageItemsTableAnnotationComposer a)
    f,
  ) {
    final $$LocationSearchPageItemsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.cacheKey,
          referencedTable: $db.locationSearchPageItems,
          getReferencedColumn: (t) => t.cacheKey,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocationSearchPageItemsTableAnnotationComposer(
                $db: $db,
                $table: $db.locationSearchPageItems,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$LocationSearchPagesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocationSearchPagesTable,
          LocationSearchPage,
          $$LocationSearchPagesTableFilterComposer,
          $$LocationSearchPagesTableOrderingComposer,
          $$LocationSearchPagesTableAnnotationComposer,
          $$LocationSearchPagesTableCreateCompanionBuilder,
          $$LocationSearchPagesTableUpdateCompanionBuilder,
          (LocationSearchPage, $$LocationSearchPagesTableReferences),
          LocationSearchPage,
          PrefetchHooks Function({bool locationSearchPageItemsRefs})
        > {
  $$LocationSearchPagesTableTableManager(
    _$AppDatabase db,
    $LocationSearchPagesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocationSearchPagesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocationSearchPagesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocationSearchPagesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<String> query = const Value.absent(),
                Value<int> limit = const Value.absent(),
                Value<String?> cursor = const Value.absent(),
                Value<DateTime> generatedAtUtc = const Value.absent(),
                Value<String?> nextCursor = const Value.absent(),
                Value<DateTime> fetchedAtUtc = const Value.absent(),
                Value<int> maxAgeSeconds = const Value.absent(),
                Value<int> staleWhileRevalidateSeconds = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocationSearchPagesCompanion(
                cacheKey: cacheKey,
                query: query,
                limit: limit,
                cursor: cursor,
                generatedAtUtc: generatedAtUtc,
                nextCursor: nextCursor,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required String query,
                required int limit,
                Value<String?> cursor = const Value.absent(),
                required DateTime generatedAtUtc,
                Value<String?> nextCursor = const Value.absent(),
                required DateTime fetchedAtUtc,
                required int maxAgeSeconds,
                required int staleWhileRevalidateSeconds,
                Value<int> rowid = const Value.absent(),
              }) => LocationSearchPagesCompanion.insert(
                cacheKey: cacheKey,
                query: query,
                limit: limit,
                cursor: cursor,
                generatedAtUtc: generatedAtUtc,
                nextCursor: nextCursor,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocationSearchPagesTable, LocationSearchPage>(
                    table,
                  ),
                  $$LocationSearchPagesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({locationSearchPageItemsRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [
                if (locationSearchPageItemsRefs) db.locationSearchPageItems,
              ],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (locationSearchPageItemsRefs)
                    await $_getPrefetchedData<
                      LocationSearchPage,
                      $LocationSearchPagesTable,
                      LocationSearchPageItem
                    >(
                      currentTable: table,
                      referencedTable: $$LocationSearchPagesTableReferences
                          ._locationSearchPageItemsRefsTable(db),
                      managerFromTypedResult: (p0) =>
                          $$LocationSearchPagesTableReferences(
                            db,
                            table,
                            p0,
                          ).locationSearchPageItemsRefs,
                      referencedItemsForCurrentItem: (item, referencedItems) =>
                          referencedItems.where(
                            (e) => e.cacheKey == item.cacheKey,
                          ),
                      typedResults: items,
                    ),
                ];
              },
            );
          },
        ),
      );
}

typedef $$LocationSearchPagesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocationSearchPagesTable,
      LocationSearchPage,
      $$LocationSearchPagesTableFilterComposer,
      $$LocationSearchPagesTableOrderingComposer,
      $$LocationSearchPagesTableAnnotationComposer,
      $$LocationSearchPagesTableCreateCompanionBuilder,
      $$LocationSearchPagesTableUpdateCompanionBuilder,
      (LocationSearchPage, $$LocationSearchPagesTableReferences),
      LocationSearchPage,
      PrefetchHooks Function({bool locationSearchPageItemsRefs})
    >;
typedef $$LocationSearchPageItemsTableCreateCompanionBuilder =
    LocationSearchPageItemsCompanion Function({
      required String cacheKey,
      required int ordinal,
      required String stationId,
      Value<int> rowid,
    });
typedef $$LocationSearchPageItemsTableUpdateCompanionBuilder =
    LocationSearchPageItemsCompanion Function({
      Value<String> cacheKey,
      Value<int> ordinal,
      Value<String> stationId,
      Value<int> rowid,
    });

final class $$LocationSearchPageItemsTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $LocationSearchPageItemsTable,
          LocationSearchPageItem
        > {
  $$LocationSearchPageItemsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $LocationSearchPagesTable _cacheKeyTable(
    _$AppDatabase db,
  ) => db.locationSearchPages.createAlias(
    'location_search_page_items__cache_key__location_search_pages__cache_key',
  );

  $$LocationSearchPagesTableProcessedTableManager get cacheKey {
    final $_column = $_itemColumn<String>('cache_key')!;

    final manager = $$LocationSearchPagesTableTableManager(
      $_db,
      $_db.locationSearchPages,
    ).filter((f) => f.cacheKey.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_cacheKeyTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static $StationsTable _stationIdTable(_$AppDatabase db) => db.stations
      .createAlias('location_search_page_items__station_id__stations__id');

  $$StationsTableProcessedTableManager get stationId {
    final $_column = $_itemColumn<String>('station_id')!;

    final manager = $$StationsTableTableManager(
      $_db,
      $_db.stations,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_stationIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocationSearchPageItemsTableFilterComposer
    extends Composer<_$AppDatabase, $LocationSearchPageItemsTable> {
  $$LocationSearchPageItemsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get ordinal => $composableBuilder(
    column: $table.ordinal,
    builder: (column) => ColumnFilters(column),
  );

  $$LocationSearchPagesTableFilterComposer get cacheKey {
    final $$LocationSearchPagesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.cacheKey,
      referencedTable: $db.locationSearchPages,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocationSearchPagesTableFilterComposer(
            $db: $db,
            $table: $db.locationSearchPages,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$StationsTableFilterComposer get stationId {
    final $$StationsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableFilterComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocationSearchPageItemsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocationSearchPageItemsTable> {
  $$LocationSearchPageItemsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get ordinal => $composableBuilder(
    column: $table.ordinal,
    builder: (column) => ColumnOrderings(column),
  );

  $$LocationSearchPagesTableOrderingComposer get cacheKey {
    final $$LocationSearchPagesTableOrderingComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.cacheKey,
          referencedTable: $db.locationSearchPages,
          getReferencedColumn: (t) => t.cacheKey,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocationSearchPagesTableOrderingComposer(
                $db: $db,
                $table: $db.locationSearchPages,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }

  $$StationsTableOrderingComposer get stationId {
    final $$StationsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableOrderingComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocationSearchPageItemsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocationSearchPageItemsTable> {
  $$LocationSearchPageItemsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get ordinal =>
      $composableBuilder(column: $table.ordinal, builder: (column) => column);

  $$LocationSearchPagesTableAnnotationComposer get cacheKey {
    final $$LocationSearchPagesTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.cacheKey,
          referencedTable: $db.locationSearchPages,
          getReferencedColumn: (t) => t.cacheKey,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocationSearchPagesTableAnnotationComposer(
                $db: $db,
                $table: $db.locationSearchPages,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return composer;
  }

  $$StationsTableAnnotationComposer get stationId {
    final $$StationsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableAnnotationComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocationSearchPageItemsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocationSearchPageItemsTable,
          LocationSearchPageItem,
          $$LocationSearchPageItemsTableFilterComposer,
          $$LocationSearchPageItemsTableOrderingComposer,
          $$LocationSearchPageItemsTableAnnotationComposer,
          $$LocationSearchPageItemsTableCreateCompanionBuilder,
          $$LocationSearchPageItemsTableUpdateCompanionBuilder,
          (LocationSearchPageItem, $$LocationSearchPageItemsTableReferences),
          LocationSearchPageItem,
          PrefetchHooks Function({bool cacheKey, bool stationId})
        > {
  $$LocationSearchPageItemsTableTableManager(
    _$AppDatabase db,
    $LocationSearchPageItemsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocationSearchPageItemsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocationSearchPageItemsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocationSearchPageItemsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<int> ordinal = const Value.absent(),
                Value<String> stationId = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocationSearchPageItemsCompanion(
                cacheKey: cacheKey,
                ordinal: ordinal,
                stationId: stationId,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required int ordinal,
                required String stationId,
                Value<int> rowid = const Value.absent(),
              }) => LocationSearchPageItemsCompanion.insert(
                cacheKey: cacheKey,
                ordinal: ordinal,
                stationId: stationId,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<
                    $LocationSearchPageItemsTable,
                    LocationSearchPageItem
                  >(table),
                  $$LocationSearchPageItemsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({cacheKey = false, stationId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (cacheKey) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.cacheKey,
                                referencedTable:
                                    $$LocationSearchPageItemsTableReferences
                                        ._cacheKeyTable(db),
                                referencedColumn:
                                    $$LocationSearchPageItemsTableReferences
                                        ._cacheKeyTable(db)
                                        .cacheKey,
                              )
                              as T;
                    }
                    if (stationId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.stationId,
                                referencedTable:
                                    $$LocationSearchPageItemsTableReferences
                                        ._stationIdTable(db),
                                referencedColumn:
                                    $$LocationSearchPageItemsTableReferences
                                        ._stationIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$LocationSearchPageItemsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocationSearchPageItemsTable,
      LocationSearchPageItem,
      $$LocationSearchPageItemsTableFilterComposer,
      $$LocationSearchPageItemsTableOrderingComposer,
      $$LocationSearchPageItemsTableAnnotationComposer,
      $$LocationSearchPageItemsTableCreateCompanionBuilder,
      $$LocationSearchPageItemsTableUpdateCompanionBuilder,
      (LocationSearchPageItem, $$LocationSearchPageItemsTableReferences),
      LocationSearchPageItem,
      PrefetchHooks Function({bool cacheKey, bool stationId})
    >;
typedef $$TideSeriesTableCreateCompanionBuilder =
    TideSeriesCompanion Function({
      required String cacheKey,
      required String stationId,
      required DateTime startUtc,
      required DateTime endUtc,
      required int intervalSeconds,
      required String modelId,
      Value<String?> modelVersion,
      required String datumId,
      required String unit,
      required String timeZone,
      required String phaseConvention,
      required DateTime referenceEpochUtc,
      required int constituentCount,
      Value<String?> provenanceSourceKey,
      Value<String?> provenanceImportRunId,
      required DateTime generatedAtUtc,
      required DateTime fetchedAtUtc,
      required int maxAgeSeconds,
      required int staleWhileRevalidateSeconds,
      Value<int> rowid,
    });
typedef $$TideSeriesTableUpdateCompanionBuilder =
    TideSeriesCompanion Function({
      Value<String> cacheKey,
      Value<String> stationId,
      Value<DateTime> startUtc,
      Value<DateTime> endUtc,
      Value<int> intervalSeconds,
      Value<String> modelId,
      Value<String?> modelVersion,
      Value<String> datumId,
      Value<String> unit,
      Value<String> timeZone,
      Value<String> phaseConvention,
      Value<DateTime> referenceEpochUtc,
      Value<int> constituentCount,
      Value<String?> provenanceSourceKey,
      Value<String?> provenanceImportRunId,
      Value<DateTime> generatedAtUtc,
      Value<DateTime> fetchedAtUtc,
      Value<int> maxAgeSeconds,
      Value<int> staleWhileRevalidateSeconds,
      Value<int> rowid,
    });

final class $$TideSeriesTableReferences
    extends BaseReferences<_$AppDatabase, $TideSeriesTable, TideSery> {
  $$TideSeriesTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $StationsTable _stationIdTable(_$AppDatabase db) =>
      db.stations.createAlias('tide_series__station_id__stations__id');

  $$StationsTableProcessedTableManager get stationId {
    final $_column = $_itemColumn<String>('station_id')!;

    final manager = $$StationsTableTableManager(
      $_db,
      $_db.stations,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_stationIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static MultiTypedResultKey<$TidePointsTable, List<TidePoint>>
  _tidePointsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.tidePoints,
    aliasName: 'tide_series__cache_key__tide_points__series_key',
  );

  $$TidePointsTableProcessedTableManager get tidePointsRefs {
    final manager = $$TidePointsTableTableManager($_db, $_db.tidePoints).filter(
      (f) => f.seriesKey.cacheKey.sqlEquals($_itemColumn<String>('cache_key')!),
    );

    final cache = $_typedResult.readTableOrNull(_tidePointsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$TideSeriesTableFilterComposer
    extends Composer<_$AppDatabase, $TideSeriesTable> {
  $$TideSeriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startUtc => $composableBuilder(
    column: $table.startUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get endUtc => $composableBuilder(
    column: $table.endUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get intervalSeconds => $composableBuilder(
    column: $table.intervalSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get modelId => $composableBuilder(
    column: $table.modelId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get modelVersion => $composableBuilder(
    column: $table.modelVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get datumId => $composableBuilder(
    column: $table.datumId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phaseConvention => $composableBuilder(
    column: $table.phaseConvention,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get referenceEpochUtc => $composableBuilder(
    column: $table.referenceEpochUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get constituentCount => $composableBuilder(
    column: $table.constituentCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnFilters(column),
  );

  $$StationsTableFilterComposer get stationId {
    final $$StationsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableFilterComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  Expression<bool> tidePointsRefs(
    Expression<bool> Function($$TidePointsTableFilterComposer f) f,
  ) {
    final $$TidePointsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.cacheKey,
      referencedTable: $db.tidePoints,
      getReferencedColumn: (t) => t.seriesKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TidePointsTableFilterComposer(
            $db: $db,
            $table: $db.tidePoints,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$TideSeriesTableOrderingComposer
    extends Composer<_$AppDatabase, $TideSeriesTable> {
  $$TideSeriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startUtc => $composableBuilder(
    column: $table.startUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get endUtc => $composableBuilder(
    column: $table.endUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get intervalSeconds => $composableBuilder(
    column: $table.intervalSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get modelId => $composableBuilder(
    column: $table.modelId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get modelVersion => $composableBuilder(
    column: $table.modelVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get datumId => $composableBuilder(
    column: $table.datumId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phaseConvention => $composableBuilder(
    column: $table.phaseConvention,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get referenceEpochUtc => $composableBuilder(
    column: $table.referenceEpochUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get constituentCount => $composableBuilder(
    column: $table.constituentCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  $$StationsTableOrderingComposer get stationId {
    final $$StationsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableOrderingComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$TideSeriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $TideSeriesTable> {
  $$TideSeriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get cacheKey =>
      $composableBuilder(column: $table.cacheKey, builder: (column) => column);

  GeneratedColumn<DateTime> get startUtc =>
      $composableBuilder(column: $table.startUtc, builder: (column) => column);

  GeneratedColumn<DateTime> get endUtc =>
      $composableBuilder(column: $table.endUtc, builder: (column) => column);

  GeneratedColumn<int> get intervalSeconds => $composableBuilder(
    column: $table.intervalSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<String> get modelId =>
      $composableBuilder(column: $table.modelId, builder: (column) => column);

  GeneratedColumn<String> get modelVersion => $composableBuilder(
    column: $table.modelVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get datumId =>
      $composableBuilder(column: $table.datumId, builder: (column) => column);

  GeneratedColumn<String> get unit =>
      $composableBuilder(column: $table.unit, builder: (column) => column);

  GeneratedColumn<String> get timeZone =>
      $composableBuilder(column: $table.timeZone, builder: (column) => column);

  GeneratedColumn<String> get phaseConvention => $composableBuilder(
    column: $table.phaseConvention,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get referenceEpochUtc => $composableBuilder(
    column: $table.referenceEpochUtc,
    builder: (column) => column,
  );

  GeneratedColumn<int> get constituentCount => $composableBuilder(
    column: $table.constituentCount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => column,
  );

  $$StationsTableAnnotationComposer get stationId {
    final $$StationsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.stationId,
      referencedTable: $db.stations,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$StationsTableAnnotationComposer(
            $db: $db,
            $table: $db.stations,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  Expression<T> tidePointsRefs<T extends Object>(
    Expression<T> Function($$TidePointsTableAnnotationComposer a) f,
  ) {
    final $$TidePointsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.cacheKey,
      referencedTable: $db.tidePoints,
      getReferencedColumn: (t) => t.seriesKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TidePointsTableAnnotationComposer(
            $db: $db,
            $table: $db.tidePoints,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$TideSeriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TideSeriesTable,
          TideSery,
          $$TideSeriesTableFilterComposer,
          $$TideSeriesTableOrderingComposer,
          $$TideSeriesTableAnnotationComposer,
          $$TideSeriesTableCreateCompanionBuilder,
          $$TideSeriesTableUpdateCompanionBuilder,
          (TideSery, $$TideSeriesTableReferences),
          TideSery,
          PrefetchHooks Function({bool stationId, bool tidePointsRefs})
        > {
  $$TideSeriesTableTableManager(_$AppDatabase db, $TideSeriesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TideSeriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TideSeriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TideSeriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<String> stationId = const Value.absent(),
                Value<DateTime> startUtc = const Value.absent(),
                Value<DateTime> endUtc = const Value.absent(),
                Value<int> intervalSeconds = const Value.absent(),
                Value<String> modelId = const Value.absent(),
                Value<String?> modelVersion = const Value.absent(),
                Value<String> datumId = const Value.absent(),
                Value<String> unit = const Value.absent(),
                Value<String> timeZone = const Value.absent(),
                Value<String> phaseConvention = const Value.absent(),
                Value<DateTime> referenceEpochUtc = const Value.absent(),
                Value<int> constituentCount = const Value.absent(),
                Value<String?> provenanceSourceKey = const Value.absent(),
                Value<String?> provenanceImportRunId = const Value.absent(),
                Value<DateTime> generatedAtUtc = const Value.absent(),
                Value<DateTime> fetchedAtUtc = const Value.absent(),
                Value<int> maxAgeSeconds = const Value.absent(),
                Value<int> staleWhileRevalidateSeconds = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TideSeriesCompanion(
                cacheKey: cacheKey,
                stationId: stationId,
                startUtc: startUtc,
                endUtc: endUtc,
                intervalSeconds: intervalSeconds,
                modelId: modelId,
                modelVersion: modelVersion,
                datumId: datumId,
                unit: unit,
                timeZone: timeZone,
                phaseConvention: phaseConvention,
                referenceEpochUtc: referenceEpochUtc,
                constituentCount: constituentCount,
                provenanceSourceKey: provenanceSourceKey,
                provenanceImportRunId: provenanceImportRunId,
                generatedAtUtc: generatedAtUtc,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required String stationId,
                required DateTime startUtc,
                required DateTime endUtc,
                required int intervalSeconds,
                required String modelId,
                Value<String?> modelVersion = const Value.absent(),
                required String datumId,
                required String unit,
                required String timeZone,
                required String phaseConvention,
                required DateTime referenceEpochUtc,
                required int constituentCount,
                Value<String?> provenanceSourceKey = const Value.absent(),
                Value<String?> provenanceImportRunId = const Value.absent(),
                required DateTime generatedAtUtc,
                required DateTime fetchedAtUtc,
                required int maxAgeSeconds,
                required int staleWhileRevalidateSeconds,
                Value<int> rowid = const Value.absent(),
              }) => TideSeriesCompanion.insert(
                cacheKey: cacheKey,
                stationId: stationId,
                startUtc: startUtc,
                endUtc: endUtc,
                intervalSeconds: intervalSeconds,
                modelId: modelId,
                modelVersion: modelVersion,
                datumId: datumId,
                unit: unit,
                timeZone: timeZone,
                phaseConvention: phaseConvention,
                referenceEpochUtc: referenceEpochUtc,
                constituentCount: constituentCount,
                provenanceSourceKey: provenanceSourceKey,
                provenanceImportRunId: provenanceImportRunId,
                generatedAtUtc: generatedAtUtc,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$TideSeriesTable, TideSery>(table),
                  $$TideSeriesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({stationId = false, tidePointsRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [if (tidePointsRefs) db.tidePoints],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (stationId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.stationId,
                                referencedTable: $$TideSeriesTableReferences
                                    ._stationIdTable(db),
                                referencedColumn: $$TideSeriesTableReferences
                                    ._stationIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [
                  if (tidePointsRefs)
                    await $_getPrefetchedData<
                      TideSery,
                      $TideSeriesTable,
                      TidePoint
                    >(
                      currentTable: table,
                      referencedTable: $$TideSeriesTableReferences
                          ._tidePointsRefsTable(db),
                      managerFromTypedResult: (p0) =>
                          $$TideSeriesTableReferences(
                            db,
                            table,
                            p0,
                          ).tidePointsRefs,
                      referencedItemsForCurrentItem: (item, referencedItems) =>
                          referencedItems.where(
                            (e) => e.seriesKey == item.cacheKey,
                          ),
                      typedResults: items,
                    ),
                ];
              },
            );
          },
        ),
      );
}

typedef $$TideSeriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TideSeriesTable,
      TideSery,
      $$TideSeriesTableFilterComposer,
      $$TideSeriesTableOrderingComposer,
      $$TideSeriesTableAnnotationComposer,
      $$TideSeriesTableCreateCompanionBuilder,
      $$TideSeriesTableUpdateCompanionBuilder,
      (TideSery, $$TideSeriesTableReferences),
      TideSery,
      PrefetchHooks Function({bool stationId, bool tidePointsRefs})
    >;
typedef $$TidePointsTableCreateCompanionBuilder =
    TidePointsCompanion Function({
      required String seriesKey,
      required DateTime timestampUtc,
      required double value,
      Value<int> rowid,
    });
typedef $$TidePointsTableUpdateCompanionBuilder =
    TidePointsCompanion Function({
      Value<String> seriesKey,
      Value<DateTime> timestampUtc,
      Value<double> value,
      Value<int> rowid,
    });

final class $$TidePointsTableReferences
    extends BaseReferences<_$AppDatabase, $TidePointsTable, TidePoint> {
  $$TidePointsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $TideSeriesTable _seriesKeyTable(_$AppDatabase db) => db.tideSeries
      .createAlias('tide_points__series_key__tide_series__cache_key');

  $$TideSeriesTableProcessedTableManager get seriesKey {
    final $_column = $_itemColumn<String>('series_key')!;

    final manager = $$TideSeriesTableTableManager(
      $_db,
      $_db.tideSeries,
    ).filter((f) => f.cacheKey.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_seriesKeyTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$TidePointsTableFilterComposer
    extends Composer<_$AppDatabase, $TidePointsTable> {
  $$TidePointsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<DateTime> get timestampUtc => $composableBuilder(
    column: $table.timestampUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );

  $$TideSeriesTableFilterComposer get seriesKey {
    final $$TideSeriesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.seriesKey,
      referencedTable: $db.tideSeries,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TideSeriesTableFilterComposer(
            $db: $db,
            $table: $db.tideSeries,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$TidePointsTableOrderingComposer
    extends Composer<_$AppDatabase, $TidePointsTable> {
  $$TidePointsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<DateTime> get timestampUtc => $composableBuilder(
    column: $table.timestampUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );

  $$TideSeriesTableOrderingComposer get seriesKey {
    final $$TideSeriesTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.seriesKey,
      referencedTable: $db.tideSeries,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TideSeriesTableOrderingComposer(
            $db: $db,
            $table: $db.tideSeries,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$TidePointsTableAnnotationComposer
    extends Composer<_$AppDatabase, $TidePointsTable> {
  $$TidePointsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<DateTime> get timestampUtc => $composableBuilder(
    column: $table.timestampUtc,
    builder: (column) => column,
  );

  GeneratedColumn<double> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  $$TideSeriesTableAnnotationComposer get seriesKey {
    final $$TideSeriesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.seriesKey,
      referencedTable: $db.tideSeries,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$TideSeriesTableAnnotationComposer(
            $db: $db,
            $table: $db.tideSeries,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$TidePointsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TidePointsTable,
          TidePoint,
          $$TidePointsTableFilterComposer,
          $$TidePointsTableOrderingComposer,
          $$TidePointsTableAnnotationComposer,
          $$TidePointsTableCreateCompanionBuilder,
          $$TidePointsTableUpdateCompanionBuilder,
          (TidePoint, $$TidePointsTableReferences),
          TidePoint,
          PrefetchHooks Function({bool seriesKey})
        > {
  $$TidePointsTableTableManager(_$AppDatabase db, $TidePointsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TidePointsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TidePointsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TidePointsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> seriesKey = const Value.absent(),
                Value<DateTime> timestampUtc = const Value.absent(),
                Value<double> value = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TidePointsCompanion(
                seriesKey: seriesKey,
                timestampUtc: timestampUtc,
                value: value,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String seriesKey,
                required DateTime timestampUtc,
                required double value,
                Value<int> rowid = const Value.absent(),
              }) => TidePointsCompanion.insert(
                seriesKey: seriesKey,
                timestampUtc: timestampUtc,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$TidePointsTable, TidePoint>(table),
                  $$TidePointsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({seriesKey = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (seriesKey) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.seriesKey,
                                referencedTable: $$TidePointsTableReferences
                                    ._seriesKeyTable(db),
                                referencedColumn: $$TidePointsTableReferences
                                    ._seriesKeyTable(db)
                                    .cacheKey,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$TidePointsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TidePointsTable,
      TidePoint,
      $$TidePointsTableFilterComposer,
      $$TidePointsTableOrderingComposer,
      $$TidePointsTableAnnotationComposer,
      $$TidePointsTableCreateCompanionBuilder,
      $$TidePointsTableUpdateCompanionBuilder,
      (TidePoint, $$TidePointsTableReferences),
      TidePoint,
      PrefetchHooks Function({bool seriesKey})
    >;
typedef $$WaterLevelPagesTableCreateCompanionBuilder =
    WaterLevelPagesCompanion Function({
      required String cacheKey,
      required String stationId,
      required String stationName,
      required String timeZone,
      Value<String?> defaultDatumId,
      Value<DateTime?> startUtc,
      Value<DateTime?> endUtc,
      required int limit,
      Value<String?> cursor,
      required DateTime generatedAtUtc,
      Value<DateTime?> latestObservedAtUtc,
      Value<String?> nextCursor,
      required DateTime fetchedAtUtc,
      required int maxAgeSeconds,
      required int staleWhileRevalidateSeconds,
      Value<int> rowid,
    });
typedef $$WaterLevelPagesTableUpdateCompanionBuilder =
    WaterLevelPagesCompanion Function({
      Value<String> cacheKey,
      Value<String> stationId,
      Value<String> stationName,
      Value<String> timeZone,
      Value<String?> defaultDatumId,
      Value<DateTime?> startUtc,
      Value<DateTime?> endUtc,
      Value<int> limit,
      Value<String?> cursor,
      Value<DateTime> generatedAtUtc,
      Value<DateTime?> latestObservedAtUtc,
      Value<String?> nextCursor,
      Value<DateTime> fetchedAtUtc,
      Value<int> maxAgeSeconds,
      Value<int> staleWhileRevalidateSeconds,
      Value<int> rowid,
    });

final class $$WaterLevelPagesTableReferences
    extends
        BaseReferences<_$AppDatabase, $WaterLevelPagesTable, WaterLevelPage> {
  $$WaterLevelPagesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static MultiTypedResultKey<
    $WaterLevelPageItemsTable,
    List<WaterLevelPageItem>
  >
  _waterLevelPageItemsRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.waterLevelPageItems,
        aliasName:
            'water_level_pages__cache_key__water_level_page_items__page_key',
      );

  $$WaterLevelPageItemsTableProcessedTableManager get waterLevelPageItemsRefs {
    final manager =
        $$WaterLevelPageItemsTableTableManager(
          $_db,
          $_db.waterLevelPageItems,
        ).filter(
          (f) =>
              f.pageKey.cacheKey.sqlEquals($_itemColumn<String>('cache_key')!),
        );

    final cache = $_typedResult.readTableOrNull(
      _waterLevelPageItemsRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$WaterLevelPagesTableFilterComposer
    extends Composer<_$AppDatabase, $WaterLevelPagesTable> {
  $$WaterLevelPagesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get stationName => $composableBuilder(
    column: $table.stationName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get defaultDatumId => $composableBuilder(
    column: $table.defaultDatumId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startUtc => $composableBuilder(
    column: $table.startUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get endUtc => $composableBuilder(
    column: $table.endUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get limit => $composableBuilder(
    column: $table.limit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cursor => $composableBuilder(
    column: $table.cursor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get latestObservedAtUtc => $composableBuilder(
    column: $table.latestObservedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get nextCursor => $composableBuilder(
    column: $table.nextCursor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> waterLevelPageItemsRefs(
    Expression<bool> Function($$WaterLevelPageItemsTableFilterComposer f) f,
  ) {
    final $$WaterLevelPageItemsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.cacheKey,
      referencedTable: $db.waterLevelPageItems,
      getReferencedColumn: (t) => t.pageKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$WaterLevelPageItemsTableFilterComposer(
            $db: $db,
            $table: $db.waterLevelPageItems,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$WaterLevelPagesTableOrderingComposer
    extends Composer<_$AppDatabase, $WaterLevelPagesTable> {
  $$WaterLevelPagesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get stationName => $composableBuilder(
    column: $table.stationName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get defaultDatumId => $composableBuilder(
    column: $table.defaultDatumId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startUtc => $composableBuilder(
    column: $table.startUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get endUtc => $composableBuilder(
    column: $table.endUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get limit => $composableBuilder(
    column: $table.limit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cursor => $composableBuilder(
    column: $table.cursor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get latestObservedAtUtc => $composableBuilder(
    column: $table.latestObservedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nextCursor => $composableBuilder(
    column: $table.nextCursor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WaterLevelPagesTableAnnotationComposer
    extends Composer<_$AppDatabase, $WaterLevelPagesTable> {
  $$WaterLevelPagesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get cacheKey =>
      $composableBuilder(column: $table.cacheKey, builder: (column) => column);

  GeneratedColumn<String> get stationId =>
      $composableBuilder(column: $table.stationId, builder: (column) => column);

  GeneratedColumn<String> get stationName => $composableBuilder(
    column: $table.stationName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get timeZone =>
      $composableBuilder(column: $table.timeZone, builder: (column) => column);

  GeneratedColumn<String> get defaultDatumId => $composableBuilder(
    column: $table.defaultDatumId,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get startUtc =>
      $composableBuilder(column: $table.startUtc, builder: (column) => column);

  GeneratedColumn<DateTime> get endUtc =>
      $composableBuilder(column: $table.endUtc, builder: (column) => column);

  GeneratedColumn<int> get limit =>
      $composableBuilder(column: $table.limit, builder: (column) => column);

  GeneratedColumn<String> get cursor =>
      $composableBuilder(column: $table.cursor, builder: (column) => column);

  GeneratedColumn<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get latestObservedAtUtc => $composableBuilder(
    column: $table.latestObservedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<String> get nextCursor => $composableBuilder(
    column: $table.nextCursor,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => column,
  );

  Expression<T> waterLevelPageItemsRefs<T extends Object>(
    Expression<T> Function($$WaterLevelPageItemsTableAnnotationComposer a) f,
  ) {
    final $$WaterLevelPageItemsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.cacheKey,
          referencedTable: $db.waterLevelPageItems,
          getReferencedColumn: (t) => t.pageKey,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$WaterLevelPageItemsTableAnnotationComposer(
                $db: $db,
                $table: $db.waterLevelPageItems,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$WaterLevelPagesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WaterLevelPagesTable,
          WaterLevelPage,
          $$WaterLevelPagesTableFilterComposer,
          $$WaterLevelPagesTableOrderingComposer,
          $$WaterLevelPagesTableAnnotationComposer,
          $$WaterLevelPagesTableCreateCompanionBuilder,
          $$WaterLevelPagesTableUpdateCompanionBuilder,
          (WaterLevelPage, $$WaterLevelPagesTableReferences),
          WaterLevelPage,
          PrefetchHooks Function({bool waterLevelPageItemsRefs})
        > {
  $$WaterLevelPagesTableTableManager(
    _$AppDatabase db,
    $WaterLevelPagesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WaterLevelPagesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WaterLevelPagesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WaterLevelPagesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<String> stationId = const Value.absent(),
                Value<String> stationName = const Value.absent(),
                Value<String> timeZone = const Value.absent(),
                Value<String?> defaultDatumId = const Value.absent(),
                Value<DateTime?> startUtc = const Value.absent(),
                Value<DateTime?> endUtc = const Value.absent(),
                Value<int> limit = const Value.absent(),
                Value<String?> cursor = const Value.absent(),
                Value<DateTime> generatedAtUtc = const Value.absent(),
                Value<DateTime?> latestObservedAtUtc = const Value.absent(),
                Value<String?> nextCursor = const Value.absent(),
                Value<DateTime> fetchedAtUtc = const Value.absent(),
                Value<int> maxAgeSeconds = const Value.absent(),
                Value<int> staleWhileRevalidateSeconds = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => WaterLevelPagesCompanion(
                cacheKey: cacheKey,
                stationId: stationId,
                stationName: stationName,
                timeZone: timeZone,
                defaultDatumId: defaultDatumId,
                startUtc: startUtc,
                endUtc: endUtc,
                limit: limit,
                cursor: cursor,
                generatedAtUtc: generatedAtUtc,
                latestObservedAtUtc: latestObservedAtUtc,
                nextCursor: nextCursor,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required String stationId,
                required String stationName,
                required String timeZone,
                Value<String?> defaultDatumId = const Value.absent(),
                Value<DateTime?> startUtc = const Value.absent(),
                Value<DateTime?> endUtc = const Value.absent(),
                required int limit,
                Value<String?> cursor = const Value.absent(),
                required DateTime generatedAtUtc,
                Value<DateTime?> latestObservedAtUtc = const Value.absent(),
                Value<String?> nextCursor = const Value.absent(),
                required DateTime fetchedAtUtc,
                required int maxAgeSeconds,
                required int staleWhileRevalidateSeconds,
                Value<int> rowid = const Value.absent(),
              }) => WaterLevelPagesCompanion.insert(
                cacheKey: cacheKey,
                stationId: stationId,
                stationName: stationName,
                timeZone: timeZone,
                defaultDatumId: defaultDatumId,
                startUtc: startUtc,
                endUtc: endUtc,
                limit: limit,
                cursor: cursor,
                generatedAtUtc: generatedAtUtc,
                latestObservedAtUtc: latestObservedAtUtc,
                nextCursor: nextCursor,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$WaterLevelPagesTable, WaterLevelPage>(table),
                  $$WaterLevelPagesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({waterLevelPageItemsRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [
                if (waterLevelPageItemsRefs) db.waterLevelPageItems,
              ],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (waterLevelPageItemsRefs)
                    await $_getPrefetchedData<
                      WaterLevelPage,
                      $WaterLevelPagesTable,
                      WaterLevelPageItem
                    >(
                      currentTable: table,
                      referencedTable: $$WaterLevelPagesTableReferences
                          ._waterLevelPageItemsRefsTable(db),
                      managerFromTypedResult: (p0) =>
                          $$WaterLevelPagesTableReferences(
                            db,
                            table,
                            p0,
                          ).waterLevelPageItemsRefs,
                      referencedItemsForCurrentItem: (item, referencedItems) =>
                          referencedItems.where(
                            (e) => e.pageKey == item.cacheKey,
                          ),
                      typedResults: items,
                    ),
                ];
              },
            );
          },
        ),
      );
}

typedef $$WaterLevelPagesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WaterLevelPagesTable,
      WaterLevelPage,
      $$WaterLevelPagesTableFilterComposer,
      $$WaterLevelPagesTableOrderingComposer,
      $$WaterLevelPagesTableAnnotationComposer,
      $$WaterLevelPagesTableCreateCompanionBuilder,
      $$WaterLevelPagesTableUpdateCompanionBuilder,
      (WaterLevelPage, $$WaterLevelPagesTableReferences),
      WaterLevelPage,
      PrefetchHooks Function({bool waterLevelPageItemsRefs})
    >;
typedef $$WaterLevelObservationsTableCreateCompanionBuilder =
    WaterLevelObservationsCompanion Function({
      required String stationId,
      required String sourceRecordKey,
      required DateTime observedAtUtc,
      required double value,
      required String unit,
      Value<String?> datumId,
      required String qualityState,
      required String provenanceSourceKey,
      required String provenanceImportRunId,
      required String rawChecksumSha256,
      required String parserVersion,
      required String normalizerVersion,
      required DateTime provenanceObservedAtUtc,
      Value<int> rowid,
    });
typedef $$WaterLevelObservationsTableUpdateCompanionBuilder =
    WaterLevelObservationsCompanion Function({
      Value<String> stationId,
      Value<String> sourceRecordKey,
      Value<DateTime> observedAtUtc,
      Value<double> value,
      Value<String> unit,
      Value<String?> datumId,
      Value<String> qualityState,
      Value<String> provenanceSourceKey,
      Value<String> provenanceImportRunId,
      Value<String> rawChecksumSha256,
      Value<String> parserVersion,
      Value<String> normalizerVersion,
      Value<DateTime> provenanceObservedAtUtc,
      Value<int> rowid,
    });

class $$WaterLevelObservationsTableFilterComposer
    extends Composer<_$AppDatabase, $WaterLevelObservationsTable> {
  $$WaterLevelObservationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceRecordKey => $composableBuilder(
    column: $table.sourceRecordKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get observedAtUtc => $composableBuilder(
    column: $table.observedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get datumId => $composableBuilder(
    column: $table.datumId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get qualityState => $composableBuilder(
    column: $table.qualityState,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get rawChecksumSha256 => $composableBuilder(
    column: $table.rawChecksumSha256,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get parserVersion => $composableBuilder(
    column: $table.parserVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get normalizerVersion => $composableBuilder(
    column: $table.normalizerVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get provenanceObservedAtUtc => $composableBuilder(
    column: $table.provenanceObservedAtUtc,
    builder: (column) => ColumnFilters(column),
  );
}

class $$WaterLevelObservationsTableOrderingComposer
    extends Composer<_$AppDatabase, $WaterLevelObservationsTable> {
  $$WaterLevelObservationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceRecordKey => $composableBuilder(
    column: $table.sourceRecordKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get observedAtUtc => $composableBuilder(
    column: $table.observedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get datumId => $composableBuilder(
    column: $table.datumId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get qualityState => $composableBuilder(
    column: $table.qualityState,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get rawChecksumSha256 => $composableBuilder(
    column: $table.rawChecksumSha256,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get parserVersion => $composableBuilder(
    column: $table.parserVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get normalizerVersion => $composableBuilder(
    column: $table.normalizerVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get provenanceObservedAtUtc => $composableBuilder(
    column: $table.provenanceObservedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$WaterLevelObservationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $WaterLevelObservationsTable> {
  $$WaterLevelObservationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get stationId =>
      $composableBuilder(column: $table.stationId, builder: (column) => column);

  GeneratedColumn<String> get sourceRecordKey => $composableBuilder(
    column: $table.sourceRecordKey,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get observedAtUtc => $composableBuilder(
    column: $table.observedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<double> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  GeneratedColumn<String> get unit =>
      $composableBuilder(column: $table.unit, builder: (column) => column);

  GeneratedColumn<String> get datumId =>
      $composableBuilder(column: $table.datumId, builder: (column) => column);

  GeneratedColumn<String> get qualityState => $composableBuilder(
    column: $table.qualityState,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceSourceKey => $composableBuilder(
    column: $table.provenanceSourceKey,
    builder: (column) => column,
  );

  GeneratedColumn<String> get provenanceImportRunId => $composableBuilder(
    column: $table.provenanceImportRunId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get rawChecksumSha256 => $composableBuilder(
    column: $table.rawChecksumSha256,
    builder: (column) => column,
  );

  GeneratedColumn<String> get parserVersion => $composableBuilder(
    column: $table.parserVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get normalizerVersion => $composableBuilder(
    column: $table.normalizerVersion,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get provenanceObservedAtUtc => $composableBuilder(
    column: $table.provenanceObservedAtUtc,
    builder: (column) => column,
  );
}

class $$WaterLevelObservationsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WaterLevelObservationsTable,
          WaterLevelObservation,
          $$WaterLevelObservationsTableFilterComposer,
          $$WaterLevelObservationsTableOrderingComposer,
          $$WaterLevelObservationsTableAnnotationComposer,
          $$WaterLevelObservationsTableCreateCompanionBuilder,
          $$WaterLevelObservationsTableUpdateCompanionBuilder,
          (
            WaterLevelObservation,
            BaseReferences<
              _$AppDatabase,
              $WaterLevelObservationsTable,
              WaterLevelObservation
            >,
          ),
          WaterLevelObservation,
          PrefetchHooks Function()
        > {
  $$WaterLevelObservationsTableTableManager(
    _$AppDatabase db,
    $WaterLevelObservationsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WaterLevelObservationsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$WaterLevelObservationsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$WaterLevelObservationsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> stationId = const Value.absent(),
                Value<String> sourceRecordKey = const Value.absent(),
                Value<DateTime> observedAtUtc = const Value.absent(),
                Value<double> value = const Value.absent(),
                Value<String> unit = const Value.absent(),
                Value<String?> datumId = const Value.absent(),
                Value<String> qualityState = const Value.absent(),
                Value<String> provenanceSourceKey = const Value.absent(),
                Value<String> provenanceImportRunId = const Value.absent(),
                Value<String> rawChecksumSha256 = const Value.absent(),
                Value<String> parserVersion = const Value.absent(),
                Value<String> normalizerVersion = const Value.absent(),
                Value<DateTime> provenanceObservedAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => WaterLevelObservationsCompanion(
                stationId: stationId,
                sourceRecordKey: sourceRecordKey,
                observedAtUtc: observedAtUtc,
                value: value,
                unit: unit,
                datumId: datumId,
                qualityState: qualityState,
                provenanceSourceKey: provenanceSourceKey,
                provenanceImportRunId: provenanceImportRunId,
                rawChecksumSha256: rawChecksumSha256,
                parserVersion: parserVersion,
                normalizerVersion: normalizerVersion,
                provenanceObservedAtUtc: provenanceObservedAtUtc,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String stationId,
                required String sourceRecordKey,
                required DateTime observedAtUtc,
                required double value,
                required String unit,
                Value<String?> datumId = const Value.absent(),
                required String qualityState,
                required String provenanceSourceKey,
                required String provenanceImportRunId,
                required String rawChecksumSha256,
                required String parserVersion,
                required String normalizerVersion,
                required DateTime provenanceObservedAtUtc,
                Value<int> rowid = const Value.absent(),
              }) => WaterLevelObservationsCompanion.insert(
                stationId: stationId,
                sourceRecordKey: sourceRecordKey,
                observedAtUtc: observedAtUtc,
                value: value,
                unit: unit,
                datumId: datumId,
                qualityState: qualityState,
                provenanceSourceKey: provenanceSourceKey,
                provenanceImportRunId: provenanceImportRunId,
                rawChecksumSha256: rawChecksumSha256,
                parserVersion: parserVersion,
                normalizerVersion: normalizerVersion,
                provenanceObservedAtUtc: provenanceObservedAtUtc,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<
                    $WaterLevelObservationsTable,
                    WaterLevelObservation
                  >(table),
                  BaseReferences<
                    _$AppDatabase,
                    $WaterLevelObservationsTable,
                    WaterLevelObservation
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$WaterLevelObservationsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WaterLevelObservationsTable,
      WaterLevelObservation,
      $$WaterLevelObservationsTableFilterComposer,
      $$WaterLevelObservationsTableOrderingComposer,
      $$WaterLevelObservationsTableAnnotationComposer,
      $$WaterLevelObservationsTableCreateCompanionBuilder,
      $$WaterLevelObservationsTableUpdateCompanionBuilder,
      (
        WaterLevelObservation,
        BaseReferences<
          _$AppDatabase,
          $WaterLevelObservationsTable,
          WaterLevelObservation
        >,
      ),
      WaterLevelObservation,
      PrefetchHooks Function()
    >;
typedef $$WaterLevelPageItemsTableCreateCompanionBuilder =
    WaterLevelPageItemsCompanion Function({
      required String pageKey,
      required int ordinal,
      required String stationId,
      required String sourceRecordKey,
      Value<int> rowid,
    });
typedef $$WaterLevelPageItemsTableUpdateCompanionBuilder =
    WaterLevelPageItemsCompanion Function({
      Value<String> pageKey,
      Value<int> ordinal,
      Value<String> stationId,
      Value<String> sourceRecordKey,
      Value<int> rowid,
    });

final class $$WaterLevelPageItemsTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $WaterLevelPageItemsTable,
          WaterLevelPageItem
        > {
  $$WaterLevelPageItemsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $WaterLevelPagesTable _pageKeyTable(_$AppDatabase db) =>
      db.waterLevelPages.createAlias(
        'water_level_page_items__page_key__water_level_pages__cache_key',
      );

  $$WaterLevelPagesTableProcessedTableManager get pageKey {
    final $_column = $_itemColumn<String>('page_key')!;

    final manager = $$WaterLevelPagesTableTableManager(
      $_db,
      $_db.waterLevelPages,
    ).filter((f) => f.cacheKey.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_pageKeyTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$WaterLevelPageItemsTableFilterComposer
    extends Composer<_$AppDatabase, $WaterLevelPageItemsTable> {
  $$WaterLevelPageItemsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get ordinal => $composableBuilder(
    column: $table.ordinal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceRecordKey => $composableBuilder(
    column: $table.sourceRecordKey,
    builder: (column) => ColumnFilters(column),
  );

  $$WaterLevelPagesTableFilterComposer get pageKey {
    final $$WaterLevelPagesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.pageKey,
      referencedTable: $db.waterLevelPages,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$WaterLevelPagesTableFilterComposer(
            $db: $db,
            $table: $db.waterLevelPages,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$WaterLevelPageItemsTableOrderingComposer
    extends Composer<_$AppDatabase, $WaterLevelPageItemsTable> {
  $$WaterLevelPageItemsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get ordinal => $composableBuilder(
    column: $table.ordinal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceRecordKey => $composableBuilder(
    column: $table.sourceRecordKey,
    builder: (column) => ColumnOrderings(column),
  );

  $$WaterLevelPagesTableOrderingComposer get pageKey {
    final $$WaterLevelPagesTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.pageKey,
      referencedTable: $db.waterLevelPages,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$WaterLevelPagesTableOrderingComposer(
            $db: $db,
            $table: $db.waterLevelPages,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$WaterLevelPageItemsTableAnnotationComposer
    extends Composer<_$AppDatabase, $WaterLevelPageItemsTable> {
  $$WaterLevelPageItemsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get ordinal =>
      $composableBuilder(column: $table.ordinal, builder: (column) => column);

  GeneratedColumn<String> get stationId =>
      $composableBuilder(column: $table.stationId, builder: (column) => column);

  GeneratedColumn<String> get sourceRecordKey => $composableBuilder(
    column: $table.sourceRecordKey,
    builder: (column) => column,
  );

  $$WaterLevelPagesTableAnnotationComposer get pageKey {
    final $$WaterLevelPagesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.pageKey,
      referencedTable: $db.waterLevelPages,
      getReferencedColumn: (t) => t.cacheKey,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$WaterLevelPagesTableAnnotationComposer(
            $db: $db,
            $table: $db.waterLevelPages,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$WaterLevelPageItemsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $WaterLevelPageItemsTable,
          WaterLevelPageItem,
          $$WaterLevelPageItemsTableFilterComposer,
          $$WaterLevelPageItemsTableOrderingComposer,
          $$WaterLevelPageItemsTableAnnotationComposer,
          $$WaterLevelPageItemsTableCreateCompanionBuilder,
          $$WaterLevelPageItemsTableUpdateCompanionBuilder,
          (WaterLevelPageItem, $$WaterLevelPageItemsTableReferences),
          WaterLevelPageItem,
          PrefetchHooks Function({bool pageKey})
        > {
  $$WaterLevelPageItemsTableTableManager(
    _$AppDatabase db,
    $WaterLevelPageItemsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WaterLevelPageItemsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WaterLevelPageItemsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$WaterLevelPageItemsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> pageKey = const Value.absent(),
                Value<int> ordinal = const Value.absent(),
                Value<String> stationId = const Value.absent(),
                Value<String> sourceRecordKey = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => WaterLevelPageItemsCompanion(
                pageKey: pageKey,
                ordinal: ordinal,
                stationId: stationId,
                sourceRecordKey: sourceRecordKey,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String pageKey,
                required int ordinal,
                required String stationId,
                required String sourceRecordKey,
                Value<int> rowid = const Value.absent(),
              }) => WaterLevelPageItemsCompanion.insert(
                pageKey: pageKey,
                ordinal: ordinal,
                stationId: stationId,
                sourceRecordKey: sourceRecordKey,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$WaterLevelPageItemsTable, WaterLevelPageItem>(
                    table,
                  ),
                  $$WaterLevelPageItemsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({pageKey = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (pageKey) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.pageKey,
                                referencedTable:
                                    $$WaterLevelPageItemsTableReferences
                                        ._pageKeyTable(db),
                                referencedColumn:
                                    $$WaterLevelPageItemsTableReferences
                                        ._pageKeyTable(db)
                                        .cacheKey,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$WaterLevelPageItemsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $WaterLevelPageItemsTable,
      WaterLevelPageItem,
      $$WaterLevelPageItemsTableFilterComposer,
      $$WaterLevelPageItemsTableOrderingComposer,
      $$WaterLevelPageItemsTableAnnotationComposer,
      $$WaterLevelPageItemsTableCreateCompanionBuilder,
      $$WaterLevelPageItemsTableUpdateCompanionBuilder,
      (WaterLevelPageItem, $$WaterLevelPageItemsTableReferences),
      WaterLevelPageItem,
      PrefetchHooks Function({bool pageKey})
    >;
typedef $$CalendarDaysTableCreateCompanionBuilder =
    CalendarDaysCompanion Function({
      required String cacheKey,
      required int solarYear,
      required int solarMonth,
      required int solarDay,
      required int lunarYear,
      required int lunarMonth,
      required int lunarDay,
      required bool isLeapMonth,
      required String timeZone,
      required DateTime generatedAtUtc,
      required DateTime fetchedAtUtc,
      required int maxAgeSeconds,
      required int staleWhileRevalidateSeconds,
      Value<int> rowid,
    });
typedef $$CalendarDaysTableUpdateCompanionBuilder =
    CalendarDaysCompanion Function({
      Value<String> cacheKey,
      Value<int> solarYear,
      Value<int> solarMonth,
      Value<int> solarDay,
      Value<int> lunarYear,
      Value<int> lunarMonth,
      Value<int> lunarDay,
      Value<bool> isLeapMonth,
      Value<String> timeZone,
      Value<DateTime> generatedAtUtc,
      Value<DateTime> fetchedAtUtc,
      Value<int> maxAgeSeconds,
      Value<int> staleWhileRevalidateSeconds,
      Value<int> rowid,
    });

class $$CalendarDaysTableFilterComposer
    extends Composer<_$AppDatabase, $CalendarDaysTable> {
  $$CalendarDaysTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get solarYear => $composableBuilder(
    column: $table.solarYear,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get solarMonth => $composableBuilder(
    column: $table.solarMonth,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get solarDay => $composableBuilder(
    column: $table.solarDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get lunarYear => $composableBuilder(
    column: $table.lunarYear,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get lunarMonth => $composableBuilder(
    column: $table.lunarMonth,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get lunarDay => $composableBuilder(
    column: $table.lunarDay,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isLeapMonth => $composableBuilder(
    column: $table.isLeapMonth,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CalendarDaysTableOrderingComposer
    extends Composer<_$AppDatabase, $CalendarDaysTable> {
  $$CalendarDaysTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get solarYear => $composableBuilder(
    column: $table.solarYear,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get solarMonth => $composableBuilder(
    column: $table.solarMonth,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get solarDay => $composableBuilder(
    column: $table.solarDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get lunarYear => $composableBuilder(
    column: $table.lunarYear,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get lunarMonth => $composableBuilder(
    column: $table.lunarMonth,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get lunarDay => $composableBuilder(
    column: $table.lunarDay,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isLeapMonth => $composableBuilder(
    column: $table.isLeapMonth,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get timeZone => $composableBuilder(
    column: $table.timeZone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CalendarDaysTableAnnotationComposer
    extends Composer<_$AppDatabase, $CalendarDaysTable> {
  $$CalendarDaysTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get cacheKey =>
      $composableBuilder(column: $table.cacheKey, builder: (column) => column);

  GeneratedColumn<int> get solarYear =>
      $composableBuilder(column: $table.solarYear, builder: (column) => column);

  GeneratedColumn<int> get solarMonth => $composableBuilder(
    column: $table.solarMonth,
    builder: (column) => column,
  );

  GeneratedColumn<int> get solarDay =>
      $composableBuilder(column: $table.solarDay, builder: (column) => column);

  GeneratedColumn<int> get lunarYear =>
      $composableBuilder(column: $table.lunarYear, builder: (column) => column);

  GeneratedColumn<int> get lunarMonth => $composableBuilder(
    column: $table.lunarMonth,
    builder: (column) => column,
  );

  GeneratedColumn<int> get lunarDay =>
      $composableBuilder(column: $table.lunarDay, builder: (column) => column);

  GeneratedColumn<bool> get isLeapMonth => $composableBuilder(
    column: $table.isLeapMonth,
    builder: (column) => column,
  );

  GeneratedColumn<String> get timeZone =>
      $composableBuilder(column: $table.timeZone, builder: (column) => column);

  GeneratedColumn<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get fetchedAtUtc => $composableBuilder(
    column: $table.fetchedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<int> get maxAgeSeconds => $composableBuilder(
    column: $table.maxAgeSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get staleWhileRevalidateSeconds => $composableBuilder(
    column: $table.staleWhileRevalidateSeconds,
    builder: (column) => column,
  );
}

class $$CalendarDaysTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CalendarDaysTable,
          CalendarDay,
          $$CalendarDaysTableFilterComposer,
          $$CalendarDaysTableOrderingComposer,
          $$CalendarDaysTableAnnotationComposer,
          $$CalendarDaysTableCreateCompanionBuilder,
          $$CalendarDaysTableUpdateCompanionBuilder,
          (
            CalendarDay,
            BaseReferences<_$AppDatabase, $CalendarDaysTable, CalendarDay>,
          ),
          CalendarDay,
          PrefetchHooks Function()
        > {
  $$CalendarDaysTableTableManager(_$AppDatabase db, $CalendarDaysTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CalendarDaysTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CalendarDaysTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CalendarDaysTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<int> solarYear = const Value.absent(),
                Value<int> solarMonth = const Value.absent(),
                Value<int> solarDay = const Value.absent(),
                Value<int> lunarYear = const Value.absent(),
                Value<int> lunarMonth = const Value.absent(),
                Value<int> lunarDay = const Value.absent(),
                Value<bool> isLeapMonth = const Value.absent(),
                Value<String> timeZone = const Value.absent(),
                Value<DateTime> generatedAtUtc = const Value.absent(),
                Value<DateTime> fetchedAtUtc = const Value.absent(),
                Value<int> maxAgeSeconds = const Value.absent(),
                Value<int> staleWhileRevalidateSeconds = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CalendarDaysCompanion(
                cacheKey: cacheKey,
                solarYear: solarYear,
                solarMonth: solarMonth,
                solarDay: solarDay,
                lunarYear: lunarYear,
                lunarMonth: lunarMonth,
                lunarDay: lunarDay,
                isLeapMonth: isLeapMonth,
                timeZone: timeZone,
                generatedAtUtc: generatedAtUtc,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required int solarYear,
                required int solarMonth,
                required int solarDay,
                required int lunarYear,
                required int lunarMonth,
                required int lunarDay,
                required bool isLeapMonth,
                required String timeZone,
                required DateTime generatedAtUtc,
                required DateTime fetchedAtUtc,
                required int maxAgeSeconds,
                required int staleWhileRevalidateSeconds,
                Value<int> rowid = const Value.absent(),
              }) => CalendarDaysCompanion.insert(
                cacheKey: cacheKey,
                solarYear: solarYear,
                solarMonth: solarMonth,
                solarDay: solarDay,
                lunarYear: lunarYear,
                lunarMonth: lunarMonth,
                lunarDay: lunarDay,
                isLeapMonth: isLeapMonth,
                timeZone: timeZone,
                generatedAtUtc: generatedAtUtc,
                fetchedAtUtc: fetchedAtUtc,
                maxAgeSeconds: maxAgeSeconds,
                staleWhileRevalidateSeconds: staleWhileRevalidateSeconds,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$CalendarDaysTable, CalendarDay>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $CalendarDaysTable,
                    CalendarDay
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CalendarDaysTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CalendarDaysTable,
      CalendarDay,
      $$CalendarDaysTableFilterComposer,
      $$CalendarDaysTableOrderingComposer,
      $$CalendarDaysTableAnnotationComposer,
      $$CalendarDaysTableCreateCompanionBuilder,
      $$CalendarDaysTableUpdateCompanionBuilder,
      (
        CalendarDay,
        BaseReferences<_$AppDatabase, $CalendarDaysTable, CalendarDay>,
      ),
      CalendarDay,
      PrefetchHooks Function()
    >;
typedef $$FavoritesTableCreateCompanionBuilder =
    FavoritesCompanion Function({
      required String stationId,
      required DateTime createdAtUtc,
      Value<int> rowid,
    });
typedef $$FavoritesTableUpdateCompanionBuilder =
    FavoritesCompanion Function({
      Value<String> stationId,
      Value<DateTime> createdAtUtc,
      Value<int> rowid,
    });

class $$FavoritesTableFilterComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAtUtc => $composableBuilder(
    column: $table.createdAtUtc,
    builder: (column) => ColumnFilters(column),
  );
}

class $$FavoritesTableOrderingComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get stationId => $composableBuilder(
    column: $table.stationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAtUtc => $composableBuilder(
    column: $table.createdAtUtc,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FavoritesTableAnnotationComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get stationId =>
      $composableBuilder(column: $table.stationId, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAtUtc => $composableBuilder(
    column: $table.createdAtUtc,
    builder: (column) => column,
  );
}

class $$FavoritesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FavoritesTable,
          Favorite,
          $$FavoritesTableFilterComposer,
          $$FavoritesTableOrderingComposer,
          $$FavoritesTableAnnotationComposer,
          $$FavoritesTableCreateCompanionBuilder,
          $$FavoritesTableUpdateCompanionBuilder,
          (Favorite, BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>),
          Favorite,
          PrefetchHooks Function()
        > {
  $$FavoritesTableTableManager(_$AppDatabase db, $FavoritesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FavoritesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FavoritesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FavoritesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> stationId = const Value.absent(),
                Value<DateTime> createdAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FavoritesCompanion(
                stationId: stationId,
                createdAtUtc: createdAtUtc,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String stationId,
                required DateTime createdAtUtc,
                Value<int> rowid = const Value.absent(),
              }) => FavoritesCompanion.insert(
                stationId: stationId,
                createdAtUtc: createdAtUtc,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$FavoritesTable, Favorite>(table),
                  BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$FavoritesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FavoritesTable,
      Favorite,
      $$FavoritesTableFilterComposer,
      $$FavoritesTableOrderingComposer,
      $$FavoritesTableAnnotationComposer,
      $$FavoritesTableCreateCompanionBuilder,
      $$FavoritesTableUpdateCompanionBuilder,
      (Favorite, BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>),
      Favorite,
      PrefetchHooks Function()
    >;
typedef $$PreferencesTableCreateCompanionBuilder =
    PreferencesCompanion Function({
      required String key,
      required String jsonScalarValue,
      required DateTime updatedAtUtc,
      Value<int> rowid,
    });
typedef $$PreferencesTableUpdateCompanionBuilder =
    PreferencesCompanion Function({
      Value<String> key,
      Value<String> jsonScalarValue,
      Value<DateTime> updatedAtUtc,
      Value<int> rowid,
    });

class $$PreferencesTableFilterComposer
    extends Composer<_$AppDatabase, $PreferencesTable> {
  $$PreferencesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get jsonScalarValue => $composableBuilder(
    column: $table.jsonScalarValue,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAtUtc => $composableBuilder(
    column: $table.updatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PreferencesTableOrderingComposer
    extends Composer<_$AppDatabase, $PreferencesTable> {
  $$PreferencesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get jsonScalarValue => $composableBuilder(
    column: $table.jsonScalarValue,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAtUtc => $composableBuilder(
    column: $table.updatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PreferencesTableAnnotationComposer
    extends Composer<_$AppDatabase, $PreferencesTable> {
  $$PreferencesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get jsonScalarValue => $composableBuilder(
    column: $table.jsonScalarValue,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAtUtc => $composableBuilder(
    column: $table.updatedAtUtc,
    builder: (column) => column,
  );
}

class $$PreferencesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PreferencesTable,
          Preference,
          $$PreferencesTableFilterComposer,
          $$PreferencesTableOrderingComposer,
          $$PreferencesTableAnnotationComposer,
          $$PreferencesTableCreateCompanionBuilder,
          $$PreferencesTableUpdateCompanionBuilder,
          (
            Preference,
            BaseReferences<_$AppDatabase, $PreferencesTable, Preference>,
          ),
          Preference,
          PrefetchHooks Function()
        > {
  $$PreferencesTableTableManager(_$AppDatabase db, $PreferencesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PreferencesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PreferencesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PreferencesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> jsonScalarValue = const Value.absent(),
                Value<DateTime> updatedAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PreferencesCompanion(
                key: key,
                jsonScalarValue: jsonScalarValue,
                updatedAtUtc: updatedAtUtc,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String jsonScalarValue,
                required DateTime updatedAtUtc,
                Value<int> rowid = const Value.absent(),
              }) => PreferencesCompanion.insert(
                key: key,
                jsonScalarValue: jsonScalarValue,
                updatedAtUtc: updatedAtUtc,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$PreferencesTable, Preference>(table),
                  BaseReferences<_$AppDatabase, $PreferencesTable, Preference>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PreferencesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PreferencesTable,
      Preference,
      $$PreferencesTableFilterComposer,
      $$PreferencesTableOrderingComposer,
      $$PreferencesTableAnnotationComposer,
      $$PreferencesTableCreateCompanionBuilder,
      $$PreferencesTableUpdateCompanionBuilder,
      (
        Preference,
        BaseReferences<_$AppDatabase, $PreferencesTable, Preference>,
      ),
      Preference,
      PrefetchHooks Function()
    >;
typedef $$OfflineManifestsTableCreateCompanionBuilder =
    OfflineManifestsCompanion Function({
      required String packId,
      required String version,
      required int packSchemaVersion,
      required DateTime generatedAtUtc,
      required DateTime expiresAtUtc,
      required String checksum,
      required String contentSummaryJson,
      required String sourceSummaryJson,
      required String minimumAppVersion,
      required DateTime installedAtUtc,
      Value<int> rowid,
    });
typedef $$OfflineManifestsTableUpdateCompanionBuilder =
    OfflineManifestsCompanion Function({
      Value<String> packId,
      Value<String> version,
      Value<int> packSchemaVersion,
      Value<DateTime> generatedAtUtc,
      Value<DateTime> expiresAtUtc,
      Value<String> checksum,
      Value<String> contentSummaryJson,
      Value<String> sourceSummaryJson,
      Value<String> minimumAppVersion,
      Value<DateTime> installedAtUtc,
      Value<int> rowid,
    });

final class $$OfflineManifestsTableReferences
    extends
        BaseReferences<_$AppDatabase, $OfflineManifestsTable, OfflineManifest> {
  $$OfflineManifestsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static MultiTypedResultKey<$OfflinePackEntriesTable, List<OfflinePackEntry>>
  _offlinePackEntriesRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.offlinePackEntries,
        aliasName: 'offline_manifests__pack_id__offline_pack_entries__pack_id',
      );

  $$OfflinePackEntriesTableProcessedTableManager get offlinePackEntriesRefs {
    final manager =
        $$OfflinePackEntriesTableTableManager(
          $_db,
          $_db.offlinePackEntries,
        ).filter(
          (f) => f.packId.packId.sqlEquals($_itemColumn<String>('pack_id')!),
        );

    final cache = $_typedResult.readTableOrNull(
      _offlinePackEntriesRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$OfflineManifestsTableFilterComposer
    extends Composer<_$AppDatabase, $OfflineManifestsTable> {
  $$OfflineManifestsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get packId => $composableBuilder(
    column: $table.packId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get packSchemaVersion => $composableBuilder(
    column: $table.packSchemaVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get expiresAtUtc => $composableBuilder(
    column: $table.expiresAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get contentSummaryJson => $composableBuilder(
    column: $table.contentSummaryJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceSummaryJson => $composableBuilder(
    column: $table.sourceSummaryJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get minimumAppVersion => $composableBuilder(
    column: $table.minimumAppVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get installedAtUtc => $composableBuilder(
    column: $table.installedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> offlinePackEntriesRefs(
    Expression<bool> Function($$OfflinePackEntriesTableFilterComposer f) f,
  ) {
    final $$OfflinePackEntriesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.packId,
      referencedTable: $db.offlinePackEntries,
      getReferencedColumn: (t) => t.packId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OfflinePackEntriesTableFilterComposer(
            $db: $db,
            $table: $db.offlinePackEntries,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$OfflineManifestsTableOrderingComposer
    extends Composer<_$AppDatabase, $OfflineManifestsTable> {
  $$OfflineManifestsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get packId => $composableBuilder(
    column: $table.packId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get packSchemaVersion => $composableBuilder(
    column: $table.packSchemaVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get expiresAtUtc => $composableBuilder(
    column: $table.expiresAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get checksum => $composableBuilder(
    column: $table.checksum,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get contentSummaryJson => $composableBuilder(
    column: $table.contentSummaryJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceSummaryJson => $composableBuilder(
    column: $table.sourceSummaryJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get minimumAppVersion => $composableBuilder(
    column: $table.minimumAppVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get installedAtUtc => $composableBuilder(
    column: $table.installedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$OfflineManifestsTableAnnotationComposer
    extends Composer<_$AppDatabase, $OfflineManifestsTable> {
  $$OfflineManifestsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get packId =>
      $composableBuilder(column: $table.packId, builder: (column) => column);

  GeneratedColumn<String> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);

  GeneratedColumn<int> get packSchemaVersion => $composableBuilder(
    column: $table.packSchemaVersion,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get generatedAtUtc => $composableBuilder(
    column: $table.generatedAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get expiresAtUtc => $composableBuilder(
    column: $table.expiresAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<String> get checksum =>
      $composableBuilder(column: $table.checksum, builder: (column) => column);

  GeneratedColumn<String> get contentSummaryJson => $composableBuilder(
    column: $table.contentSummaryJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sourceSummaryJson => $composableBuilder(
    column: $table.sourceSummaryJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get minimumAppVersion => $composableBuilder(
    column: $table.minimumAppVersion,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get installedAtUtc => $composableBuilder(
    column: $table.installedAtUtc,
    builder: (column) => column,
  );

  Expression<T> offlinePackEntriesRefs<T extends Object>(
    Expression<T> Function($$OfflinePackEntriesTableAnnotationComposer a) f,
  ) {
    final $$OfflinePackEntriesTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.packId,
          referencedTable: $db.offlinePackEntries,
          getReferencedColumn: (t) => t.packId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$OfflinePackEntriesTableAnnotationComposer(
                $db: $db,
                $table: $db.offlinePackEntries,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$OfflineManifestsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $OfflineManifestsTable,
          OfflineManifest,
          $$OfflineManifestsTableFilterComposer,
          $$OfflineManifestsTableOrderingComposer,
          $$OfflineManifestsTableAnnotationComposer,
          $$OfflineManifestsTableCreateCompanionBuilder,
          $$OfflineManifestsTableUpdateCompanionBuilder,
          (OfflineManifest, $$OfflineManifestsTableReferences),
          OfflineManifest,
          PrefetchHooks Function({bool offlinePackEntriesRefs})
        > {
  $$OfflineManifestsTableTableManager(
    _$AppDatabase db,
    $OfflineManifestsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OfflineManifestsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OfflineManifestsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OfflineManifestsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> packId = const Value.absent(),
                Value<String> version = const Value.absent(),
                Value<int> packSchemaVersion = const Value.absent(),
                Value<DateTime> generatedAtUtc = const Value.absent(),
                Value<DateTime> expiresAtUtc = const Value.absent(),
                Value<String> checksum = const Value.absent(),
                Value<String> contentSummaryJson = const Value.absent(),
                Value<String> sourceSummaryJson = const Value.absent(),
                Value<String> minimumAppVersion = const Value.absent(),
                Value<DateTime> installedAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => OfflineManifestsCompanion(
                packId: packId,
                version: version,
                packSchemaVersion: packSchemaVersion,
                generatedAtUtc: generatedAtUtc,
                expiresAtUtc: expiresAtUtc,
                checksum: checksum,
                contentSummaryJson: contentSummaryJson,
                sourceSummaryJson: sourceSummaryJson,
                minimumAppVersion: minimumAppVersion,
                installedAtUtc: installedAtUtc,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String packId,
                required String version,
                required int packSchemaVersion,
                required DateTime generatedAtUtc,
                required DateTime expiresAtUtc,
                required String checksum,
                required String contentSummaryJson,
                required String sourceSummaryJson,
                required String minimumAppVersion,
                required DateTime installedAtUtc,
                Value<int> rowid = const Value.absent(),
              }) => OfflineManifestsCompanion.insert(
                packId: packId,
                version: version,
                packSchemaVersion: packSchemaVersion,
                generatedAtUtc: generatedAtUtc,
                expiresAtUtc: expiresAtUtc,
                checksum: checksum,
                contentSummaryJson: contentSummaryJson,
                sourceSummaryJson: sourceSummaryJson,
                minimumAppVersion: minimumAppVersion,
                installedAtUtc: installedAtUtc,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$OfflineManifestsTable, OfflineManifest>(table),
                  $$OfflineManifestsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({offlinePackEntriesRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [
                if (offlinePackEntriesRefs) db.offlinePackEntries,
              ],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (offlinePackEntriesRefs)
                    await $_getPrefetchedData<
                      OfflineManifest,
                      $OfflineManifestsTable,
                      OfflinePackEntry
                    >(
                      currentTable: table,
                      referencedTable: $$OfflineManifestsTableReferences
                          ._offlinePackEntriesRefsTable(db),
                      managerFromTypedResult: (p0) =>
                          $$OfflineManifestsTableReferences(
                            db,
                            table,
                            p0,
                          ).offlinePackEntriesRefs,
                      referencedItemsForCurrentItem: (item, referencedItems) =>
                          referencedItems.where((e) => e.packId == item.packId),
                      typedResults: items,
                    ),
                ];
              },
            );
          },
        ),
      );
}

typedef $$OfflineManifestsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $OfflineManifestsTable,
      OfflineManifest,
      $$OfflineManifestsTableFilterComposer,
      $$OfflineManifestsTableOrderingComposer,
      $$OfflineManifestsTableAnnotationComposer,
      $$OfflineManifestsTableCreateCompanionBuilder,
      $$OfflineManifestsTableUpdateCompanionBuilder,
      (OfflineManifest, $$OfflineManifestsTableReferences),
      OfflineManifest,
      PrefetchHooks Function({bool offlinePackEntriesRefs})
    >;
typedef $$OfflinePackEntriesTableCreateCompanionBuilder =
    OfflinePackEntriesCompanion Function({
      required String packId,
      required String entityType,
      required String entityKey,
      Value<int> rowid,
    });
typedef $$OfflinePackEntriesTableUpdateCompanionBuilder =
    OfflinePackEntriesCompanion Function({
      Value<String> packId,
      Value<String> entityType,
      Value<String> entityKey,
      Value<int> rowid,
    });

final class $$OfflinePackEntriesTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $OfflinePackEntriesTable,
          OfflinePackEntry
        > {
  $$OfflinePackEntriesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $OfflineManifestsTable _packIdTable(_$AppDatabase db) => db
      .offlineManifests
      .createAlias('offline_pack_entries__pack_id__offline_manifests__pack_id');

  $$OfflineManifestsTableProcessedTableManager get packId {
    final $_column = $_itemColumn<String>('pack_id')!;

    final manager = $$OfflineManifestsTableTableManager(
      $_db,
      $_db.offlineManifests,
    ).filter((f) => f.packId.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_packIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$OfflinePackEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $OfflinePackEntriesTable> {
  $$OfflinePackEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityKey => $composableBuilder(
    column: $table.entityKey,
    builder: (column) => ColumnFilters(column),
  );

  $$OfflineManifestsTableFilterComposer get packId {
    final $$OfflineManifestsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.packId,
      referencedTable: $db.offlineManifests,
      getReferencedColumn: (t) => t.packId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OfflineManifestsTableFilterComposer(
            $db: $db,
            $table: $db.offlineManifests,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$OfflinePackEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $OfflinePackEntriesTable> {
  $$OfflinePackEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityKey => $composableBuilder(
    column: $table.entityKey,
    builder: (column) => ColumnOrderings(column),
  );

  $$OfflineManifestsTableOrderingComposer get packId {
    final $$OfflineManifestsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.packId,
      referencedTable: $db.offlineManifests,
      getReferencedColumn: (t) => t.packId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OfflineManifestsTableOrderingComposer(
            $db: $db,
            $table: $db.offlineManifests,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$OfflinePackEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $OfflinePackEntriesTable> {
  $$OfflinePackEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get entityKey =>
      $composableBuilder(column: $table.entityKey, builder: (column) => column);

  $$OfflineManifestsTableAnnotationComposer get packId {
    final $$OfflineManifestsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.packId,
      referencedTable: $db.offlineManifests,
      getReferencedColumn: (t) => t.packId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$OfflineManifestsTableAnnotationComposer(
            $db: $db,
            $table: $db.offlineManifests,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$OfflinePackEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $OfflinePackEntriesTable,
          OfflinePackEntry,
          $$OfflinePackEntriesTableFilterComposer,
          $$OfflinePackEntriesTableOrderingComposer,
          $$OfflinePackEntriesTableAnnotationComposer,
          $$OfflinePackEntriesTableCreateCompanionBuilder,
          $$OfflinePackEntriesTableUpdateCompanionBuilder,
          (OfflinePackEntry, $$OfflinePackEntriesTableReferences),
          OfflinePackEntry,
          PrefetchHooks Function({bool packId})
        > {
  $$OfflinePackEntriesTableTableManager(
    _$AppDatabase db,
    $OfflinePackEntriesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OfflinePackEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OfflinePackEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OfflinePackEntriesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> packId = const Value.absent(),
                Value<String> entityType = const Value.absent(),
                Value<String> entityKey = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => OfflinePackEntriesCompanion(
                packId: packId,
                entityType: entityType,
                entityKey: entityKey,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String packId,
                required String entityType,
                required String entityKey,
                Value<int> rowid = const Value.absent(),
              }) => OfflinePackEntriesCompanion.insert(
                packId: packId,
                entityType: entityType,
                entityKey: entityKey,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$OfflinePackEntriesTable, OfflinePackEntry>(
                    table,
                  ),
                  $$OfflinePackEntriesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({packId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (packId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.packId,
                                referencedTable:
                                    $$OfflinePackEntriesTableReferences
                                        ._packIdTable(db),
                                referencedColumn:
                                    $$OfflinePackEntriesTableReferences
                                        ._packIdTable(db)
                                        .packId,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$OfflinePackEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $OfflinePackEntriesTable,
      OfflinePackEntry,
      $$OfflinePackEntriesTableFilterComposer,
      $$OfflinePackEntriesTableOrderingComposer,
      $$OfflinePackEntriesTableAnnotationComposer,
      $$OfflinePackEntriesTableCreateCompanionBuilder,
      $$OfflinePackEntriesTableUpdateCompanionBuilder,
      (OfflinePackEntry, $$OfflinePackEntriesTableReferences),
      OfflinePackEntry,
      PrefetchHooks Function({bool packId})
    >;
typedef $$SyncStatesTableCreateCompanionBuilder =
    SyncStatesCompanion Function({
      required String resourceKey,
      required String resourceKind,
      Value<DateTime?> lastAttemptAtUtc,
      Value<DateTime?> lastSuccessfulRefreshAtUtc,
      Value<String?> lastFailureKind,
      Value<DateTime?> latestRemoteGeneratedAtUtc,
      Value<DateTime?> latestObservedAtUtc,
      Value<int> rowid,
    });
typedef $$SyncStatesTableUpdateCompanionBuilder =
    SyncStatesCompanion Function({
      Value<String> resourceKey,
      Value<String> resourceKind,
      Value<DateTime?> lastAttemptAtUtc,
      Value<DateTime?> lastSuccessfulRefreshAtUtc,
      Value<String?> lastFailureKind,
      Value<DateTime?> latestRemoteGeneratedAtUtc,
      Value<DateTime?> latestObservedAtUtc,
      Value<int> rowid,
    });

class $$SyncStatesTableFilterComposer
    extends Composer<_$AppDatabase, $SyncStatesTable> {
  $$SyncStatesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get resourceKey => $composableBuilder(
    column: $table.resourceKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get resourceKind => $composableBuilder(
    column: $table.resourceKind,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastAttemptAtUtc => $composableBuilder(
    column: $table.lastAttemptAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSuccessfulRefreshAtUtc => $composableBuilder(
    column: $table.lastSuccessfulRefreshAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastFailureKind => $composableBuilder(
    column: $table.lastFailureKind,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get latestRemoteGeneratedAtUtc => $composableBuilder(
    column: $table.latestRemoteGeneratedAtUtc,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get latestObservedAtUtc => $composableBuilder(
    column: $table.latestObservedAtUtc,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncStatesTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncStatesTable> {
  $$SyncStatesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get resourceKey => $composableBuilder(
    column: $table.resourceKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get resourceKind => $composableBuilder(
    column: $table.resourceKind,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastAttemptAtUtc => $composableBuilder(
    column: $table.lastAttemptAtUtc,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSuccessfulRefreshAtUtc =>
      $composableBuilder(
        column: $table.lastSuccessfulRefreshAtUtc,
        builder: (column) => ColumnOrderings(column),
      );

  ColumnOrderings<String> get lastFailureKind => $composableBuilder(
    column: $table.lastFailureKind,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get latestRemoteGeneratedAtUtc =>
      $composableBuilder(
        column: $table.latestRemoteGeneratedAtUtc,
        builder: (column) => ColumnOrderings(column),
      );

  ColumnOrderings<DateTime> get latestObservedAtUtc => $composableBuilder(
    column: $table.latestObservedAtUtc,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncStatesTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncStatesTable> {
  $$SyncStatesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get resourceKey => $composableBuilder(
    column: $table.resourceKey,
    builder: (column) => column,
  );

  GeneratedColumn<String> get resourceKind => $composableBuilder(
    column: $table.resourceKind,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastAttemptAtUtc => $composableBuilder(
    column: $table.lastAttemptAtUtc,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSuccessfulRefreshAtUtc =>
      $composableBuilder(
        column: $table.lastSuccessfulRefreshAtUtc,
        builder: (column) => column,
      );

  GeneratedColumn<String> get lastFailureKind => $composableBuilder(
    column: $table.lastFailureKind,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get latestRemoteGeneratedAtUtc =>
      $composableBuilder(
        column: $table.latestRemoteGeneratedAtUtc,
        builder: (column) => column,
      );

  GeneratedColumn<DateTime> get latestObservedAtUtc => $composableBuilder(
    column: $table.latestObservedAtUtc,
    builder: (column) => column,
  );
}

class $$SyncStatesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncStatesTable,
          SyncState,
          $$SyncStatesTableFilterComposer,
          $$SyncStatesTableOrderingComposer,
          $$SyncStatesTableAnnotationComposer,
          $$SyncStatesTableCreateCompanionBuilder,
          $$SyncStatesTableUpdateCompanionBuilder,
          (
            SyncState,
            BaseReferences<_$AppDatabase, $SyncStatesTable, SyncState>,
          ),
          SyncState,
          PrefetchHooks Function()
        > {
  $$SyncStatesTableTableManager(_$AppDatabase db, $SyncStatesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncStatesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncStatesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncStatesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> resourceKey = const Value.absent(),
                Value<String> resourceKind = const Value.absent(),
                Value<DateTime?> lastAttemptAtUtc = const Value.absent(),
                Value<DateTime?> lastSuccessfulRefreshAtUtc =
                    const Value.absent(),
                Value<String?> lastFailureKind = const Value.absent(),
                Value<DateTime?> latestRemoteGeneratedAtUtc =
                    const Value.absent(),
                Value<DateTime?> latestObservedAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncStatesCompanion(
                resourceKey: resourceKey,
                resourceKind: resourceKind,
                lastAttemptAtUtc: lastAttemptAtUtc,
                lastSuccessfulRefreshAtUtc: lastSuccessfulRefreshAtUtc,
                lastFailureKind: lastFailureKind,
                latestRemoteGeneratedAtUtc: latestRemoteGeneratedAtUtc,
                latestObservedAtUtc: latestObservedAtUtc,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String resourceKey,
                required String resourceKind,
                Value<DateTime?> lastAttemptAtUtc = const Value.absent(),
                Value<DateTime?> lastSuccessfulRefreshAtUtc =
                    const Value.absent(),
                Value<String?> lastFailureKind = const Value.absent(),
                Value<DateTime?> latestRemoteGeneratedAtUtc =
                    const Value.absent(),
                Value<DateTime?> latestObservedAtUtc = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncStatesCompanion.insert(
                resourceKey: resourceKey,
                resourceKind: resourceKind,
                lastAttemptAtUtc: lastAttemptAtUtc,
                lastSuccessfulRefreshAtUtc: lastSuccessfulRefreshAtUtc,
                lastFailureKind: lastFailureKind,
                latestRemoteGeneratedAtUtc: latestRemoteGeneratedAtUtc,
                latestObservedAtUtc: latestObservedAtUtc,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$SyncStatesTable, SyncState>(table),
                  BaseReferences<_$AppDatabase, $SyncStatesTable, SyncState>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncStatesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncStatesTable,
      SyncState,
      $$SyncStatesTableFilterComposer,
      $$SyncStatesTableOrderingComposer,
      $$SyncStatesTableAnnotationComposer,
      $$SyncStatesTableCreateCompanionBuilder,
      $$SyncStatesTableUpdateCompanionBuilder,
      (SyncState, BaseReferences<_$AppDatabase, $SyncStatesTable, SyncState>),
      SyncState,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$StationsTableTableManager get stations =>
      $$StationsTableTableManager(_db, _db.stations);
  $$StationAliasesTableTableManager get stationAliases =>
      $$StationAliasesTableTableManager(_db, _db.stationAliases);
  $$LocationSearchPagesTableTableManager get locationSearchPages =>
      $$LocationSearchPagesTableTableManager(_db, _db.locationSearchPages);
  $$LocationSearchPageItemsTableTableManager get locationSearchPageItems =>
      $$LocationSearchPageItemsTableTableManager(
        _db,
        _db.locationSearchPageItems,
      );
  $$TideSeriesTableTableManager get tideSeries =>
      $$TideSeriesTableTableManager(_db, _db.tideSeries);
  $$TidePointsTableTableManager get tidePoints =>
      $$TidePointsTableTableManager(_db, _db.tidePoints);
  $$WaterLevelPagesTableTableManager get waterLevelPages =>
      $$WaterLevelPagesTableTableManager(_db, _db.waterLevelPages);
  $$WaterLevelObservationsTableTableManager get waterLevelObservations =>
      $$WaterLevelObservationsTableTableManager(
        _db,
        _db.waterLevelObservations,
      );
  $$WaterLevelPageItemsTableTableManager get waterLevelPageItems =>
      $$WaterLevelPageItemsTableTableManager(_db, _db.waterLevelPageItems);
  $$CalendarDaysTableTableManager get calendarDays =>
      $$CalendarDaysTableTableManager(_db, _db.calendarDays);
  $$FavoritesTableTableManager get favorites =>
      $$FavoritesTableTableManager(_db, _db.favorites);
  $$PreferencesTableTableManager get preferences =>
      $$PreferencesTableTableManager(_db, _db.preferences);
  $$OfflineManifestsTableTableManager get offlineManifests =>
      $$OfflineManifestsTableTableManager(_db, _db.offlineManifests);
  $$OfflinePackEntriesTableTableManager get offlinePackEntries =>
      $$OfflinePackEntriesTableTableManager(_db, _db.offlinePackEntries);
  $$SyncStatesTableTableManager get syncStates =>
      $$SyncStatesTableTableManager(_db, _db.syncStates);
}
