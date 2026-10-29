import { isValid, parseISO } from 'date-fns';

export const serviceIds = [
  'api',
  'authentication',
  'download-01',
  'download-02',
] as const;

export type ServiceId = (typeof serviceIds)[number];

export const fileServers = [
  { code: 'D01', serviceId: 'download-01' },
  { code: 'D02', serviceId: 'download-02' },
] as const satisfies readonly { code: string; serviceId: ServiceId }[];

export type FileServer = (typeof fileServers)[number];

export type ServiceState = 'operational' | 'degraded';

export interface StatusSnapshot {
  checkedAt: string;
  services: { id: ServiceId; state: ServiceState; latencyMs: number }[];
}

export function parseStatus(value: unknown): StatusSnapshot {
  if (
    !value ||
    typeof value !== 'object' ||
    !('checkedAt' in value) ||
    typeof value.checkedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      value.checkedAt,
    ) ||
    !isValid(parseISO(value.checkedAt)) ||
    !('services' in value) ||
    !Array.isArray(value.services) ||
    value.services.length !== serviceIds.length
  ) {
    throw new Error('Invalid status response');
  }

  const services = value.services.map(
    (item: unknown): StatusSnapshot['services'][number] => {
      if (
        !item ||
        typeof item !== 'object' ||
        !('id' in item) ||
        !serviceIds.some((id) => id === item.id) ||
        !('state' in item) ||
        (item.state !== 'operational' && item.state !== 'degraded') ||
        !('latencyMs' in item) ||
        typeof item.latencyMs !== 'number' ||
        !Number.isFinite(item.latencyMs) ||
        item.latencyMs < 0
      ) {
        throw new Error('Invalid service response');
      }

      return { id: item.id as ServiceId, state: item.state, latencyMs: item.latencyMs };
    },
  );

  if (new Set(services.map((item) => item.id)).size !== serviceIds.length) {
    throw new Error('Duplicate services');
  }

  return { checkedAt: value.checkedAt, services };
}
