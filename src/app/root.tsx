import type { ReactNode } from 'react';
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';
import type { Route } from './+types/root';
import { isCookieNoticeAcknowledged } from '@features/cookie-notice/api/notice.server';
import stylesheet from '@app/styles/site.css?url';
import { localeFromPath } from '@shared/i18n/config';
import { pageSeo } from '@shared/seo/metadata';

const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };

export async function loader({ request }: Route.LoaderArgs) {
  return data(
    { cookieNoticeAcknowledged: await isCookieNoticeAcknowledged(request) },
    {
      headers: privateHeaders,
    },
  );
}

export function headers() {
  return privateHeaders;
}

export function links() {
  return [
    { rel: 'stylesheet', href: stylesheet },
    {
      rel: 'icon',
      type: 'image/x-icon',
      sizes: '16x16 32x32 48x48',
      href: '/favicon.ico',
    },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/svg+xml', sizes: 'any', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  const locale = localeFromPath(useLocation().pathname);

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#05060f" media="(prefers-color-scheme: dark)" />
        <meta
          name="theme-color"
          content="#f6f8fc"
          media="(prefers-color-scheme: light)"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <a className="skip-link" href="#content">
          {locale === 'en' ? 'Skip to content' : 'К содержимому'}
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const missing = isRouteErrorResponse(error) && error.status === 404;
  const locale = localeFromPath(useLocation().pathname);
  const copy =
    locale === 'en'
      ? {
          missingTitle: 'Page not found',
          errorTitle: 'Unable to open this page',
          missingBody: 'Check the address or return to the Dropvia home page.',
          errorBody: 'Try refreshing this page or return home.',
          home: 'Go home',
        }
      : {
          missingTitle: 'Страница не найдена',
          errorTitle: 'Не удалось открыть страницу',
          missingBody: 'Проверьте адрес или вернитесь на главную страницу Dropvia.',
          errorBody: 'Попробуйте обновить страницу или вернитесь на главную.',
          home: 'На главную',
        };
  const title = missing ? copy.missingTitle : copy.errorTitle;
  const seo = pageSeo(missing ? 'notFound' : 'error', locale);

  return (
    <main
      id="content"
      tabIndex={-1}
      className="page-shell grid min-h-dvh content-center gap-6 py-16"
    >
      <title>{seo.title}</title>
      {seo.tags.map((tag) => (
        <meta key={'name' in tag ? tag.name : tag.property} {...tag} />
      ))}
      <h1 className="text-heading font-medium text-ink">{title}</h1>
      <p className="max-w-copy text-body">
        {missing ? copy.missingBody : copy.errorBody}
      </p>
      <a className="pill-link w-fit" href={locale === 'en' ? '/' : '/ru'}>
        {copy.home}
      </a>
    </main>
  );
}
