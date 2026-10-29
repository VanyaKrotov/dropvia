import type { ReactNode } from 'react';

const glyphs = {
  back: 'm14 5-7 7 7 7',
  forward: 'm10 5 7 7-7 7',
  sidebar: 'M3 5h18v14H3V5Zm6 0v14',
  share: 'M5 10v11h14V10M12 16V2m-4 4 4-4 4 4',
  tabs: 'M8 3h13v13H8V3ZM3 8v13h13',
  book: 'M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v15',
  reload: 'M19 8a8 8 0 1 0 1 7M19 2v6h-6',
  lock: 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4',
  wifi: 'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01',
} as const;

function BrowserGlyph({ name }: { name: keyof typeof glyphs }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={glyphs[name]} />
    </svg>
  );
}

export function SafariToolbar() {
  return (
    <div className="safari-toolbar" aria-hidden="true">
      <span className="safari-window-controls">
        <i />
        <i />
        <i />
      </span>
      <span className="safari-navigation">
        <BrowserGlyph name="sidebar" />
        <BrowserGlyph name="back" />
        <BrowserGlyph name="forward" />
      </span>
      <span className="safari-address">
        <BrowserGlyph name="lock" />
        <span>dropvia.fun</span>
        <BrowserGlyph name="reload" />
      </span>
      <span className="safari-tools">
        <BrowserGlyph name="share" />
        <BrowserGlyph name="tabs" />
      </span>
    </div>
  );
}

export function DesktopBrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-preview desktop-preview" data-preview-frame>
      <SafariToolbar />
      {children}
    </div>
  );
}

export function PhoneBrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-preview iphone-preview" data-preview-frame>
      <div className="iphone-screen">
        <div className="iphone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="iphone-island" />
          <span className="iphone-indicators">
            <span className="iphone-signal">
              <i />
              <i />
              <i />
              <i />
            </span>
            <BrowserGlyph name="wifi" />
            <span className="iphone-battery" />
          </span>
        </div>
        {children}
        <div className="mobile-safari" aria-hidden="true">
          <div className="mobile-safari-address">
            <span>aA</span>
            <span>
              <BrowserGlyph name="lock" />
              dropvia.fun
            </span>
            <BrowserGlyph name="reload" />
          </div>
          <div className="mobile-safari-tools">
            <BrowserGlyph name="back" />
            <BrowserGlyph name="forward" />
            <BrowserGlyph name="share" />
            <BrowserGlyph name="book" />
            <BrowserGlyph name="tabs" />
          </div>
          <span className="iphone-home-indicator" />
        </div>
      </div>
    </div>
  );
}
