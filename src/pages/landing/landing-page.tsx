import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { localeFromPath, localizedPath } from '@shared/i18n/config';
import { FileScene } from '@widgets/file-scene/file-scene';
import { RequestAccess } from '@features/request-access/ui/request-access';
import { Icon } from '@shared/ui/icon';
import { CodeWindow } from '@shared/ui/code-window';
import { AccordionItem } from '@shared/ui/accordion-item';
import {
  PlatformGrid,
  EverydayStory,
  ServiceBand,
  PlansBand,
} from '@pages/landing/product-stories';
import { FileExperience } from '@pages/landing/file-experience';
import { useLandingMotion } from '@pages/landing/use-landing-motion';

export function LandingPage() {
  const { t } = useTranslation();
  const locale = localeFromPath(useLocation().pathname);
  const { scope, reducedMotion } = useLandingMotion();

  return (
    <div className="landing-page" ref={scope}>
      <section className="hero shell">
        <div className="hero-illumination" aria-hidden="true" />
        <h1 className="display skywash">{t('landing.title')}</h1>
        <p className="hero-description">{t('landing.description')}</p>
        <div className="hero-actions">
          <a className="button" href="#request-access">
            {t('common.request')}
            <Icon name="arrowDown" />
          </a>
          <a className="button button-ghost" href="#product">
            {t('landing.secondary')}
          </a>
        </div>
        <FileScene />
      </section>
      <ul className="shell file-kind-strip" aria-label={t('landing.fileKinds.label')}>
        {(['documents', 'photos', 'projects', 'archives'] as const).map((key) => (
          <li key={key}>{t(`landing.fileKinds.${key}`)}</li>
        ))}
      </ul>
      <section className="shell landing-section product-section" id="product">
        <div className="section-heading">
          <h2>{t('landing.intro')}</h2>
          <p>{t('landing.introBody')}</p>
        </div>
        <div className="feature-columns">
          {(['keep', 'share', 'retrieve'] as const).map((key, i) => (
            <article
              className="feature-column"
              key={key}
              data-reveal="fade"
              data-reveal-delay={i * 70}
            >
              <Icon name={(['folder', 'link', 'download'] as const)[i] ?? 'folder'} />
              <h3>{t(`landing.${key}`)}</h3>
              <p>{t(`landing.${key}Body`)}</p>
              <ul>
                {[0, 1, 2].map((index) => (
                  <li key={index}>
                    <Icon name="check" />
                    {t(`landing.featurePoints.${key}.${index}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="shell landing-section developer-section" id="integration">
        <div>
          <h2>{t('landing.developerTitle')}</h2>
          <p>{t('landing.developerBody')}</p>
          <Link className="text-link" to={localizedPath('/api/', locale)}>
            {t('landing.developerCta')}
            <Icon name="arrow" />
          </Link>
        </div>
        <CodeWindow
          title="Dropvia API — request.http"
          language="HTTP"
          value={
            'GET /api/v1/download/{uuid}\nAccept: application/octet-stream\n\nHTTP/1.1 404 Not Found\nContent-Type: application/json\n\n{ "error": { "code": "FILE_NOT_FOUND" } }'
          }
        />
      </section>
      <FileExperience reducedMotion={reducedMotion} />
      <PlatformGrid />
      <EverydayStory />
      <ServiceBand />
      <PlansBand />
      <section className="shell landing-section faq-section" id="landing-faq">
        <h2>{t('landing.faqTitle')}</h2>
        <div>
          {(['files', 'plans', 'help'] as const).map((key) => (
            <AccordionItem key={key} title={t(`landing.faq.${key}.q`)}>
              <p>{t(`landing.faq.${key}.a`)}</p>
            </AccordionItem>
          ))}
        </div>
      </section>
      <RequestAccess />
    </div>
  );
}
