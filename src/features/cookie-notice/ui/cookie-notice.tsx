import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useRevalidator } from 'react-router';
import { localizedPath, type Locale } from '@shared/i18n/config';

export function CookieNotice({
  acknowledged,
  locale,
}: {
  acknowledged: boolean;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const revalidator = useRevalidator();
  const mutation = useMutation({
    retry: false,
    // Mutation options also run if a navigation unmounts this particular notice.
    onSuccess: () => revalidator.revalidate(),
    mutationFn: async (body: URLSearchParams) => {
      const response = await fetch('/cookie-notice', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(15_000),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== 'object' ||
        result === null ||
        !('acknowledged' in result) ||
        result.acknowledged !== true
      ) {
        throw new Error('Cookie acknowledgement failed');
      }
    },
  });
  const visible = !acknowledged && !mutation.isSuccess;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mutation.isPending) {
      mutation.mutate(
        new URLSearchParams({
          acknowledge: 'yes',
          returnTo: location.pathname + location.search,
        }),
      );
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="cookie-notice"
          className="cookie-notice panel"
          aria-label={t('cookieNotice.label')}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="cookie-notice-copy">
            <p>
              {t('cookieNotice.message')}{' '}
              <Link className="underline" to={localizedPath('/privacy', locale)}>
                {t('cookieNotice.details')}
              </Link>
            </p>
            {mutation.isError && (
              <p className="cookie-notice-error" role="status">
                {t('cookieNotice.error')}
              </p>
            )}
          </div>
          <form method="post" action="/cookie-notice" onSubmit={submit}>
            <input type="hidden" name="acknowledge" value="yes" />
            <input
              type="hidden"
              name="returnTo"
              value={location.pathname + location.search}
            />
            <button type="submit" className="button" disabled={mutation.isPending}>
              {t('cookieNotice.accept')}
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
