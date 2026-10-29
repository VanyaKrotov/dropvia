import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { SignInError, SignInFieldErrors } from '@features/sign-in/model/credentials';
import { SignInForm } from '@features/sign-in/ui/sign-in-form';
import { localizedPath, type Locale } from '@shared/i18n/config';
import { BrandMark } from '@shared/ui/brand-mark';
import { LanguageSwitch } from '@shared/ui/language-switch';

export function SignInPage({
  error,
  fieldErrors,
}: {
  error: SignInError | null;
  fieldErrors: SignInFieldErrors;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'ru' ? 'ru' : 'en';

  return (
    <>
      <header className="sign-in-header shell">
        <Link
          className="wordmark"
          to={localizedPath('/', locale)}
          aria-label={`Dropvia · ${t('common.home')}`}
        >
          <BrandMark />
          Dropvia
        </Link>
        <LanguageSwitch locale={locale} />
      </header>
      <main id="content" tabIndex={-1} className="sign-in-main">
        <section className="sign-in-card" aria-labelledby="sign-in-heading">
          <header className="sign-in-copy">
            <h1 id="sign-in-heading">{t('signIn.title')}</h1>
            <p>{t('signIn.description')}</p>
          </header>
          <SignInForm error={error} serverFieldErrors={fieldErrors} />
        </section>
      </main>
    </>
  );
}
