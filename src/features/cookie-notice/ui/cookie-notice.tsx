import { useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { localizedPath, type Locale } from '@shared/i18n/config';

const storageKey = 'dropvia:cookie-notice:v1';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(storageKey, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(storageKey, onChange);
  };
}

function isAcknowledged() {
  try {
    return localStorage.getItem(storageKey) === 'acknowledged';
  } catch {
    return false;
  }
}

// Hide until hydration: the server cannot read this browser's localStorage.
function serverSnapshot() {
  return true;
}

export function CookieNotice({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const acknowledged = useSyncExternalStore(subscribe, isAcknowledged, serverSnapshot);
  const [storageError, setStorageError] = useState(false);

  function acknowledge() {
    try {
      localStorage.setItem(storageKey, 'acknowledged');
      setStorageError(false);
      // Native storage events notify other tabs; notify this document as well.
      window.dispatchEvent(new Event(storageKey));
    } catch {
      setStorageError(true);
    }
  }

  return (
    <AnimatePresence>
      {!acknowledged && (
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
            {storageError && (
              <p className="cookie-notice-error" role="status">
                {t('cookieNotice.error')}
              </p>
            )}
          </div>
          <button type="button" className="button" onClick={acknowledge}>
            {t('cookieNotice.accept')}
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
