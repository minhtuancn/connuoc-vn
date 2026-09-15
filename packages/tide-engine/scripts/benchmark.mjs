import { performance } from 'node:perf_hooks';

import { predictTide } from '../dist/index.js';

const model = {
  modelId: 'benchmark-harmonic-v1',
  modelVersion: '1',
  stationId: 'station:synthetic-benchmark',
  datumId: 'datum:synthetic-zero',
  unit: 'm',
  meanLevel: 1.15,
  phaseConvention: 'cosine_lag_degrees',
  referenceEpochUtc: '2026-01-01T00:00:00Z',
  constituents: [
    { name: 'M2', amplitude: 0.82, phaseDegrees: 181.3, speedDegreesPerHour: 28.984104 },
    { name: 'S2', amplitude: 0.31, phaseDegrees: 180.1, speedDegreesPerHour: 30.0 },
    { name: 'N2', amplitude: 0.21, phaseDegrees: 155.0, speedDegreesPerHour: 28.43973 },
    { name: 'K2', amplitude: 0.08, phaseDegrees: 170.6, speedDegreesPerHour: 30.082138 },
    { name: 'K1', amplitude: 0.42, phaseDegrees: 219.6, speedDegreesPerHour: 15.041069 },
    { name: 'O1', amplitude: 0.28, phaseDegrees: 203.5, speedDegreesPerHour: 13.943035 },
    { name: 'P1', amplitude: 0.13, phaseDegrees: 215.8, speedDegreesPerHour: 14.958931 },
    { name: 'Q1', amplitude: 0.06, phaseDegrees: 194.8, speedDegreesPerHour: 13.398661 },
    { name: 'M4', amplitude: 0.05, phaseDegrees: 272.7, speedDegreesPerHour: 57.96821 },
    { name: 'MS4', amplitude: 0.03, phaseDegrees: 264.0, speedDegreesPerHour: 58.984104 },
    { name: 'SA', amplitude: 0.04, phaseDegrees: 198.5, speedDegreesPerHour: 0.0410686 },
    { name: 'SSA', amplitude: 0.02, phaseDegrees: 264.6, speedDegreesPerHour: 0.0821373 }
  ]
};

const workloads = [
  { name: '24h-10min', days: 1 },
  { name: '7d-10min', days: 7 },
  { name: '30d-10min', days: 30 }
];

const runsPerWorkload = 9;

function checksum(points) {
  return Number(points.reduce((sum, point) => sum + point.value, 0).toFixed(9));
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function requestFor(days) {
  const start = Date.parse('2026-09-01T00:00:00Z');
  return {
    model,
    startUtc: new Date(start).toISOString(),
    endUtc: new Date(start + days * 86_400_000).toISOString(),
    intervalSeconds: 600,
    timeZone: 'Asia/Ho_Chi_Minh'
  };
}

const results = [];

for (const workload of workloads) {
  const request = requestFor(workload.days);

  // Warm-up JIT/module paths before measuring.
  predictTide(request);

  const elapsed = [];
  let expectedPointCount;
  let expectedChecksum;

  for (let run = 0; run < runsPerWorkload; run += 1) {
    const startedAt = performance.now();
    const prediction = predictTide(request);
    const elapsedMs = performance.now() - startedAt;
    const actualChecksum = checksum(prediction.points);

    if (expectedPointCount === undefined) {
      expectedPointCount = prediction.points.length;
      expectedChecksum = actualChecksum;
    } else if (prediction.points.length !== expectedPointCount || actualChecksum !== expectedChecksum) {
      throw new Error(`Non-deterministic benchmark output for ${workload.name}`);
    }

    elapsed.push(elapsedMs);
  }

  const medianMs = median(elapsed);
  results.push({
    workload: workload.name,
    days: workload.days,
    intervalSeconds: request.intervalSeconds,
    constituentCount: model.constituents.length,
    pointCount: expectedPointCount,
    runs: runsPerWorkload,
    medianMs: Number(medianMs.toFixed(3)),
    pointsPerSecond: Number(((expectedPointCount / medianMs) * 1000).toFixed(0)),
    checksum: expectedChecksum
  });
}

console.log(JSON.stringify({
  benchmark: 'tide-prediction-fixed-frequency',
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  method: 'warm-up once; median of 9 runs; no machine-specific pass/fail threshold',
  results
}, null, 2));
