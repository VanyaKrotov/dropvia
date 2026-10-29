import type { Route } from './+types/home';
import { data } from 'react-router';
import { localeFromPath } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { submitAccessRequest } from '@features/request-access/api/submit.server';
import { LandingPage } from '@pages/landing/landing-page';

export function meta({ location, error }: Route.MetaArgs) {
  if (error) {
    return [];
  }

  return pageMetadata('home', localeFromPath(location.pathname));
}

export async function action({ request }: Route.ActionArgs) {
  const response = await submitAccessRequest(request);

  return data(
    { ok: response.status === 201, status: response.status },
    {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store',
        ...(response.status === 405 ? { Allow: 'GET, HEAD, POST' } : {}),
      },
    },
  );
}

export function headers({ actionHeaders }: Route.HeadersArgs) {
  return actionHeaders;
}

export default function Home() {
  return <LandingPage />;
}
