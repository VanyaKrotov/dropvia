import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import { localizedPath, type Locale } from '@shared/i18n/config';
import { BrandMark } from '@shared/ui/brand-mark';
import { LanguageSwitch } from '@shared/ui/language-switch';

export function SiteHeader({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const headerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;

    if (!header || !sentinel) {
      return;
    }

    const root = document.documentElement;
    const positionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setScrolled(!entry.isIntersecting);
        }
      },
      { rootMargin: '8px 0px 0px 0px' },
    );
    const updateHeight = () =>
      root.style.setProperty(
        '--site-header-height',
        `${header.getBoundingClientRect().height}px`,
      );
    const sizeObserver = new ResizeObserver(updateHeight);

    positionObserver.observe(sentinel);
    sizeObserver.observe(header);
    updateHeight();

    return () => {
      positionObserver.disconnect();
      sizeObserver.disconnect();
      root.style.removeProperty('--site-header-height');
    };
  }, []);

  return (
    <>
      <div className="header-scroll-sentinel" ref={sentinelRef} aria-hidden="true" />
      <header className="site-header" ref={headerRef} data-scrolled={scrolled}>
        <div className="site-header-inner shell">
          <Link
            to={localizedPath('/', locale)}
            className="wordmark"
            aria-label={`Dropvia · ${t('common.home')}`}
          >
            <BrandMark />
            Dropvia
          </Link>
          <nav className="primary-nav" aria-label={t('common.menu')}>
            <NavLink to={localizedPath('/', locale) + '#product'} end>
              {t('common.product')}
            </NavLink>
            <NavLink to={localizedPath('/prices', locale)}>{t('common.prices')}</NavLink>
            <NavLink to={localizedPath('/status', locale)}>{t('common.status')}</NavLink>
          </nav>
          <div className="header-actions">
            <LanguageSwitch locale={locale} />
            <Link className="button button-small" to={localizedPath('/sign-in', locale)}>
              {t('common.signIn')}
            </Link>
          </div>
        </div>
      </header>
      <noscript>
        <style>{'.site-header{background:var(--canvas)}'}</style>
      </noscript>
    </>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const { t } = useTranslation();

  return (
    <footer className="site-footer shell">
      <div className="footer-top">
        <div>
          <Link to={localizedPath('/', locale)} className="wordmark">
            <BrandMark />
            Dropvia
          </Link>
          <p className="muted">{t('common.footer')}</p>
          <a className="text-link" href="mailto:support@dropvia.fun">
            support@dropvia.fun
          </a>
        </div>
        <nav aria-label={t('common.product')}>
          <Link to={localizedPath('/prices', locale)}>{t('common.prices')}</Link>
          <Link to={localizedPath('/api/', locale)}>{t('common.api')}</Link>
          <Link to={localizedPath('/status', locale)}>{t('common.allServices')}</Link>
        </nav>
        <nav aria-label={t('common.terms')}>
          <Link to={localizedPath('/terms', locale)}>{t('common.terms')}</Link>
          <Link to={localizedPath('/privacy', locale)}>{t('common.privacy')}</Link>
          <Link to={localizedPath('/', locale) + '#request-access'}>
            {t('common.request')}
          </Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Dropvia</span>
        <span>{t('common.copyright')}</span>
      </div>
    </footer>
  );
}
