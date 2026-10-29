import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeWindow } from '@shared/ui/code-window';
import {
  endpoints,
  sampleFile,
  errorStatuses,
  type ExampleLanguage,
} from '@pages/api/examples';
import { EndpointReference } from '@pages/api/endpoint-reference';

const languages: ExampleLanguage[] = ['cURL', 'JavaScript', 'Python'];
const fileFields = [
  ['id', 'string · uuid'],
  ['name', 'string'],
  ['path', 'string'],
  ['size', 'integer'],
  ['mimeType', 'string'],
  ['publicUrl', 'string | null'],
  ['downloadUrl', 'string'],
  ['createdAt', 'string · date-time'],
  ['modifiedAt', 'string · date-time'],
] as const;

export function ApiPage() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<ExampleLanguage>('cURL');

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % languages.length
        : event.key === 'ArrowLeft'
          ? (index + languages.length - 1) % languages.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? languages.length - 1
              : -1;
    const value = languages[next];

    if (value) {
      event.preventDefault();
      setLanguage(value);
      document.getElementById(`tab-${value}`)?.focus();
    }
  }

  return (
    <div className="shell api-page">
      <header className="page-heading">
        <span className="api-version">API v1</span>
        <h1>{t('api.title')}</h1>
        <p>{t('api.body')}</p>
      </header>
      <div className="api-layout">
        <nav className="api-index" aria-label={t('api.methods')}>
          <span className="eyebrow">{t('api.methods')}</span>
          {endpoints.map((endpoint) => (
            <a href={`#${endpoint.key}`} key={endpoint.key}>
              <span className="method-label" data-method={endpoint.method}>
                {endpoint.method}
              </span>
              {t(`api.${endpoint.key}`)}
            </a>
          ))}
          <a href="#file-model">{t('api.models')}</a>
          <a href="#api-errors">{t('api.errors')}</a>
        </nav>
        <div className="api-content">
          <section className="api-intro">
            <h2>{t('api.intro')}</h2>
            <p>{t('api.introBody')}</p>
            <div className="base-url">
              <span>{t('api.base')}</span>
              <p>{t('api.serverAddress')}</p>
              <code>DROPVIA_SERVER_URL</code>
            </div>
            <h3>{t('api.auth')}</h3>
            <p>{t('api.authBody')}</p>
            <h3>{t('api.limits')}</h3>
            <p>{t('api.limitsBody')}</p>
          </section>
          <div className="code-tabs" role="tablist" aria-label={t('api.format')}>
            {languages.map((item, index) => (
              <button
                key={item}
                id={`tab-${item}`}
                type="button"
                role="tab"
                tabIndex={item === language ? 0 : -1}
                aria-selected={item === language}
                aria-controls="api-examples"
                onClick={() => setLanguage(item)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="api-example-note">{t('api.exampleRuntime')}</p>
          <div
            id="api-examples"
            role="tabpanel"
            aria-labelledby={`tab-${language}`}
            tabIndex={0}
          >
            {endpoints.map((endpoint) => (
              <EndpointReference
                key={endpoint.key}
                endpoint={endpoint}
                language={language}
              />
            ))}
          </div>
          <section className="api-model" id="file-model">
            <h2>{t('api.fileModel')}</h2>
            <p>{t('api.fileModelBody')}</p>
            <CodeWindow
              title="FileResource — file.json"
              language="JSON"
              value={JSON.stringify(sampleFile, null, 2)}
            />
            <dl className="api-model-fields">
              {fileFields.map(([name, type]) => (
                <div key={name}>
                  <dt>
                    <code>{name}</code>
                    <span>{type}</span>
                  </dt>
                  <dd>{t(`api.fileFields.${name}`)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="api-errors" id="api-errors">
            <h2>{t('api.errors')}</h2>
            <p>{t('api.errorBody')}</p>
            <dl>
              {errorStatuses.map((status) => (
                <div key={status}>
                  <dt>{status}</dt>
                  <dd>{t(`api.status${status}`)}</dd>
                </div>
              ))}
            </dl>
            <p className="api-example-note">
              <a className="text-link" href="https://www.rfc-editor.org/rfc/rfc9110.html">
                HTTP Semantics · RFC 9110
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
