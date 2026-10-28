import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from 'react-router';
import stylesheet from './styles/app.css?url';
import { localeFromPath } from './lib/i18n';

export function links() {
  return [
    { rel: 'stylesheet', href: stylesheet },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  const locale = localeFromPath(useLocation().pathname);
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#05060f" />
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

  return (
    <main
      id="content"
      tabIndex={-1}
      className="page-shell grid min-h-dvh content-center gap-6 py-16"
    >
      <title>{`${title} — Dropvia`}</title>
      <meta name="robots" content="noindex, nofollow" />
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
