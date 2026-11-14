import * as React from 'react';
import { Puzzle } from 'lucide-react';
import { siBrave, siGooglechrome, siOpera } from 'simple-icons';
import { Logo } from './brand';

/*
 * Which Chromium browser is reading the page, so the buttons and install steps
 * speak its language. Brave reports Chrome's user agent but adds navigator.brave;
 * Edge and Opera mark the user agent. Arc and others are treated as Chrome,
 * whose chrome:// address they all accept.
 */
export type Browser = { id: 'chrome' | 'brave' | 'edge' | 'opera'; name: string; extensions: string };

export function detectBrowser(): Browser {
  if (typeof navigator === 'undefined') return { id: 'chrome', name: 'Chrome', extensions: 'chrome://extensions' };
  const ua = navigator.userAgent;
  if ((navigator as Navigator & { brave?: unknown }).brave) return { id: 'brave', name: 'Brave', extensions: 'brave://extensions' };
  if (/Edg\//.test(ua)) return { id: 'edge', name: 'Edge', extensions: 'edge://extensions' };
  if (/OPR\//.test(ua)) return { id: 'opera', name: 'Opera', extensions: 'opera://extensions' };
  return { id: 'chrome', name: 'Chrome', extensions: 'chrome://extensions' };
}

export function useBrowser() {
  return React.useMemo(detectBrowser, []);
}

export function BrowserIcon({ browser, className }: { browser: Browser; className?: string }) {
  if (browser.id === 'brave') return <Logo icon={siBrave} className={className} />;
  if (browser.id === 'opera') return <Logo icon={siOpera} className={className} />;
  if (browser.id === 'edge') return <Puzzle className={className} />;
  return <Logo icon={siGooglechrome} className={className} />;
}
