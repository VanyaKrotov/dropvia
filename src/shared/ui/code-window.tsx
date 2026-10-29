import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@shared/ui/icon';

export type CodeLanguage = 'cURL' | 'JavaScript' | 'Python' | 'JSON' | 'HTTP';

// Small lexical highlighter for the published snippets. React escapes every token;
// the original source remains the single input for copying and rendering.
function highlighted(value: string, language: CodeLanguage) {
  const pattern =
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\/\/[^\n]*|\b(?:const|let|await|async|if|throw|new|return|import|from|with|as|True|False|None|true|false|null|GET|POST|DELETE|HTTP)\b|\b\d+(?:\.\d+)*\b|--?[a-zA-Z][\w-]*/g;
  const parts = [];
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index;

    if (index > cursor) {
      parts.push(value.slice(cursor, index));
    }

    const token = match[0];
    const kind =
      token.startsWith('#') || token.startsWith('//')
        ? 'comment'
        : /^["']/.test(token)
          ? language === 'JSON' && /^\s*:/.test(value.slice(index + token.length))
            ? 'key'
            : 'string'
          : /^\d/.test(token)
            ? 'number'
            : token.startsWith('-')
              ? 'flag'
              : 'keyword';

    parts.push(
      <span className={`syntax-${kind}`} key={index}>
        {token}
      </span>,
    );
    cursor = index + token.length;
  }

  parts.push(value.slice(cursor));

  return parts;
}

export function CodeWindow({
  value,
  language,
  title,
}: {
  value: string;
  language: CodeLanguage;
  title: string;
}) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<{
    value: string;
    state: 'copied' | 'error';
  } | null>(null);
  const state = feedback?.value === value ? feedback.state : 'idle';

  useEffect(() => {
    if (feedback?.state !== 'copied') {
      return;
    }

    const timeout = setTimeout(() => setFeedback(null), 5000);

    return () => clearTimeout(timeout);
  }, [feedback]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({ value, state: 'copied' });
    } catch {
      setFeedback({ value, state: 'error' });
    }
  }

  return (
    <div className="code-window">
      <div className="code-window-toolbar">
        <span className="safari-window-controls" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="code-window-title">{title}</span>
        <button
          type="button"
          className="copy-button"
          aria-label={t(state === 'copied' ? 'api.copied' : 'api.copy')}
          title={t(state === 'copied' ? 'api.copied' : 'api.copy')}
          data-copied={state === 'copied'}
          onClick={() => {
            void copy();
          }}
        >
          <Icon name={state === 'copied' ? 'check' : 'copy'} />
        </button>
      </div>
      <pre tabIndex={0} aria-label={`${title} — ${language}`} translate="no">
        <code>{highlighted(value, language)}</code>
      </pre>
      <span
        className={state === 'error' ? 'code-copy-error' : 'sr-only'}
        role="status"
        aria-live="polite"
      >
        {state === 'copied'
          ? t('api.copied')
          : state === 'error'
            ? t('api.copyError')
            : ''}
      </span>
    </div>
  );
}
