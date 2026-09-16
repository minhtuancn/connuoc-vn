import 'package:connuoc_viet/core/network/cache_policy.dart';

enum CacheFreshness { fresh, staleRevalidatable, expired }

CacheFreshness classifyFreshness(
  DateTime fetchedAtUtc,
  CachePolicy policy,
  DateTime now,
) {
  final fetched = fetchedAtUtc.toUtc();
  final current = now.toUtc();
  final freshUntil = fetched.add(policy.maxAge);

  if (!current.isAfter(freshUntil)) {
    return CacheFreshness.fresh;
  }

  final staleWhileRevalidateUntil = freshUntil.add(policy.staleWhileRevalidate);
  if (!current.isAfter(staleWhileRevalidateUntil)) {
    return CacheFreshness.staleRevalidatable;
  }

  return CacheFreshness.expired;
}

CacheFreshness classifyResourceFreshness<T>(
  RemoteResource<T> resource,
  DateTime now,
) {
  return classifyFreshness(resource.fetchedAtUtc, resource.cachePolicy, now);
}
