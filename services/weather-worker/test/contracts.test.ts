import { describe, expect, it } from 'vitest';

import { FixtureProviderAdapter } from '../src/fixture-provider.js';

const capabilities = ['weather.current', 'rainfall.forecast'] as const;

describe('weather/hydrology provider adapter foundation', () => {
  it('uses exact capability matching without aliases or prefix guessing', () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-1',
      providerKey: 'fixture-primary',
      capabilities,
      secretRef: 'secret://weather/fixture-primary',
    });

    expect(adapter.supports('weather.current')).toBe(true);
    expect(adapter.supports('rainfall.forecast')).toBe(true);
    expect(adapter.supports('weather.hourlyForecast')).toBe(false);
  });

  it('returns a deterministic redacted health probe', async () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-1',
      providerKey: 'fixture-primary',
      capabilities,
      secretRef: 'secret://weather/fixture-primary',
    });

    await expect(adapter.healthCheck()).resolves.toEqual({
      state: 'HEALTHY',
      latencyMs: 0,
      providerId: 'fixture-1',
      providerKey: 'fixture-primary',
      details: { fixture: true },
    });

    expect(JSON.stringify(await adapter.healthCheck())).not.toContain('secret://');
  });

  it('keeps secretRef as opaque context and never exposes it from probe results', async () => {
    const adapter = new FixtureProviderAdapter({
      providerId: 'fixture-secret',
      providerKey: 'fixture-secret-provider',
      capabilities: ['weather.current'],
      secretRef: 'vault://providers/weather/key-7',
    });

    const probe = await adapter.healthCheck();
    expect('secretRef' in probe).toBe(false);
    expect(JSON.stringify(probe)).not.toContain('vault://providers/weather/key-7');
  });
});
