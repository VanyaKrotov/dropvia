import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('process-local public status snapshot', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('retains timestamps, states and latencies until the minute expires', async () => {
    const { getStatusSnapshot } = await import('@entities/service-health/status.server');
    const first = getStatusSnapshot();

    vi.advanceTimersByTime(59_999);
    expect(getStatusSnapshot()).toEqual(first);
    vi.advanceTimersByTime(1);
    expect(getStatusSnapshot().checkedAt).toBe('2026-10-29T12:01:00.000Z');
  });

  it('prevents a consumer from mutating the cached public snapshot', async () => {
    const { getStatusSnapshot } = await import('@entities/service-health/status.server');
    const first = getStatusSnapshot();
    const original = JSON.stringify(first);

    first.services[0]!.latencyMs = 99999;
    first.services.pop();
    expect(JSON.stringify(getStatusSnapshot())).toBe(original);
  });
});
