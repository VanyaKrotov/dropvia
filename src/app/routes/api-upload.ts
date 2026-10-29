import type { Route } from './+types/api-upload';
import { apiError, methodNotAllowed } from '@shared/server/http';

export function action({ request }: Route.ActionArgs) {
  return request.method === 'POST'
    ? apiError(403, 'ACCESS_RESTRICTED', 'Upload access requires an invitation.')
    : methodNotAllowed('POST');
}

export function loader() {
  return methodNotAllowed('POST');
}
