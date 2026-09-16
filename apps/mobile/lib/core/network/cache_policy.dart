class CachePolicy {
  const CachePolicy({
    required this.maxAge,
    required this.staleWhileRevalidate,
  });

  factory CachePolicy.parse(String? headerValue) {
    var maxAge = Duration.zero;
    var staleWhileRevalidate = Duration.zero;

    for (final rawDirective in (headerValue ?? '').split(',')) {
      final directive = rawDirective.trim();
      if (directive.isEmpty) {
        continue;
      }

      final separator = directive.indexOf('=');
      if (separator < 0) {
        continue;
      }

      final name = directive.substring(0, separator).trim().toLowerCase();
      final rawValue = directive.substring(separator + 1).trim();
      final seconds = int.tryParse(rawValue);
      if (seconds == null || seconds < 0) {
        continue;
      }

      if (name == 'max-age') {
        maxAge = Duration(seconds: seconds);
      } else if (name == 'stale-while-revalidate') {
        staleWhileRevalidate = Duration(seconds: seconds);
      }
    }

    return CachePolicy(
      maxAge: maxAge,
      staleWhileRevalidate: staleWhileRevalidate,
    );
  }

  final Duration maxAge;
  final Duration staleWhileRevalidate;
}

class RemoteResource<T> {
  const RemoteResource({
    required this.value,
    required this.fetchedAtUtc,
    required this.cachePolicy,
  });

  final T value;
  final DateTime fetchedAtUtc;
  final CachePolicy cachePolicy;
}
