import type { Route } from './+types/status';
import { getStatusSnapshot } from '@entities/service-health/status.server';
import { localeFromPath } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { StatusPage } from '@pages/status/status-page';

export function meta({ location }: Route.MetaArgs) {
  return pageMetadata('status', localeFromPath(location.pathname));
}

export function headers() {
  return { 'Cache-Control': 'no-store' };
}

export function loader() {
  return { snapshot: getStatusSnapshot(), receivedAt: Date.now() };
}

export default function Status({ loaderData }: Route.ComponentProps) {
  return (
    <StatusPage initialData={loaderData.snapshot} receivedAt={loaderData.receivedAt} />
  );
}
