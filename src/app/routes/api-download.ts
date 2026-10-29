import type { Route } from './+types/api-download';
import { apiError, methodNotAllowed } from '@shared/server/http';

export function loader({ request }: Route.LoaderArgs) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return methodNotAllowed('GET, HEAD');
  }

  return apiError(
    404,
    'FILE_NOT_FOUND',
    'The file is unavailable or the link has expired.',
  );
}

export function action() {
  return methodNotAllowed('GET, HEAD');
}
