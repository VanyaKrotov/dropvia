import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { ErrorBoundary } from './root';

describe('route errors', () => {
  it('explains a missing page and offers a working way home', () => {
    render(
      <MemoryRouter initialEntries={['/ru/missing']}>
        <ErrorBoundary
          error={{ status: 404, statusText: 'Not Found', internal: false, data: null }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Страница не найдена',
    );
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
      'href',
      '/ru',
    );
  });

  it('hides unexpected server error details from the visitor', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/ru']}>
        <ErrorBoundary error={new Error('private-storage-key: super-secret')} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Не удалось открыть страницу',
    );
    expect(container).not.toHaveTextContent('super-secret');
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
      'href',
      '/ru',
    );
  });
});
