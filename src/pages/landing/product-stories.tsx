import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Icon } from '@shared/ui/icon';
import { localeFromPath, localizedPath } from '@shared/i18n/config';
import { PricingPlans } from '@widgets/pricing/pricing';
import { SafariToolbar } from '@widgets/file-scene/browser-frames';

export function PlatformGrid() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? 'ru' : 'en';

  return (
    <section
      className="shell landing-section platform-section"
      id="platform"
      aria-labelledby="platform-title"
    >
      <div className="section-heading">
        <h2 id="platform-title">{t('landing.platform.title')}</h2>
        <p>{t('landing.platform.body')}</p>
      </div>
      <div className="platform-grid">
        <article className="platform-card">
          <h3>{t('landing.collection.title')}</h3>
          <p>{t('landing.collection.body')}</p>
          <div className="platform-visual category-visual" data-reveal="rise">
            {(['documents', 'photos', 'projects'] as const).map((item, index) => (
              <div key={item}>
                <Icon name={index === 0 ? 'file' : index === 1 ? 'image' : 'folder'} />
                <span>{t(`landing.collection.${item}`)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="platform-card">
          <h3>{t('landing.sharing.title')}</h3>
          <p>{t('landing.sharing.body')}</p>
          <div className="platform-visual handoff-visual" data-reveal="rise">
            <div className="handoff-file">
              <Icon name="file" />
              <span>{t('landing.sharing.document')}</span>
            </div>
            <div className="handoff-link">
              <Icon name="link" />
              <span>{t('landing.sharing.linkLabel')}</span>
            </div>
            <p>
              {t('landing.sharing.sender')}
              <Icon name="arrow" />
              {t('landing.sharing.recipient')}
            </p>
          </div>
        </article>
        <article className="platform-card">
          <h3>{t('landing.platform.browserTitle')}</h3>
          <p>{t('landing.platform.browserBody')}</p>
          <div className="platform-visual browser-detail" data-reveal="rise">
            <SafariToolbar />
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet={`/images/dashboard/desktop-dark-${locale}-800.webp`}
              />
              <img
                src={`/images/dashboard/desktop-light-${locale}-800.webp`}
                width={800}
                height={500}
                loading="lazy"
                decoding="async"
                alt={t('landing.preview.desktopAlt')}
              />
            </picture>
          </div>
        </article>
        <article className="platform-card">
          <h3>{t('landing.platform.appearanceTitle')}</h3>
          <p>{t('landing.platform.appearanceBody')}</p>
          <div
            className="platform-visual appearance-visual"
            data-reveal="rise"
            aria-hidden="true"
          >
            <div className="appearance-light">
              <span>Aa</span>
              <span>EN / RU</span>
              <span className="appearance-lines" />
            </div>
            <div className="appearance-dark">
              <span>Aa</span>
              <span>EN / RU</span>
              <span className="appearance-lines" />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function EverydayStory() {
  const { t } = useTranslation();

  return (
    <section
      className="shell landing-section everyday-section"
      id="everyday"
      aria-labelledby="everyday-title"
    >
      <div className="section-heading">
        <h2 id="everyday-title">{t('landing.everyday.title')}</h2>
        <p>{t('landing.everyday.body')}</p>
      </div>
      <div className="use-case-grid">
        {(['personal', 'study', 'work'] as const).map((item, index) => (
          <article key={item}>
            <div
              className="use-case-visual"
              data-reveal="rise"
              data-reveal-delay={index * 60}
              aria-hidden="true"
            >
              <Icon name={index === 0 ? 'image' : index === 1 ? 'file' : 'folder'} />
              <span className="use-case-sheet" />
              <span className="use-case-sheet" />
            </div>
            <h3>{t(`landing.everyday.${item}`)}</h3>
            <p>{t(`landing.everyday.${item}Body`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ServiceBand() {
  const { t } = useTranslation();
  const locale = localeFromPath(useLocation().pathname);

  return (
    <section
      className="shell landing-section service-overview"
      id="service-overview"
      aria-labelledby="service-overview-title"
    >
      <div className="service-overview-inner">
        <div>
          <h2 id="service-overview-title">{t('landing.service.title')}</h2>
          <p>{t('landing.service.body')}</p>
        </div>
        <nav className="service-resources" aria-label={t('landing.service.title')}>
          <Link className="service-resource" to={localizedPath('/status', locale)}>
            <span>{t('common.allServices')}</span>
            <Icon name="arrow" />
          </Link>
          <a className="service-resource" href="mailto:support@dropvia.fun">
            <span>
              {t('common.support')}
              <span className="service-resource-note">support@dropvia.fun</span>
            </span>
            <Icon name="arrow" />
          </a>
        </nav>
      </div>
    </section>
  );
}

export function PlansBand() {
  const { t } = useTranslation();
  const locale = localeFromPath(useLocation().pathname);

  return (
    <section
      className="shell landing-section plans-overview"
      id="landing-plans"
      aria-labelledby="landing-plans-title"
    >
      <div className="section-heading">
        <h2 id="landing-plans-title">{t('landing.plans.title')}</h2>
        <p>{t('landing.plans.body')}</p>
        <Link className="text-link" to={localizedPath('/prices', locale)}>
          {t('landing.everyday.cta')}
          <Icon name="arrow" />
        </Link>
      </div>
      <PricingPlans
        actionIcon={<Icon name="arrowDown" />}
        headingLevel={3}
        comparisonHref={localizedPath('/prices', locale) + '#plan-comparison'}
      />
      <p className="plan-billing-note">{t('prices.detail')}</p>
    </section>
  );
}
