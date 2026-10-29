import { serviceIds, type StatusSnapshot } from '@entities/service-health/model';

// Public synthetic telemetry only. No user, locale or authentication data is cached.
let cachedSnapshot: StatusSnapshot | undefined;

export function getStatusSnapshot(): StatusSnapshot {
  const now = Date.now();
  const age = cachedSnapshot ? now - Date.parse(cachedSnapshot.checkedAt) : Infinity;

  if (!cachedSnapshot || age < 0 || age >= 60_000) {
    cachedSnapshot = createStatusSnapshot(Math.random, new Date(now));
  }

  return {
    checkedAt: cachedSnapshot.checkedAt,
    services: cachedSnapshot.services.map((service) => ({ ...service })),
  };
}

export function createStatusSnapshot(
  random: () => number = Math.random,
  now = new Date(),
): StatusSnapshot {
  const healthy = random() < 0.89;
  const affected = healthy
    ? -1
    : Math.min(serviceIds.length - 1, Math.floor(random() * serviceIds.length));

  return {
    checkedAt: now.toISOString(),
    services: serviceIds.map((id, index) => ({
      id,
      state: index === affected ? 'degraded' : 'operational',
      latencyMs: Math.round((index === affected ? 400 : 24) + random() * 80),
    })),
  };
}
