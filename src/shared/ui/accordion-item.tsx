import { useRef, type MouseEvent, type ReactNode } from 'react';
import { useAnimate } from 'framer-motion';

export function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [bodyRef, animate] = useAnimate<HTMLDivElement>();
  const targetOpen = useRef<boolean | null>(null);
  const running = useRef<{ stop: () => void } | null>(null);

  function toggle(event: MouseEvent<HTMLElement>) {
    const details = detailsRef.current;
    const body = bodyRef.current;

    if (!details || !body) {
      return;
    }

    event.preventDefault();
    const next = !(targetOpen.current ?? details.open);

    targetOpen.current = next;
    const from = details.open ? body.getBoundingClientRect().height : 0;
    const previous = running.current;

    running.current = null;
    previous?.stop();
    details.dataset.closing = String(!next);

    // Read at interaction time: this also respects a setting changed after mount.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      details.open = next;
      body.style.height = '';
      body.style.opacity = '';

      return;
    }

    details.open = true;
    const expandedHeight =
      body.firstElementChild?.getBoundingClientRect().height ?? body.scrollHeight;
    const animation = animate(
      body,
      { height: [from, next ? expandedHeight : 0], opacity: next ? 1 : 0 },
      {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    );

    running.current = animation;
    void animation.then(() => {
      if (running.current !== animation) {
        return;
      }

      details.open = next;
      body.style.height = '';
      body.style.opacity = '';
      running.current = null;
    });
  }

  return (
    <details className="accordion-item" ref={detailsRef}>
      <summary onClick={toggle}>
        {title}
        <span className="accordion-indicator" aria-hidden="true">
          <span />
          <span />
        </span>
      </summary>
      <div className="accordion-content" ref={bodyRef}>
        <div className="accordion-answer">{children}</div>
      </div>
    </details>
  );
}
