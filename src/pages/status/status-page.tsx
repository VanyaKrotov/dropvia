import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { parseISO, isValid } from 'date-fns';
import type { StatusSnapshot } from '@entities/service-health/model';
import { serviceStatusQuery } from '@entities/service-health/query';
import { Icon } from '@shared/ui/icon';

export function StatusPage({
  initialData,
  receivedAt,
}: {
  initialData: StatusSnapshot;
  receivedAt: number;
}) {
  const { t, i18n } = useTranslation();
  const query = useQuery(serviceStatusQuery(initialData, receivedAt));
  const snapshot = query.data;
  const healthy = snapshot.services.every((service) => service.state === 'operational');
  const date = parseISO(snapshot.checkedAt);
  const time = isValid(date)
    ? new Intl.DateTimeFormat(i18n.language === 'ru' ? 'ru-RU' : 'en-GB', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date)
    : '—';

  return (
    <div className="shell status-page">
      <header className="page-heading">
        <h1>{t('status.title')}</h1>
      </header>
      <section className="status-summary panel" aria-label={t('status.snapshot')}>
        <span className={`status-emblem ${healthy ? '' : 'is-degraded'}`}>
          <Icon name={healthy ? 'check' : 'refresh'} />
        </span>
        <div aria-live="polite">
          <h2>
            {t(
              query.isError
                ? 'status.stale'
                : healthy
                  ? 'status.operational'
                  : 'status.degraded',
            )}
          </h2>
        </div>
        <button
          className="button button-ghost"
          onClick={() => {
            void query.refetch();
          }}
          disabled={query.isFetching}
        >
          <Icon name="refresh" />
          {t('status.refresh')}
        </button>
      </section>
      {query.isError ? (
        <p className="status-error" role="alert">
          {t('status.error')}
        </p>
      ) : null}
      <div className="status-services">
        {snapshot.services.map((service) => (
          <div className="service-row" key={service.id}>
            <h3>{t(`status.${service.id}`)}</h3>
            <span className="service-latency muted" aria-label={t('status.response')}>
              {service.latencyMs} ms
            </span>
            <span
              className={`service-state ${service.state === 'degraded' ? 'is-degraded' : ''}`}
            >
              <span className="small-dot" aria-hidden="true" />
              {t(
                service.state === 'operational'
                  ? 'status.stateOperational'
                  : 'status.stateDegraded',
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="status-checked muted">
        {t('status.checked')}: <time dateTime={snapshot.checkedAt}>{time} UTC</time>
      </p>
      <aside className="status-help">
        <div>
          <h2>{t('status.help')}</h2>
        </div>
        <a
          className="button button-ghost"
          href={`mailto:support@dropvia.fun?subject=${encodeURIComponent(t('status.reportSubject'))}`}
        >
          {t('status.report')}
        </a>
      </aside>
    </div>
  );
}
