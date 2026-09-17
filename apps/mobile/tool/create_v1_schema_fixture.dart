import 'dart:io';

import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:drift/native.dart';

Future<void> main(List<String> arguments) async {
  if (arguments.length != 1) {
    stderr.writeln('usage: dart run tool/create_v1_schema_fixture.dart <path>');
    exitCode = 64;
    return;
  }

  final file = File(arguments.single);
  if (await file.exists()) {
    await file.delete();
  }
  await file.parent.create(recursive: true);

  final database = AppDatabase.forTesting(NativeDatabase(file));
  try {
    await database.customSelect('SELECT 1').get();
    await database.customStatement('DROP TABLE offline_pack_entries');
    await database.customStatement('DROP TABLE offline_manifests');
    await database.customStatement('DROP TABLE sync_states');
    await database.customStatement('PRAGMA user_version = 1');
  } finally {
    await database.close();
  }
}
