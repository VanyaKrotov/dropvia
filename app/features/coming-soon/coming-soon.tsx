import type { Locale } from '../../lib/i18n';
import { content } from './content';

export function ComingSoon({ locale }: { locale: Locale }) {
  const copy = content[locale];
  const home = locale === 'en' ? '/' : '/ru';
  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <header className="flex min-h-24 items-center justify-between gap-4 py-6">
        <a className="brand-link" href={home} aria-label={copy.homeLabel} translate="no">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none">
            <path
              d="M5 4h8l6 6v10H5V4Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M13 4v6h6M9 14l3 3 3-3M12 11v6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          Dropvia
        </a>
        <nav className="flex items-center gap-2 text-sm" aria-label={copy.languageLabel}>
          <a
            className="language-link"
            href="/"
            hrefLang="en"
            lang="en"
            aria-current={locale === 'en' ? 'page' : undefined}
          >
            English
          </a>
          <a
            className="language-link"
            href="/ru"
            hrefLang="ru"
            lang="ru"
            aria-current={locale === 'ru' ? 'page' : undefined}
          >
            Русский
          </a>
        </nav>
      </header>

      <main id="content" tabIndex={-1} className="flex-1 pb-16">
        <section className="hero text-center" aria-labelledby="hero-title">
          <h1 id="hero-title" className="wordmark" translate="no">
            Dropvia
          </h1>
          <p className="mx-auto mt-8 max-w-copy text-xl leading-relaxed text-body sm:text-2xl">
            {copy.purpose}
          </p>
          <p className="mt-4 text-sm text-subtle">{copy.status}</p>
          <a className="pill-link mt-8 inline-flex" href="#launch">
            {copy.launchLink}
          </a>
        </section>

        <section
          id="launch"
          aria-labelledby="launch-title"
          className="launch-panel mx-auto max-w-copy rounded-panel bg-panel p-6 sm:p-8"
        >
          <h2 id="launch-title" className="text-heading font-medium text-ink">
            {copy.launchHeading}
          </h2>
          <p className="mt-4 text-body">{copy.unavailable}</p>
          <p className="mt-2 text-muted">{copy.next}</p>
          <details className="mt-8">
            <summary className="disclosure-label">{copy.question}</summary>
            <p className="pt-3 leading-relaxed text-muted">{copy.answer}</p>
          </details>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-subtle">
        <span translate="no">Dropvia</span>
        <a className="footer-link" href={home} translate="no">
          dropvia.fun
        </a>
      </footer>
    </div>
  );
}
