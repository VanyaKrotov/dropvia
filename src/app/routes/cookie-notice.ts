import type { Route } from './+types/cookie-notice';
import { acknowledgeCookieNotice } from '@features/cookie-notice/api/notice.server';

export function action({ request }: Route.ActionArgs) {
  return acknowledgeCookieNotice(request);
}

export function loader({ request }: Route.LoaderArgs) {
  return acknowledgeCookieNotice(request);
}
