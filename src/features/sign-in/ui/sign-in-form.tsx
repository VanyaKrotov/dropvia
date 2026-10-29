import { useState, type FormEvent } from 'react';
import { Form, Link, useNavigation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { localizedPath, type Locale } from '@shared/i18n/config';
import {
  validateSignInCredentials,
  type SignInError,
  type SignInFieldErrors,
} from '@features/sign-in/model/credentials';

export function SignInForm({
  error,
  serverFieldErrors,
}: {
  error: SignInError | null;
  serverFieldErrors: SignInFieldErrors;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'ru' ? 'ru' : 'en';
  const navigation = useNavigation();
  const pending = navigation.state === 'submitting';
  const [clientFieldErrors, setClientFieldErrors] = useState<SignInFieldErrors | null>(
    null,
  );
  const [hideServerError, setHideServerError] = useState(false);
  const fieldErrors: SignInFieldErrors = pending
    ? {}
    : (clientFieldErrors ?? serverFieldErrors);
  const visibleError =
    pending ||
    hideServerError ||
    (error === 'invalid' && (fieldErrors.email || fieldErrors.password))
      ? null
      : error;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const errors = validateSignInCredentials(
      Object.fromEntries(new FormData(event.currentTarget)),
    );

    if (errors.email || errors.password) {
      event.preventDefault();
      setClientFieldErrors(errors);
      setHideServerError(true);
      const field = event.currentTarget.elements.namedItem(
        errors.email ? 'email' : 'password',
      );

      if (field instanceof HTMLElement) {
        field.focus();
      }
    } else {
      setClientFieldErrors(null);
      setHideServerError(false);
    }
  }

  return (
    <>
      <Form
        method="post"
        action={localizedPath('/sign-in', locale)}
        className="sign-in-form"
        aria-busy={pending}
        noValidate
        onSubmit={handleSubmit}
        onChange={(event) => {
          setHideServerError(true);

          if (
            clientFieldErrors !== null ||
            serverFieldErrors.email ||
            serverFieldErrors.password
          ) {
            setClientFieldErrors(
              validateSignInCredentials(
                Object.fromEntries(new FormData(event.currentTarget)),
              ),
            );
          }
        }}
      >
        <div className="sign-in-field">
          <label htmlFor="sign-in-email">{t('signIn.email')}</label>
          <input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-required="true"
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'sign-in-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p
              className="form-error sign-in-field-error"
              id="sign-in-email-error"
              role="alert"
            >
              {t(`signIn.validation.${fieldErrors.email}`)}
            </p>
          ) : null}
        </div>
        <div className="sign-in-field">
          <label htmlFor="sign-in-password">{t('signIn.password')}</label>
          <input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-required="true"
            placeholder={t('signIn.passwordPlaceholder')}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'sign-in-password-error' : undefined}
          />
          {fieldErrors.password ? (
            <p
              className="form-error sign-in-field-error"
              id="sign-in-password-error"
              role="alert"
            >
              {t(`signIn.validation.${fieldErrors.password}`)}
            </p>
          ) : null}
        </div>
        {visibleError ? (
          <p className="form-error" id="sign-in-error" role="alert">
            {t(`signIn.errors.${visibleError}`)}
          </p>
        ) : null}
        <button type="submit" className="button button-submit" disabled={pending}>
          {t(pending ? 'signIn.pending' : 'common.signIn')}
        </button>
      </Form>
      <p className="sign-in-access">
        {t('signIn.noAccess')}{' '}
        <Link className="text-link" to={localizedPath('/', locale) + '#request-access'}>
          {t('common.request')}
        </Link>
      </p>
    </>
  );
}
