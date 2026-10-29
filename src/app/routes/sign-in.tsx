import { data } from 'react-router';
import type { Route } from './+types/sign-in';
import { submitSignIn } from '@features/sign-in/api/submit.server';
import { SignInPage } from '@pages/sign-in/sign-in-page';
import { createTranslations, localeFromPath, type Locale } from '@shared/i18n/config';
import { pageMetadata } from '@shared/seo/metadata';
import { SiteFooter } from '@widgets/site-shell/site-shell';
import { Providers } from '@app/providers';

const privateHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

function validateLanguage(lang: string | undefined): Locale {
  if (lang && lang !== 'ru') {
    throw new Response(null, { status: 404 });
  }

  return lang === 'ru' ? 'ru' : 'en';
}

export function loader({ params }: Route.LoaderArgs) {
  return data({ locale: validateLanguage(params.lang) }, { headers: privateHeaders });
}

export async function action({ request, params }: Route.ActionArgs) {
  const locale = validateLanguage(params.lang);
  const result = await submitSignIn(request);

  return data(
    {
      error: result.error,
      message: createTranslations(locale).t(`signIn.errors.${result.error}`),
      fieldErrors: result.fieldErrors ?? {},
    },
    {
      status: result.status,
      headers: {
        ...privateHeaders,
        ...(result.status === 405 ? { Allow: 'GET, HEAD, POST' } : {}),
      },
    },
  );
}

export function meta({ location, error }: Route.MetaArgs) {
  if (error) {
    return [];
  }

  return pageMetadata('signIn', localeFromPath(location.pathname));
}

export function headers({ actionHeaders }: Route.HeadersArgs) {
  const headers = new Headers(privateHeaders);
  const allow = actionHeaders.get('Allow');

  if (allow) {
    headers.set('Allow', allow);
  }

  return headers;
}

export default function SignInRoute({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <Providers key={loaderData.locale} locale={loaderData.locale}>
      <SignInPage
        error={actionData?.error ?? null}
        fieldErrors={actionData?.fieldErrors ?? {}}
      />
      <SiteFooter locale={loaderData.locale} />
    </Providers>
  );
}
