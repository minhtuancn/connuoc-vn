abstract interface class SyncStateStore {
  Future<void> recordAttempt({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
  });

  Future<void> recordSuccess({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    DateTime? latestRemoteGeneratedAtUtc,
    DateTime? latestObservedAtUtc,
  });

  Future<void> recordFailure({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    required String failureKind,
  });
}
