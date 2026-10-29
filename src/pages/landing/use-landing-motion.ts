import { useEffect, useSyncExternalStore } from 'react';
import { useAnimate } from 'framer-motion';

const preference = '(prefers-reduced-motion: reduce)';

function subscribe(callback: () => void) {
  const query = window.matchMedia(preference);

  query.addEventListener('change', callback);

  return () => query.removeEventListener('change', callback);
}

function snapshot() {
  return window.matchMedia(preference).matches;
}

function serverSnapshot() {
  return false;
}

export function useLandingMotion() {
  const reducedMotion = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    const nodes = Array.from(
      scope.current?.querySelectorAll<HTMLElement>('[data-reveal]') ?? [],
    );
    const animations: { stop: () => void }[] = [];
    const restore = () =>
      nodes.forEach((node) => {
        node.style.opacity = '';
        node.style.transform = '';
      });

    if (
      reducedMotion ||
      window.matchMedia(preference).matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      restore();

      return;
    }

    // SSR content is visible. Prepare only visuals below the viewport, reading
    // geometry before writes; already visible content never waits for JS.
    const pending = nodes.filter((node) => node.dataset.revealed !== 'true');
    const offscreen = pending.filter(
      (node) => node.getBoundingClientRect().top >= window.innerHeight,
    );

    offscreen.forEach((node) => {
      node.style.opacity = '0';
    });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
            continue;
          }

          const node = entry.target;

          observer.unobserve(node);
          node.dataset.revealed = 'true';
          const animation = animate(
            node,
            { opacity: [0, 1], y: node.dataset.reveal === 'fade' ? [0, 0] : [16, 0] },
            {
              duration: 0.65,
              delay: Number(node.dataset.revealDelay ?? 0) / 1000,
              ease: [0.16, 1, 0.3, 1],
            },
          );

          animations.push(animation);
        }
      },
      { threshold: 0.12 },
    );

    pending.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.stop());
      restore();
    };
  }, [animate, reducedMotion, scope]);

  return { scope, reducedMotion };
}
