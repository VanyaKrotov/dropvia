import { describe, expect, it } from 'vitest';
import { createStatusSnapshot } from '@entities/service-health/status.server';
import { parseStatus } from '@entities/service-health/model';

describe('service snapshots', () => {
  it('keeps the complete system healthy for random values below .89', () => {
    const snapshot = createStatusSnapshot(() => 0.889);

    expect(snapshot.services.every((item) => item.state === 'operational')).toBe(true);
  });
  it('degrades exactly one component at the .89 boundary', () => {
    const snapshot = createStatusSnapshot(() => 0.89);

    expect(snapshot.services.filter((item) => item.state === 'degraded')).toHaveLength(1);
  });
  it('produces 89 healthy whole snapshots per 100 uniform buckets', () => {
    let healthy = 0;

    for (let i = 0; i < 100; i++) {
      const snapshot = createStatusSnapshot(() => i / 100);

      if (snapshot.services.every((item) => item.state === 'operational')) {
        healthy++;
      }
    }

    expect(healthy).toBe(89);
  });
  it('rejects incomplete and invalid external status data', () => {
    expect(() => parseStatus({ checkedAt: 'invalid', services: [] })).toThrow();
    const snapshot = createStatusSnapshot(() => 0);

    expect(() =>
      parseStatus({
        ...snapshot,
        services: snapshot.services.map(() => snapshot.services[0]),
      }),
    ).toThrow();
    expect(() =>
      parseStatus({
        ...snapshot,
        services: snapshot.services.map((service) => ({ ...service, latencyMs: NaN })),
      }),
    ).toThrow();
  });
  it('requires a valid ISO timestamp with an explicit time zone', () => {
    const snapshot = createStatusSnapshot(() => 0);

    for (const checkedAt of [
      '1',
      'October 28, 2026',
      '2026-10-28T12:00:00',
      '2026-02-30T12:00:00Z',
    ]) {
      expect(() => parseStatus({ ...snapshot, checkedAt })).toThrow();
    }

    for (const checkedAt of [
      '2026-10-28T12:00:00.000Z',
      '2026-10-28T12:00:00Z',
      '2026-10-28T14:00:00+02:00',
    ]) {
      expect(parseStatus({ ...snapshot, checkedAt }).checkedAt).toBe(checkedAt);
    }
  });
});
