import 'package:connuoc_viet/core/database/cache_freshness.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('cache freshness', () {
    const policy = CachePolicy(
      maxAge: Duration(minutes: 10),
      staleWhileRevalidate: Duration(minutes: 20),
    );
    final fetchedAtUtc = DateTime.utc(2026, 9, 16);

    test('moves from fresh to stale-revalidatable to expired', () {
      expect(
        classifyFreshness(
          fetchedAtUtc,
          policy,
          DateTime.utc(2026, 9, 16, 0, 5),
        ),
        CacheFreshness.fresh,
      );
      expect(
        classifyFreshness(
          fetchedAtUtc,
          policy,
          DateTime.utc(2026, 9, 16, 0, 15),
        ),
        CacheFreshness.staleRevalidatable,
      );
      expect(
        classifyFreshness(
          fetchedAtUtc,
          policy,
          DateTime.utc(2026, 9, 16, 0, 31),
        ),
        CacheFreshness.expired,
      );
    });

    test('boundary instants remain in the earlier state', () {
      expect(
        classifyFreshness(
          fetchedAtUtc,
          policy,
          DateTime.utc(2026, 9, 16, 0, 10),
        ),
        CacheFreshness.fresh,
      );
      expect(
        classifyFreshness(
          fetchedAtUtc,
          policy,
          DateTime.utc(2026, 9, 16, 0, 30),
        ),
        CacheFreshness.staleRevalidatable,
      );
    });

    test('zero policy expires immediately after fetch time', () {
      const zeroPolicy = CachePolicy(
        maxAge: Duration.zero,
        staleWhileRevalidate: Duration.zero,
      );

      expect(
        classifyFreshness(fetchedAtUtc, zeroPolicy, fetchedAtUtc),
        CacheFreshness.fresh,
      );
      expect(
        classifyFreshness(
          fetchedAtUtc,
          zeroPolicy,
          fetchedAtUtc.add(const Duration(microseconds: 1)),
        ),
        CacheFreshness.expired,
      );
    });

    test('classification never mutates the resource fetched timestamp', () {
      final resource = RemoteResource<String>(
        value: 'cached',
        fetchedAtUtc: fetchedAtUtc,
        cachePolicy: policy,
      );

      classifyResourceFreshness(resource, DateTime.utc(2026, 9, 16, 0, 15));

      expect(resource.fetchedAtUtc, fetchedAtUtc);
    });
  });
}
