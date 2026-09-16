import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:connuoc_viet/features/public_data/data/http_public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

final Provider<http.Client> httpClientProvider = Provider<http.Client>((ref) {
  final client = http.Client();
  ref.onDispose(client.close);
  return client;
});

final Provider<PublicDataRepository> publicDataRepositoryProvider =
    Provider<PublicDataRepository>((ref) {
      return HttpPublicDataRepository(
        config: ref.watch(appConfigProvider),
        client: ref.watch(httpClientProvider),
      );
    });
