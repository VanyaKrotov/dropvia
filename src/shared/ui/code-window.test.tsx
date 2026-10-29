import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeWindow } from '@shared/ui/code-window';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('code window', () => {
  it('shows an icon-only copy button and resets success after five seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<CodeWindow value="source" language="JSON" title="example.json" />);
    const button = screen.getByRole('button', { name: 'api.copy' });

    expect(button.textContent).toBe('');
    expect(button.querySelector('svg')).not.toBeNull();
    const originalIcon = button.querySelector('path')?.getAttribute('d');

    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toHaveAccessibleName('api.copied');
    expect(button.querySelector('path')?.getAttribute('d')).not.toBe(originalIcon);
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(button).toHaveAccessibleName('api.copied');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(button).toHaveAccessibleName('api.copy');
    expect(button.querySelector('path')?.getAttribute('d')).toBe(originalIcon);
  });
  it('restarts the success interval on another copy and cleans up on unmount', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const { unmount } = render(
      <CodeWindow value="source" language="JSON" title="example.json" />,
    );
    const button = screen.getByRole('button', { name: 'api.copy' });

    await act(async () => {
      fireEvent.click(button);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    await act(async () => {
      fireEvent.click(button);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(button).toHaveAccessibleName('api.copied');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps source text intact and escapes markup while highlighting', () => {
    const source = 'const value = "<img src=x onerror=alert(1)>";\n// comment';
    const { container } = render(
      <CodeWindow value={source} language="JavaScript" title="example.js" />,
    );

    expect(container.querySelector('code')?.textContent).toBe(source);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelectorAll('code span').length).toBeGreaterThan(1);
  });
  it('copies the complete current source and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { rerender } = render(
      <CodeWindow value="first" language="JSON" title="response.json" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'api.copy' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('api.copied'),
    );
    rerender(<CodeWindow value="second" language="JSON" title="response.json" />);
    fireEvent.click(screen.getByRole('button', { name: 'api.copy' }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith('second'));
  });
  it('reports a clipboard failure without removing the code', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<CodeWindow value="keep this" language="JSON" title="response.json" />);
    fireEvent.click(screen.getByRole('button', { name: 'api.copy' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('api.copyError'),
    );
    expect(screen.getByText('keep this')).toBeVisible();
  });
});
