import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FileServer, StatusSnapshot } from '@entities/service-health/model';
import { serviceStatusQuery } from '@entities/service-health/query';
import { localizedPath, type Locale } from '@shared/i18n/config';
import { BrandMark } from '@shared/ui/brand-mark';
import { Icon } from '@shared/ui/icon';
import { LanguageSwitch } from '@shared/ui/language-switch';

export function FileServerPage({
  server,
  initialData,
  receivedAt,
}: {
  server: FileServer;
  initialData: StatusSnapshot;
  receivedAt: number;
}) {
  const { t, i18n } = useTranslation();
  const locale: Locale = i18n.language === 'ru' ? 'ru' : 'en';
  const query = useQuery(serviceStatusQuery(initialData, receivedAt));
  const service = query.data.services.find((item) => item.id === server.serviceId)!;
  const healthy = service.state === 'operational';
  const details = [
    ['node', server.code],
    ['role', t('fileServer.roleValue')],
    ['formats', t('fileServer.formatsValue')],
    ['access', t('fileServer.accessValue')],
    ['interface', 'HTTP API v1'],
  ] as const;

  return (
    <div className="file-server-shell">
      <header className="file-server-brand">
        <a
          className="wordmark"
          href={localizedPath('/', locale)}
          aria-label={`Dropvia · ${t('common.home')}`}
        >
          <BrandMark />
          Dropvia
        </a>
        <div className="file-server-tools">
          <span className="file-server-code">{server.code}</span>
          <LanguageSwitch locale={locale} />
        </div>
      </header>
      <main id="content" tabIndex={-1}>
        <header className="file-server-heading">
          <h1>{t('fileServer.title')}</h1>
          <p>{t('fileServer.description')}</p>
        </header>
        <section className="file-server-health" aria-label={t('fileServer.availability')}>
          <div
            className={`file-server-state ${healthy ? '' : 'is-degraded'}`}
            data-testid="file-server-health"
            role="status"
          >
            <Icon name={healthy ? 'check' : 'refresh'} />
            <span>{t(healthy ? 'status.stateOperational' : 'status.stateDegraded')}</span>
            <span className="file-server-latency">
              {t('status.response')}: {service.latencyMs} ms
            </span>
          </div>
          <p className="file-server-checked">
            {t('status.checked')}:{' '}
            <time dateTime={query.data.checkedAt}>{query.data.checkedAt}</time>
          </p>
          {query.isError ? (
            <p className="status-error" role="alert">
              {t('status.error')}
            </p>
          ) : null}
        </section>
        <div className="file-server-grid">
          <section className="file-server-card" aria-labelledby="node-heading">
            <h2 id="node-heading">{t('fileServer.details')}</h2>
            <dl>
              {details.map(([key, value]) => (
                <div key={key}>
                  <dt>{t(`fileServer.${key}`)}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <nav
            className="file-server-card file-server-links"
            aria-label={t('fileServer.links')}
          >
            <h2>{t('fileServer.links')}</h2>
            <a href={localizedPath('/', locale)}>
              {t('fileServer.home')}
              <Icon name="arrow" />
            </a>
            <a href={localizedPath('/api/', locale)}>
              {t('fileServer.api')}
              <Icon name="arrow" />
            </a>
            <a href={localizedPath('/status', locale)}>
              {t('status.title')}
              <Icon name="arrow" />
            </a>
            <a href="mailto:support@dropvia.fun">
              {t('fileServer.support')}
              <Icon name="arrow" />
            </a>
          </nav>
        </div>
      </main>
    </div>
  );
}
