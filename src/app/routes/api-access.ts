import type { Route } from './+types/api-access';
import { submitAccessRequest } from '@features/request-access/api/submit.server';
import { methodNotAllowed } from '@shared/server/http';

export function action({ request }: Route.ActionArgs) {
  return submitAccessRequest(request);
}

export function loader() {
  return methodNotAllowed('POST');
}
