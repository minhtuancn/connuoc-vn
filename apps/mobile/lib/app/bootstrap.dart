import 'package:connuoc_viet/app/app.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void bootstrapApp() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: ConNuocApp()));
}
