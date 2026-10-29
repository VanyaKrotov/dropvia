import type { Route } from './+types/api-files';
import { apiError, methodNotAllowed } from '@shared/server/http';

export function loader({ request }: Route.LoaderArgs) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return methodNotAllowed('GET, HEAD, DELETE');
  }

  return apiError(
    404,
    'FILE_NOT_FOUND',
    'The file is unavailable or you do not have access.',
  );
}

export function action({ request }: Route.ActionArgs) {
  return request.method === 'DELETE'
    ? apiError(403, 'ACCESS_RESTRICTED', 'File changes require an invitation.')
    : methodNotAllowed('GET, HEAD, DELETE');
}
