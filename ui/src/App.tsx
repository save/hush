import * as React from 'react';
import { BarChart3, Globe, Grid2x2, Heart, Palette, PanelLeft, Power, Sparkles, Type, Wind, type LucideIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge, Kbd, KbdGroup, Separator } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { Hush, type Adapter, type Option, type Settings } from './hush';
import { HiddenByYou, WeekReport } from './Quiet';

const VERSION = chrome?.runtime?.getManifest?.().version ?? 'dev';

const GROUPS: { id: NonNullable<Option['group']>; title: string }[] = [
  { id: 'layout', title: 'Layout' },
  { id: 'feed', title: 'Feed' },
  { id: 'look', title: 'Look' },
];

const CHOICE_ICONS: Record<string, LucideIcon> = { words: Type, icons: Grid2x2, both: PanelLeft };

type Tab = { id?: number; url?: string; host: string; hostname: string };

function useActiveTab(): Tab | null {
  const [tab, setTab] = React.useState<Tab | null>(null);
  React.useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
      try {
        const url = new URL(t?.url ?? '');
        const ok = url.protocol.startsWith('http');
        setTab({ id: t?.id, url: t?.url, hostname: ok ? url.hostname : '', host: ok ? Hush.hostKey(url.hostname) : '' });
      } catch {
        setTab({ host: '', hostname: '' });
      }
    });
  }, []);
  return tab;
}

function useSettings() {
  const [s, setS] = React.useState<Settings | null>(null);
  React.useEffect(() => {
    Hush.load().then(setS);
    const onChange = () => Hush.load().then(setS);
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);
  const update = React.useCallback((patch: Partial<Settings>) => {
    setS((prev) => (prev ? { ...prev, ...patch } : prev));
    return Hush.save(patch);
  }, []);
  return [s, update] as const;
}

function useHidden(tab: Tab | null, deps: unknown) {
  const [n, setN] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (tab?.id == null || !tab.host) return;
    const t = setTimeout(() => {
      chrome.tabs
        .sendMessage(tab.id!, { type: 'hush:stats' })
        .then((r: { hidden?: number } | undefined) => setN(r?.hidden || null))
        .catch(() => setN(null));
    }, 250);
    return () => clearTimeout(t);
  }, [tab, deps]);
  return n;
}

/* ---------------------------------------------------------------------- */

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".3" />
      <path d="M6.5 12.5c1.4-1.6 2.6-1.6 4 0s2.6 1.6 4 0 2.6-1.6 3.5-.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Favicon({ tab }: { tab: Tab }) {
  const [failed, setFailed] = React.useState(false);
  const src = tab.url ? `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(tab.url)}&size=32` : '';
  return (
    <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/50">
      {src && !failed ? (
        <img src={src} alt="" className="size-[18px]" onError={() => setFailed(true)} />
      ) : (
        <span className="text-sm font-semibold lowercase">{tab.host ? tab.host[0] : '·'}</span>
      )}
    </div>
  );
}

function Row({
  label,
  desc,
  children,
  index = 0,
  htmlFor,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
  index?: number;
  htmlFor?: string;
}) {
  return (
    <div
      className="group flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-accent/50 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-both"
      style={{ animationDelay: `${40 + index * 22}ms` }}
    >
      <label htmlFor={htmlFor} className="flex min-w-0 cursor-pointer flex-col gap-0.5">
        <span className="text-sm leading-none font-medium first-letter:uppercase">{label}</span>
        {desc && <span className="truncate text-xs text-muted-foreground">{desc}</span>}
      </label>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function StackedRow({ label, desc, children, index = 0 }: { label: string; desc?: string; children: React.ReactNode; index?: number }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-md px-2 py-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-both"
      style={{ animationDelay: `${40 + index * 22}ms` }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm leading-none font-medium first-letter:uppercase">{label}</span>
        {desc && <span className="text-xs text-muted-foreground">{desc}</span>}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground">{children}</div>;
}

function OptionControl({ opt, value, onChange }: { opt: Option; value: boolean | string; onChange(v: boolean | string): void }) {
  if (opt.choices) {
    return (
      <ToggleGroup type="single" variant="outline" size="sm" className="w-full" value={String(value)} onValueChange={(v) => v && onChange(v)}>
        {opt.choices.map((c) => {
          const Icon = CHOICE_ICONS[c];
          return (
            <ToggleGroupItem key={c} value={c} aria-label={c} className="gap-1.5 text-xs">
              {Icon ? <Icon className="size-3.5" /> : null}
              {c[0].toUpperCase() + c.slice(1)}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    );
  }
  return (
    <>
      {opt.hint && <Kbd>{opt.hint}</Kbd>}
      <Switch id={`opt-${opt.key}`} checked={!!value} onCheckedChange={onChange} />
    </>
  );
}

/* image colour: live while dragging (throttled saves), final value on release */
function ColourRow({ value, onSave, index = 0 }: { value: number; onSave(v: number): void; index?: number }) {
  const [v, setV] = React.useState(value);
  const last = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => setV(value), [value]);
  const push = (n: number) => {
    setV(n);
    clearTimeout(timer.current);
    const wait = 160 - (Date.now() - last.current);
    timer.current = setTimeout(() => { last.current = Date.now(); onSave(n); }, Math.max(0, wait));
  };
  return (
    <StackedRow label="Image colour" desc="How much colour softened images keep. Hover still shows full colour." index={index}>
      <div className="flex items-center gap-3 pt-1">
        <Palette className="size-3.5 shrink-0 text-muted-foreground" />
        <Slider
          value={[v]}
          min={0}
          max={100}
          step={1}
          aria-label="Image colour"
          onValueChange={([n]) => push(n)}
          onValueCommit={([n]) => { clearTimeout(timer.current); onSave(n); }}
        />
        <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{v}%</span>
      </div>
    </StackedRow>
  );
}

/* ---------------------------------------------------------------------- */

export function App() {
  const tab = useActiveTab();
  const [s, update] = useSettings();
  const adapter: Adapter | null = tab?.hostname ? Hush.adapterFor(tab.hostname) : null;
  const siteOn = !!(s && tab?.host && Hush.isOn(s, tab.hostname));
  const hidden = useHidden(tab, s);

  if (!s || !tab) return <div className="h-[420px]" />;

  const opts = adapter ? Hush.siteOptions(s, adapter) : {};
  const setOpt = (key: string, value: boolean | string) => {
    if (!adapter) return;
    update({ sites: { ...s.sites, [adapter.id]: { ...Hush.siteOptions(s, adapter), [key]: value } } });
  };
  const toggleSite = (next: boolean) => {
    const off = new Set(s.disabledSites);
    if (next) off.delete(tab.host);
    else off.add(tab.host);
    update({ disabledSites: [...off] });
  };

  let i = 0;
  const status = !tab.host
    ? 'hush can’t run on this page'
    : !s.enabled
      ? 'Off everywhere'
      : !siteOn
        ? 'Paused on this site'
        : adapter
          ? `Tailored for ${adapter.name}`
          : 'Calm layer';

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        {/* header */}
        <header className="flex items-center justify-between px-4 pt-4 pb-3 animate-in fade-in-0 duration-300">
          <div className="flex items-center gap-2">
            <img src="./logo.png" alt="" className="size-6 rounded-[7px]" />
            <span className="text-[15px] font-semibold tracking-tight">hush</span>
            <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px] text-muted-foreground">
              {VERSION}
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Power className={cn('size-3.5 transition-colors', s.enabled ? 'text-foreground' : 'text-muted-foreground')} />
                <Switch checked={s.enabled} onCheckedChange={(v) => update({ enabled: v })} aria-label="hush everywhere" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">{s.enabled ? 'Turn hush off everywhere' : 'Turn hush on'}</TooltipContent>
          </Tooltip>
        </header>

        {/* site card */}
        <div className="px-4">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-card/60 p-3 shadow-xs transition-opacity duration-300 animate-in fade-in-0 slide-in-from-bottom-1 duration-300',
              !siteOn && 'opacity-70',
            )}
          >
            <Favicon tab={tab} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{tab.host || 'Not a web page'}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full transition-colors',
                    siteOn && adapter ? 'bg-hush' : siteOn ? 'bg-foreground/50' : 'bg-muted-foreground/40',
                  )}
                />
                <span className="truncate">{status}</span>
                {siteOn && hidden ? (
                  <Badge variant="secondary" className="ml-auto h-5 px-1.5 tabular-nums">
                    {hidden} hidden
                  </Badge>
                ) : null}
              </div>
            </div>
            <Switch checked={siteOn} disabled={!tab.host || !s.enabled} onCheckedChange={toggleSite} aria-label={`hush on ${tab.host}`} />
          </div>
        </div>

        {/* settings */}
        <Tabs defaultValue={adapter ? 'site' : 'everywhere'} className="mt-3 px-4">
          <TabsList className="w-full">
            <TabsTrigger value="site" disabled={!adapter}>
              <Globe />
              {adapter ? adapter.name : 'This site'}
            </TabsTrigger>
            <TabsTrigger value="everywhere">
              <Sparkles />
              Everywhere
            </TabsTrigger>
            <TabsTrigger value="week">
              <BarChart3 />
              Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value="site" className="-mx-2 max-h-[340px] overflow-y-auto pb-1 [scrollbar-width:thin]">
            {adapter &&
              GROUPS.map((g) => {
                const list = adapter.options.filter((o) => (o.group ?? 'look') === g.id);
                if (!list.length) return null;
                return (
                  <section key={g.id}>
                    <SectionTitle>{g.title}</SectionTitle>
                    {list.map((o) =>
                      o.choices ? (
                        <StackedRow key={o.key} label={o.label} desc={o.desc} index={i++}>
                          <OptionControl opt={o} value={opts[o.key]} onChange={(v) => setOpt(o.key, v)} />
                        </StackedRow>
                      ) : (
                        <Row key={o.key} label={o.label} desc={o.desc} index={i++} htmlFor={`opt-${o.key}`}>
                          <OptionControl opt={o} value={opts[o.key]} onChange={(v) => setOpt(o.key, v)} />
                        </Row>
                      ),
                    )}
                    {g.id === 'look' && <ColourRow value={s.vibrance ?? 90} onSave={(n) => update({ vibrance: n })} index={i++} />}
                  </section>
                );
              })}
            {adapter && tab.host && <HiddenByYou s={s} host={tab.host} update={update} />}
          </TabsContent>

          <TabsContent value="everywhere" className="-mx-2 pb-1">
            <SectionTitle>Every site</SectionTitle>
            <Row label="Still motion" desc="No animations or autoplay" index={0} htmlFor="g-motion">
              <Wind className="size-3.5 text-muted-foreground" />
              <Switch id="g-motion" checked={s.motion} onCheckedChange={(v) => update({ motion: v })} />
            </Row>
            <Row label="Mute color" desc="Images fade back until hovered" index={1} htmlFor="g-color">
              <Switch id="g-color" checked={s.color} onCheckedChange={(v) => update({ color: v })} />
            </Row>
            <ColourRow value={s.vibrance ?? 90} onSave={(n) => update({ vibrance: n })} index={2} />
            {!adapter && tab.host && <HiddenByYou s={s} host={tab.host} update={update} />}
          </TabsContent>

          <TabsContent value="week" className="-mx-2 pb-1">
            <WeekReport />
          </TabsContent>
        </Tabs>

        {/* footer */}
        <Separator className="mt-2" />
        <footer className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <KbdGroup>
              <Kbd>{Hush.isMac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            Tune
          </span>
          <span className="flex items-center gap-2">
            <KbdGroup>
              <Kbd>Alt</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>H</Kbd>
            </KbdGroup>
            This site
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Support hush"
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('build/popup/support.html') })}
                className="group flex h-6 items-center gap-1.5 rounded-md px-1.5 transition-colors hover:bg-accent hover:text-foreground"
              >
                <Heart className="size-3.5 transition-colors group-hover:fill-hush group-hover:text-hush" />
                Support
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">hush is free. Help keep it that way.</TooltipContent>
          </Tooltip>
        </footer>
      </div>
    </TooltipProvider>
  );
}
