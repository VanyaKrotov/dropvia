import { data } from 'react-router';
import type { Route } from './+types/file-server';
import { fileServers } from '@entities/service-health/model';
import { getStatusSnapshot } from '@entities/service-health/status.server';
import { createTranslations, localeFromPath, type Locale } from '@shared/i18n/config';
import { FileServerPage } from '@pages/file-server/file-server-page';
import { SiteFooter } from '@widgets/site-shell/site-shell';
import { Providers } from '@app/providers';

const technicalHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

export function loader({ params }: Route.LoaderArgs) {
  if (params.lang && params.lang !== 'ru') {
    throw new Response(null, { status: 404 });
  }

  const server = fileServers.find((item) => item.code === params.uuid);

  if (!server) {
    throw new Response(null, { status: 404 });
  }

  const locale: Locale = params.lang === 'ru' ? 'ru' : 'en';

  return data(
    { server, locale, snapshot: getStatusSnapshot(), receivedAt: Date.now() },
    { headers: technicalHeaders },
  );
}

export function headers() {
  return technicalHeaders;
}

export function meta({ location, params }: Route.MetaArgs) {
  const t = createTranslations(localeFromPath(location.pathname)).t;

  return [
    {
      title: `${t('fileServer.title')} · ${params.uuid}`,
    },
    { name: 'description', content: t('fileServer.description') },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function FileServerRoute({ loaderData }: Route.ComponentProps) {
  return (
    <Providers key={loaderData.locale} locale={loaderData.locale}>
      <FileServerPage
        server={loaderData.server}
        initialData={loaderData.snapshot}
        receivedAt={loaderData.receivedAt}
      />
      <SiteFooter locale={loaderData.locale} />
    </Providers>
  );
}
