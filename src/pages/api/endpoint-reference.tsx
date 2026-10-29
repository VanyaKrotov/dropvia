import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeWindow } from '@shared/ui/code-window';
import {
  requestExample,
  responseHttpExample,
  type Endpoint,
  type ExampleLanguage,
} from '@pages/api/examples';

export function EndpointReference({
  endpoint,
  language,
}: {
  endpoint: Endpoint;
  language: ExampleLanguage;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(endpoint.status);
  const response =
    endpoint.responses.find((item) => item.status === status) ?? endpoint.responses[0];

  return (
    <section className="endpoint" id={endpoint.key}>
      <h2>
        <span className="method-label" data-method={endpoint.method}>
          {endpoint.method}
        </span>
        <code>{endpoint.path}</code>
      </h2>
      <h3>{t(`api.${endpoint.key}`)}</h3>
      <p>{t(`api.${endpoint.key}Body`)}</p>
      <CodeWindow
        key={language}
        title={`${endpoint.method} ${endpoint.path}`}
        language={language}
        value={requestExample(endpoint, language)}
      />
      <div className="response-toolbar">
        <h3>{t('api.response')}</h3>
        <label className="sr-only" htmlFor={`${endpoint.key}-response`}>
          {t('api.responseFor', { method: endpoint.method, path: endpoint.path })}
        </label>
        <select
          id={`${endpoint.key}-response`}
          value={status}
          onChange={(event) => setStatus(Number(event.currentTarget.value))}
        >
          {endpoint.responses.map((item) => (
            <option value={item.status} key={item.status}>
              {item.status} {item.reason}
            </option>
          ))}
        </select>
      </div>
      <CodeWindow
        title={`${response.status} ${response.reason} — response.http`}
        language="HTTP"
        value={responseHttpExample(endpoint, status)}
      />
    </section>
  );
}
