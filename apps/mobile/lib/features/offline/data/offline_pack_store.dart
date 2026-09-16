import 'package:connuoc_viet/features/offline/domain/offline_pack.dart';

abstract interface class OfflinePackStore {
  Future<List<OfflinePackManifest>> listManifests();

  Future<OfflinePackManifest?> getManifest(String packId);

  Future<void> replaceValidatedDataset(ValidatedOfflineDataset dataset);

  Future<void> remove(String packId);
}
