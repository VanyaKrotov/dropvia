import { Outlet } from 'react-router';
import type { Route } from './+types/site';
import { Providers } from '@app/providers';
import { SiteFooter, SiteHeader } from '@widgets/site-shell/site-shell';

export function loader({ params }: Route.LoaderArgs) {
  if (params.lang && params.lang !== 'ru') {
    throw new Response(null, { status: 404 });
  }

  const locale: 'en' | 'ru' = params.lang === 'ru' ? 'ru' : 'en';

  return { locale };
}

export default function Site({ loaderData }: Route.ComponentProps) {
  return (
    <Providers key={loaderData.locale} locale={loaderData.locale}>
      <SiteHeader locale={loaderData.locale} />
      <main id="content" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter locale={loaderData.locale} />
    </Providers>
  );
}
