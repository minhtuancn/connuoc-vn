import { existsSync, statSync } from 'node:fs';

const required = [
  'README.md',
  'docs/PRD.md',
  'docs/ARCHITECTURE.md',
  'docs/ROADMAP.md',
  'docs/TODO.md',
  'docs/DATA-SOURCES.md',
  'docs/TIDE-ENGINE.md',
  'docs/DRAINAGE-ENGINE.md',
  'docs/LUNAR-CALENDAR.md',
  'docs/UI-UX.md',
  'docs/ACCESSIBILITY.md',
  'docs/OFFLINE.md',
  'docs/PDF-EXPORT.md',
  'docs/SECURITY-PRIVACY.md',
  'docs/TESTING.md',
  'docs/DEPLOYMENT.md',
];

const missing = required.filter(
  (file) => !existsSync(file) || statSync(file).size === 0,
);

if (missing.length) {
  console.error('Missing or empty foundation files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`Foundation check passed (${required.length} required files).`);
