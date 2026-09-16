class JsonContractException implements Exception {
  const JsonContractException(this.path, this.message);

  final String path;
  final String message;

  @override
  String toString() => 'JsonContractException($path): $message';
}

Never _fail(String path, String message) {
  throw JsonContractException(path, message);
}

Map<String, Object?> readObject(Object? value, String path) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    try {
      return value.cast<String, Object?>();
    } on TypeError {
      _fail(path, 'expected an object with string keys');
    }
  }
  _fail(path, 'expected an object');
}

List<Object?> readList(Object? value, String path) {
  if (value is List<Object?>) {
    return value;
  }
  if (value is List) {
    return value.cast<Object?>();
  }
  _fail(path, 'expected an array');
}

Object? readRequired(Map<String, Object?> json, String key, String path) {
  if (!json.containsKey(key)) {
    _fail('$path.$key', 'required field is missing');
  }
  return json[key];
}

String readString(Map<String, Object?> json, String key, String path) {
  final value = readRequired(json, key, path);
  if (value is String) {
    return value;
  }
  _fail('$path.$key', 'expected a string');
}

String? readNullableString(Map<String, Object?> json, String key, String path) {
  final value = readRequired(json, key, path);
  if (value == null || value is String) {
    return value as String?;
  }
  _fail('$path.$key', 'expected a string or null');
}

double readDouble(Map<String, Object?> json, String key, String path) {
  final value = readRequired(json, key, path);
  if (value is num) {
    return value.toDouble();
  }
  _fail('$path.$key', 'expected a number');
}

int readInt(Map<String, Object?> json, String key, String path) {
  final value = readRequired(json, key, path);
  if (value is int) {
    return value;
  }
  _fail('$path.$key', 'expected an integer');
}

bool readBool(Map<String, Object?> json, String key, String path) {
  final value = readRequired(json, key, path);
  if (value is bool) {
    return value;
  }
  _fail('$path.$key', 'expected a boolean');
}

DateTime readInstant(Map<String, Object?> json, String key, String path) {
  return parseInstant(readString(json, key, path), '$path.$key');
}

DateTime? readNullableInstant(
  Map<String, Object?> json,
  String key,
  String path,
) {
  final value = readRequired(json, key, path);
  if (value == null) {
    return null;
  }
  if (value is! String) {
    _fail('$path.$key', 'expected an ISO-8601 instant or null');
  }
  return parseInstant(value, '$path.$key');
}

DateTime parseInstant(String value, String path) {
  final hasExplicitZone =
      value.endsWith('Z') || RegExp(r'[+-]\d{2}:\d{2}$').hasMatch(value);
  if (!hasExplicitZone) {
    _fail(path, 'instant must include an explicit UTC offset');
  }

  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    _fail(path, 'expected a valid ISO-8601 instant');
  }
  return parsed.toUtc();
}

List<String> readStringList(
  Map<String, Object?> json,
  String key,
  String path,
) {
  final values = readList(readRequired(json, key, path), '$path.$key');
  return List<String>.unmodifiable(
    values.indexed.map((entry) {
      final (index, value) = entry;
      if (value is! String) {
        _fail('$path.$key[$index]', 'expected a string');
      }
      return value;
    }),
  );
}
