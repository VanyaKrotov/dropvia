import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useActionData, useLocation } from 'react-router';
import { localizedPath, localeFromPath } from '@shared/i18n/config';
import {
  requestLimits,
  type AccessRequest,
} from '@features/request-access/model/request';

export function RequestAccess() {
  const { t } = useTranslation();
  const locale = localeFromPath(useLocation().pathname);
  const actionData = useActionData<{ ok: boolean; status: number }>();
  const [invalid, setInvalid] = useState(false);
  const mutation = useMutation({
    mutationFn: async (payload: AccessRequest) => {
      const response = await fetch('/api/v1/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.status !== 201) {
        throw new Error(
          response.status === 422 ? 'VALIDATION_ERROR' : 'Request rejected',
        );
      }
    },
  });
  const success = mutation.isSuccess || actionData?.ok === true;
  const hasError = mutation.isError || actionData?.ok === false;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending) {
      return;
    }

    const fields = new FormData(event.currentTarget);

    mutation.mutate({
      name: String(fields.get('name') ?? '').trim(),
      email: String(fields.get('email') ?? '').trim(),
      organization: String(fields.get('organization') ?? '').trim(),
      needs: String(fields.get('needs') ?? '').trim(),
      consent: fields.get('consent') === 'on',
    });
  }

  return (
    <section
      className="request-section shell section"
      id="request-access"
      aria-labelledby="request-heading"
    >
      {success ? null : (
        <div className="request-copy">
          <h2 id="request-heading">{t('request.title')}</h2>
          <p>{t('request.body')}</p>
        </div>
      )}
      <div className="request-form">
        {success ? (
          <div className="success-message" role="status" aria-atomic="true">
            <span className="success-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 4 4L19 6" pathLength={1} />
              </svg>
            </span>
            <h2 id="request-heading">{t('request.success')}</h2>
            <p>{t('request.successBody')}</p>
          </div>
        ) : (
          <form
            method="post"
            action={localizedPath('/', locale) + '?index#request-access'}
            onSubmit={submit}
            onInvalid={() => setInvalid(true)}
            onChange={() => setInvalid(false)}
          >
            <div className="request-fields">
              <div className="request-field">
                <label htmlFor="request-name">{t('request.name')}</label>
                <input
                  id="request-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={requestLimits.name}
                  placeholder={t('request.namePlaceholder')}
                />
              </div>
              <div className="request-field">
                <label htmlFor="request-email">{t('request.email')}</label>
                <input
                  id="request-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  maxLength={requestLimits.email}
                  placeholder={t('request.emailPlaceholder')}
                  required
                  aria-describedby="email-hint"
                  onBlur={(event) => setInvalid(!event.currentTarget.validity.valid)}
                />
                <p className="field-hint" id="email-hint">
                  {t('request.hint')}
                </p>
              </div>
              <div className="request-field request-organization">
                <label htmlFor="request-organization">
                  {t('request.organization')}{' '}
                  <span className="field-optional">{t('request.optional')}</span>
                </label>
                <input
                  id="request-organization"
                  name="organization"
                  autoComplete="organization"
                  maxLength={requestLimits.organization}
                  placeholder={t('request.organizationPlaceholder')}
                />
              </div>
              <div className="request-field request-needs">
                <label htmlFor="request-needs">{t('request.needs')}</label>
                <textarea
                  id="request-needs"
                  name="needs"
                  autoComplete="off"
                  rows={2}
                  required
                  maxLength={requestLimits.needs}
                  placeholder={t('request.needsPlaceholder')}
                  aria-describedby="needs-hint"
                />
                <p className="field-hint" id="needs-hint">
                  {t('request.needsHint')}
                </p>
              </div>
            </div>
            <div aria-live="polite">
              {invalid ? <p className="form-error">{t('request.invalid')}</p> : null}
              {hasError ? (
                <p className="form-error" role="alert">
                  {t(
                    mutation.error?.message === 'VALIDATION_ERROR'
                      ? 'request.invalid'
                      : 'request.error',
                  )}
                </p>
              ) : null}
            </div>
            <div className="request-form-footer">
              <label className="consent">
                <input type="checkbox" name="consent" required />
                <span>
                  {t('request.consentBefore')}{' '}
                  <Link to={localizedPath('/terms', locale)}>{t('common.terms')}</Link>{' '}
                  {t('request.consentAnd')}{' '}
                  <Link to={localizedPath('/privacy', locale)}>
                    {t('common.privacy')}
                  </Link>
                  .
                </span>
              </label>
              <button
                type="submit"
                className="button button-submit"
                disabled={mutation.isPending}
              >
                {t(mutation.isPending ? 'request.pending' : 'request.button')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
