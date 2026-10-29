import type { Route } from './+types/terms';
import { localeFromPath } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { LegalPage } from '@pages/legal/legal-page';

export function meta({ location }: Route.MetaArgs) {
  return pageMetadata('terms', localeFromPath(location.pathname));
}

export default function Terms() {
  return <LegalPage policy="terms" />;
}
