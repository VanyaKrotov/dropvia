import { queryOptions } from '@tanstack/react-query';
import { parseStatus, type StatusSnapshot } from '@entities/service-health/model';

export function serviceStatusQuery(initialData: StatusSnapshot, receivedAt: number) {
  return queryOptions({
    queryKey: ['service-status'],
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/v1/status', {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Status unavailable');
      }

      return parseStatus((await response.json()) as unknown);
    },
    initialData,
    initialDataUpdatedAt: receivedAt,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
