import type { Route } from './+types/api-status';
import { getStatusSnapshot } from '@entities/service-health/status.server';
import { methodNotAllowed } from '@shared/server/http';

export function loader({ request }: Route.LoaderArgs) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return methodNotAllowed('GET, HEAD');
  }

  return Response.json(getStatusSnapshot(), {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function action() {
  return methodNotAllowed('GET, HEAD');
}
