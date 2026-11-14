// Bridge to hush's shared registry: the same settings model and adapter list
// the content scripts use, loaded as plain scripts that register on globalThis.
import '../../src/core/registry.js';
import '../../src/sites/x.js';
import '../../src/sites/youtube.js';
import '../../src/sites/roblox.js';
import '../../src/sites/github.js';
import '../../src/sites/reddit.js';

export type Option = {
  key: string;
  label: string;
  group?: 'layout' | 'feed' | 'look';
  desc?: string;
  hint?: string;
  choices?: string[];
  default: boolean | string;
};
export type Adapter = { id: string; name: string; options: Option[]; match(host: string): boolean };
export type Settings = {
  enabled: boolean;
  disabledSites: string[];
  motion: boolean;
  color: boolean;
  vibrance: number;
  muted?: string[];
  universal?: boolean;
  nudge?: number;
  hidden?: Record<string, { s: string; l: string; t: number }[]>;
  sites: Record<string, Record<string, boolean | string>>;
};

type HushApi = {
  load(): Promise<Settings>;
  save(patch: Partial<Settings>): Promise<void>;
  adapterFor(host: string): Adapter | null;
  siteOptions(s: Settings, a: Adapter): Record<string, boolean | string>;
  hostKey(host: string): string;
  isOn(s: Settings, host: string): boolean;
  isMac: boolean;
};

export const Hush = (globalThis as unknown as { Hush: HushApi }).Hush;
