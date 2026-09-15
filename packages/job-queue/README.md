# `@connuoc/job-queue`

Versioned queue contracts and BullMQ boundary for backend workers.

## Why this package exists

Workers import this package instead of inventing Redis/BullMQ conventions independently. Domain/core packages do not depend on it.

## Queue names

```text
source-ingestion.v1
tide-forecast.v1
notifications.v1
```

Dead-letter queues append `.dead-letter` to the versioned queue name.

## Idempotency

Every operational job carries an explicit `idempotencyKey`. `deterministicJobId()` hashes the queue name plus idempotency key into a BullMQ-safe SHA-256 job ID. The original idempotency key remains in the validated payload for database/provenance correlation.

Queue-level deduplication is a convenience guard; ingestion/database constraints remain the final consistency boundary.

## Retry/failure policy

Default jobs use:
- 5 attempts,
- exponential backoff starting at 5 seconds,
- failed jobs retained,
- latest 1,000 completed jobs retained.

`PermanentJobError` marks validation/configuration failures that should not be retried by worker policy. Other unexpected failures default to retryable. Workers must record/move terminal failures into the versioned dead-letter queue using the exported envelope contract.

Execution timeout policy is explicit per queue. BullMQ transport retry is not treated as a business-operation timeout; worker processors should enforce the exported timeout with cancellation/abort logic around source/network operations.

## Redis connection

`REDIS_URL` is mandatory for runtime queue connectivity and must use `redis://` or `rediss://`. `bullMqConnectionFromUrl()` owns URL parsing so individual workers do not duplicate credential/TLS/database parsing.

## Shutdown/readiness

- `probeQueue(queue)` waits for Redis connectivity.
- `closeQueueResources()` closes queues/workers gracefully during service shutdown.

## Local Redis

```bash
docker compose -f infrastructure/docker/compose.redis.yml up -d
export REDIS_URL=redis://localhost:6379
```

The compose profile pins the current Redis 8 Alpine baseline used by Phase 2 development; production credentials/network policy are deployment concerns and must not be committed.
