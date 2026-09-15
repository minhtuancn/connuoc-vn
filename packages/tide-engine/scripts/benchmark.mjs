import { performance } from 'node:perf_hooks';

const startedAt = performance.now();
let accumulator = 0;
for (let index = 0; index < 100_000; index += 1) {
  accumulator += Math.cos(index / 1_000);
}
const elapsedMs = performance.now() - startedAt;

console.log(JSON.stringify({
  benchmark: 'bootstrap-math-loop',
  issue: 7,
  iterations: 100_000,
  elapsedMs: Number(elapsedMs.toFixed(3)),
  checksum: Number(accumulator.toFixed(6)),
  note: 'Replace with tide prediction workloads when issue #5 provides the prediction API.',
}, null, 2));
