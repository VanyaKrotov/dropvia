import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import { en as englishMessages } from '@shared/i18n/en';
import { ru as russianMessages } from '@shared/i18n/ru';

export function LegalPage({ policy }: { policy: 'terms' | 'privacy' }) {
  const { t, i18n } = useTranslation();
  const sections = (i18n.language === 'ru' ? russianMessages : englishMessages).legal[
    policy
  ].sections;
  const date = format(new Date(2026, 9, 28), 'd MMMM yyyy', {
    locale: i18n.language === 'ru' ? ru : enUS,
  });

  return (
    <article className="shell legal-page">
      <header className="page-heading">
        <p className="eyebrow">Dropvia</p>
        <h1>{t(`legal.${policy}.title`)}</h1>
        <p className="muted">
          <time dateTime="2026-10-28">{date}</time>
        </p>
        <p className="legal-intro">{t(`legal.${policy}.intro`)}</p>
      </header>
      <div className="legal-layout">
        <nav className="legal-index" aria-label={t(`legal.${policy}.title`)}>
          {sections.map((section, i) => (
            <a href={`#section-${i}`} key={i}>
              {section.title}
            </a>
          ))}
        </nav>
        <div className="prose">
          {sections.map((section, i) => (
            <section id={`section-${i}`} key={i}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <section>
            <h2>{t('legal.contact')}</h2>
            <p>{t('legal.contactBody')}</p>
            <a className="text-link" href="mailto:support@dropvia.fun">
              support@dropvia.fun
            </a>
          </section>
        </div>
      </div>
    </article>
  );
}
