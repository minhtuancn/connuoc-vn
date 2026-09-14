# Public Web

Target: Next.js public website/PWA for searchable, shareable Con Nước Việt data.

## Responsibilities
- Landing/product education.
- Location/station search.
- Tide chart and calendar.
- Public map.
- Shareable deep links for station/date.
- Data-source/provenance display.
- Accessibility and responsive layouts.
- SEO-safe public location pages where appropriate.

## Proposed source layout

```text
src/
├── app/
├── features/
│   ├── locations/
│   ├── tide/
│   ├── calendar/
│   ├── map/
│   └── share/
├── components/
├── lib/
└── styles/
```

The public web is a client of API/domain contracts and must not query production database tables directly.
