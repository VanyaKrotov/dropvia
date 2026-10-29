import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnimate, useReducedMotion } from 'framer-motion';
import {
  DesktopBrowserFrame,
  PhoneBrowserFrame,
} from '@widgets/file-scene/browser-frames';

export function FileScene() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? 'ru' : 'en';
  const [scope, animate] = useAnimate<HTMLElement>();
  const reducedMotion = useReducedMotion();
  const imagePath = (
    device: 'desktop' | 'mobile',
    theme: 'light' | 'dark',
    width: number,
  ) => `/images/dashboard/${device}-${theme}-${locale}-${width}.webp`;
  const sourceSet = (device: 'desktop' | 'mobile', theme: 'light' | 'dark') =>
    device === 'mobile'
      ? `${imagePath(device, theme, 480)} 480w, ${imagePath(device, theme, 960)} 960w`
      : `${imagePath(device, theme, 800)} 800w, ${imagePath(device, theme, 1600)} 1600w`;

  useEffect(() => {
    const images = scope.current?.querySelectorAll('img');
    const animations: { stop: () => void }[] = [];
    const cleanup: (() => void)[] = [];

    images?.forEach((image, index) => {
      const reveal = () => {
        if (reducedMotion || image.naturalWidth === 0) {
          return;
        }

        const frame = image.closest<HTMLElement>('[data-preview-frame]');

        if (!frame) {
          return;
        }

        animations.push(
          animate(
            frame,
            { opacity: [0, 1], y: [12, 0] },
            { duration: 0.9, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] },
          ),
        );
      };

      if (image.complete) {
        reveal();
      } else {
        image.addEventListener('load', reveal, { once: true });
      }

      cleanup.push(() => image.removeEventListener('load', reveal));
    });

    return () => {
      cleanup.forEach((remove) => remove());
      animations.forEach((animation) => animation.stop());
    };
  }, [animate, reducedMotion, locale, scope]);

  return (
    <figure className="file-scene" ref={scope} aria-label={t('landing.preview.label')}>
      <DesktopBrowserFrame>
        <picture className="dashboard-primary">
          <source
            media="(width < 48rem) and (prefers-color-scheme: dark)"
            srcSet={sourceSet('mobile', 'dark')}
            sizes="(max-width: 32rem) calc(100vw - 40px), 480px"
            width={960}
            height={1440}
          />
          <source
            media="(width < 48rem)"
            srcSet={sourceSet('mobile', 'light')}
            sizes="(max-width: 32rem) calc(100vw - 40px), 480px"
            width={960}
            height={1440}
          />
          <source
            media="(prefers-color-scheme: dark)"
            srcSet={sourceSet('desktop', 'dark')}
            sizes="(max-width: 64rem) 80vw, 988px"
          />
          <img
            src={imagePath('desktop', 'light', 1600)}
            srcSet={sourceSet('desktop', 'light')}
            sizes="(max-width: 64rem) 80vw, 988px"
            width={1600}
            height={1001}
            alt={t('landing.preview.desktopAlt')}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </DesktopBrowserFrame>
      <PhoneBrowserFrame>
        <picture className="dashboard-mobile">
          <source
            media="(prefers-color-scheme: dark)"
            srcSet={sourceSet('mobile', 'dark')}
            sizes="(max-width: 47.999rem) 288px, 250px"
          />
          <img
            src={imagePath('mobile', 'light', 480)}
            srcSet={sourceSet('mobile', 'light')}
            sizes="(max-width: 47.999rem) 288px, 250px"
            width={480}
            height={720}
            alt={t('landing.preview.mobileAlt')}
            loading="eager"
            decoding="async"
          />
        </picture>
      </PhoneBrowserFrame>
    </figure>
  );
}
