import type { FastifyInstance } from 'fastify';
import { describe, expect, it } from 'vitest';

import { createApiApp } from '../src/bootstrap.js';
import { parseApiEnvironment } from '../src/config/env.js';
import { buildOpenApiDocument } from '../src/openapi.js';

const testEnvironment = parseApiEnvironment({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '3000',
  LOG_LEVEL: 'silent',
});

describe('@connuoc/api foundation', () => {
  it('rejects invalid environment values', () => {
    expect(() => parseApiEnvironment({ API_PORT: '70000' })).toThrow();
  });

  it('serves liveness and readiness endpoints without external infrastructure', async () => {
    const app = await createApiApp(testEnvironment);
    await app.init();

    try {
      const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
      const health = await fastify.inject({ method: 'GET', url: '/v1/health' });
      const ready = await fastify.inject({ method: 'GET', url: '/v1/ready' });

      expect(health.statusCode).toBe(200);
      expect(health.json()).toEqual({ status: 'ok', service: '@connuoc/api' });
      expect(ready.statusCode).toBe(200);
      expect(ready.json()).toEqual({ status: 'ok', service: '@connuoc/api' });
    } finally {
      await app.close();
    }
  });

  it('documents all public Phase 2 endpoints in OpenAPI', async () => {
    const app = await createApiApp(testEnvironment);
    await app.init();

    try {
      const document = buildOpenApiDocument(app);
      const paths = Object.keys(document.paths);
      for (const expected of [
        '/health',
        '/locations/search',
        '/stations/{id}',
        '/stations/{id}/tide',
        '/stations/{id}/water-level',
        '/calendar',
      ]) {
        expect(paths.some((path) => path.endsWith(expected))).toBe(true);
      }
    } finally {
      await app.close();
    }
  });

  it('returns RFC-style problem details for invalid public queries and missing routes', async () => {
    const app = await createApiApp(testEnvironment);
    await app.init();

    try {
      const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
      const invalidDate = await fastify.inject({ method: 'GET', url: '/v1/calendar?date=not-a-date' });
      expect(invalidDate.statusCode).toBe(400);
      expect(invalidDate.headers['content-type']).toContain('application/problem+json');
      expect(invalidDate.json()).toMatchObject({ status: 400, instance: '/v1/calendar?date=not-a-date' });

      const missing = await fastify.inject({ method: 'GET', url: '/v1/does-not-exist' });
      expect(missing.statusCode).toBe(404);
      expect(missing.headers['content-type']).toContain('application/problem+json');
      expect(missing.json()).toMatchObject({
        type: 'about:blank',
        status: 404,
        instance: '/v1/does-not-exist',
      });
    } finally {
      await app.close();
    }
  });
});
