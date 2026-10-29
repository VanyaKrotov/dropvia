import { useLocation } from 'react-router';
import { localizedPath, unlocalizedPath, type Locale } from '@shared/i18n/config';

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const location = useLocation();
  const other: Locale = locale === 'en' ? 'ru' : 'en';
  const switchedPath =
    localizedPath(unlocalizedPath(location.pathname), other) + location.search;

  return (
    <a
      className="language-link"
      href={switchedPath}
      lang={other}
      hrefLang={other}
      onClick={(event) => {
        event.currentTarget.href = switchedPath + location.hash;
      }}
      onAuxClick={(event) => {
        event.currentTarget.href = switchedPath + location.hash;
      }}
    >
      {other === 'ru' ? 'Русский' : 'English'}
    </a>
  );
}
