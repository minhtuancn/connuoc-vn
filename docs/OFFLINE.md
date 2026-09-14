# Offline Strategy

## Goal

Core usage should remain useful when network is unavailable or unreliable.

## Offline-capable data

- Favorite station metadata.
- Harmonic constituents where redistribution is allowed.
- Precomputed tide series when required.
- Vietnamese lunar calendar data/algorithm.
- Recent observed/forecast levels with clear stale timestamps.
- User favorites/settings.
- Downloaded region metadata.
- Limited map data only when licensing/storage strategy is approved.

## Mobile storage

Recommended: SQLite via Drift or an equivalent mature local database.

Suggested local tables:

```text
stations
rivers
estuaries
sluices
tide_predictions
water_level_cache
calendar_cache
offline_manifests
favorites
sync_state
```

## Region pack

Each downloadable region pack must include:

```text
regionId
version
schemaVersion
generatedAt
expiresAt
checksum
contentSummary
sourceSummary
minimumAppVersion
```

Apply updates atomically: download → validate checksum/schema → write staged data → commit manifest.

## Sync behavior

Use stale-while-revalidate:
1. Render cached data quickly.
2. Show age/freshness.
3. Refresh in background when online.
4. Replace cache only after validation succeeds.
5. Keep last-known-good data on source failure.

## Stale data UX

Never label cached stale values as live.

Example:

```text
Dữ liệu đã lưu
Cập nhật lần cuối: 18:20 hôm qua
Kết nối mạng để tải dữ liệu mới.
```

Drainage recommendations use stricter freshness rules and may become `INSUFFICIENT_DATA` even when cached values remain viewable.

## Offline tide calculation

Preferred when license/model permits:
- constituents stored locally,
- tide engine computes requested range on device,
- model/data version is visible.

Fallback:
- precomputed prediction windows downloaded from backend.

## Storage management

User must be able to:
- see downloaded regions and size,
- delete packs,
- set Wi-Fi-only downloads,
- refresh manually,
- understand expiration/staleness.

## Security

Do not cache admin tokens or unnecessary sensitive account data. Store authentication secrets using platform secure storage.

## Tests

- clean install offline,
- downloaded region offline,
- interrupted download,
- corrupt manifest/checksum,
- old schema version,
- backend unavailable,
- device clock/timezone changes,
- low-storage behavior.
