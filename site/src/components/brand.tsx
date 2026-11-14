import { siGithub, siGooglechrome, siReddit, siRoblox, siX, siYoutube } from 'simple-icons';
import { SUPPORT } from '@ui/config';

type SimpleIcon = { path: string; title: string };

export function Logo({ icon, className }: { icon: SimpleIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" role="img" aria-label={icon.title}>
      <path d={icon.path} />
    </svg>
  );
}

export const icons = { x: siX, youtube: siYoutube, roblox: siRoblox, github: siGithub, reddit: siReddit, chrome: siGooglechrome };

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3" />
      <path d="M6.5 12.5c1.4-1.6 2.6-1.6 4 0s2.6 1.6 4 0 2.6-1.6 3.5-.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Fill these in ui/src/config.ts; the homepage and the popup share them.
export const LINKS = {
  chrome: SUPPORT.chromeWebStore || '#install',
  github: SUPPORT.github || '#source',
  support: SUPPORT.kofi || SUPPORT.githubSponsors || SUPPORT.buyMeACoffee || '#source',
};
