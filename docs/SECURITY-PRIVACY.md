# Security & Privacy

## Security principles

- Least privilege.
- Validate all external data.
- Keep deterministic domain logic separated from ingestion/UI.
- Audit administrative data changes.
- No secrets in source control or mobile bundles beyond public identifiers.
- Defense in depth for admin and source-ingestion features.

## Authentication

Core public reading should not require an account.

Accounts may be used for:
- synced favorites,
- private drainage sites,
- notifications,
- community contributions,
- sensor/device ownership.

Admin requires strong authentication and RBAC.

## Authorization roles

Suggested:

```text
viewer
data_editor
data_reviewer
operator
admin
```

Sensitive mutations require audit events including actor, timestamp, entity, before/after metadata or change reference.

## Secrets

Store at runtime through secret management/environment configuration.
Never commit:
- database passwords,
- API keys,
- signing keys,
- APNs/FCM secrets,
- store credentials.

## External ingestion threats

Source adapters must defend against:
- SSRF,
- oversized payloads,
- malformed content,
- parser bombs,
- unexpected redirects,
- injection into logs/database,
- duplicate/replay payloads.

Configurable URLs should be allowlisted/validated by policy.

## API protections

- Input validation at boundary.
- Rate limiting.
- Request size limits.
- Safe pagination maximums.
- CORS policy.
- Security headers.
- Auth brute-force protection.
- Structured errors without secret leakage.

## Mobile

- Store auth tokens in Keychain/Keystore-backed secure storage.
- Do not trust client-calculated privileged/admin results.
- Certificate pinning only if operational tradeoffs are understood; not mandatory by default.
- Minimize permissions.

## Location privacy

Location permission is optional.
Manual location/station selection must remain available.

If precise device location is used:
- request only at point of need,
- explain purpose,
- avoid unnecessary server retention,
- allow revocation and manual use.

## Personal data minimization

Do not collect data simply because it may be useful later.
Separate:
- anonymous public usage,
- optional account profile,
- private sites/favorites,
- community public contributions,
- telemetry/analytics consent where required.

## Account deletion

If accounts ship, implement deletion before store release and define retention exceptions for security/legal/audit purposes.

## Community content

If photo/location/community reporting ships:
- explicit visibility controls,
- moderation/reporting,
- metadata stripping where appropriate,
- abuse prevention,
- retention policy.

## IoT security

Future sensor support must include:
- unique device identity,
- rotating/revocable credentials,
- TLS,
- per-device authorization,
- replay protection where practical,
- secure provisioning,
- firmware/device version metadata.

No remote gate actuation is in initial scope.

## Supply chain

CI should add where supported:
- dependency vulnerability scan,
- secret scan,
- lockfile enforcement,
- pinned/controlled GitHub Actions versions,
- artifact integrity/signing strategy for releases.

## Privacy documents before production

- Privacy Policy.
- Data Safety/App Privacy declarations.
- Terms/Disclaimer.
- Account deletion policy if applicable.
- Community content policy if applicable.
- Data retention schedule.

## Incident readiness

Before production:
- security contact/process,
- credential rotation runbook,
- backup restore procedure,
- incident severity levels,
- source corruption rollback strategy,
- ability to disable a bad source/forecast run quickly.
