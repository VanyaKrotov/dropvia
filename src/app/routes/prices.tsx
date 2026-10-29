import type { Route } from './+types/prices';
import { localeFromPath } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { PricesPage } from '@pages/prices/prices-page';

export function meta({ location }: Route.MetaArgs) {
  return pageMetadata('prices', localeFromPath(location.pathname));
}

export default PricesPage;
