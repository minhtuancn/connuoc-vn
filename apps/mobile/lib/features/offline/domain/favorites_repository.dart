abstract interface class FavoritesRepository {
  Future<List<String>> list();

  Stream<List<String>> watch();

  Future<void> add(String stationId);

  Future<void> remove(String stationId);
}
