import type { Route } from './+types/api';
import { localeFromPath } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { ApiPage } from '@pages/api/api-page';

export function meta({ location }: Route.MetaArgs) {
  return pageMetadata('api', localeFromPath(location.pathname));
}

export default ApiPage;
