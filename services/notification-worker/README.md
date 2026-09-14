# Notification Worker

Background worker for user-configured tide/drainage/weather notifications.

## Responsibilities
- Evaluate scheduled/condition-based notification rules.
- Respect user lead time, quiet hours and timezone.
- Deduplicate alerts.
- Deliver through FCM/APNs adapters.
- Track delivery outcome without storing unnecessary message content.

Notifications must include the data timestamp/context when safety-relevant and should avoid presenting stale recommendations as current.
