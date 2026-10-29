import type { Route } from './+types/privacy';
import { localeFromPath } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { LegalPage } from '@pages/legal/legal-page';

export function meta({ location, error }: Route.MetaArgs) {
  if (error) {
    return [];
  }

  return pageMetadata('privacy', localeFromPath(location.pathname));
}

export default function Privacy() {
  return <LegalPage policy="privacy" />;
}
