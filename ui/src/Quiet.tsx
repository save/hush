import * as React from 'react';
import { Clock, EyeOff, MessageSquareOff, MousePointerClick, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Settings } from './hush';

/* ---------------------------- the weekly report --------------------------- */

type Quiet = Record<string, Record<string, number>>; // { 'YYYY-MM-DD': { host: count } }

function useLocal(key: 'quiet' | 'time') {
  const [q, setQ] = React.useState<Quiet>({});
  React.useEffect(() => {
    const load = () => chrome.storage.local.get(key).then((r) => setQ((r[key] as Quiet) || {}));
    load();
    const on = (_c: unknown, area: string) => area === 'local' && load();
    chrome.storage.onChanged.addListener(on);
    return () => chrome.storage.onChanged.removeListener(on);
  }, [key]);
  return q;
}
const fmtMins = (secs: number) => {
  const m = Math.round(secs / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const dayKey = (d: Date) => d.toLocaleDateString('en-CA');
const sum = (o: Record<string, number> | undefined) => Object.values(o || {}).reduce((a, b) => a + b, 0);

function Favicon({ host }: { host: string }) {
  const [bad, setBad] = React.useState(false);
  const src = `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent('https://' + host)}&size=32`;
  return bad ? (
    <span className="grid size-5 place-items-center rounded bg-muted text-[10px] font-semibold">{host[0]}</span>
  ) : (
    <img src={src} alt="" className="size-4" onError={() => setBad(true)} />
  );
}

export function WeekReport() {
  const q = useLocal('quiet');
  const time = useLocal('time');
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    return { key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), n: sum(q[dayKey(d)]) };
  });
  const prev = Array.from({ length: 7 }, (_, i) => sum(q[dayKey(new Date(Date.now() - (13 - i) * 864e5))])).reduce((a, b) => a + b, 0);
  const total = days.reduce((a, d) => a + d.n, 0);
  const max = Math.max(1, ...days.map((d) => d.n));
  const bySite: Record<string, number> = {};
  for (const d of days) for (const [h, n] of Object.entries(q[d.key] || {})) bySite[h] = (bySite[h] || 0) + n;
  const sites = Object.entries(bySite).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const change = prev ? Math.round(((total - prev) / prev) * 100) : null;
  const secsBySite: Record<string, number> = {};
  for (const d of days) for (const [h, n] of Object.entries(time[d.key] || {})) secsBySite[h] = (secsBySite[h] || 0) + n;
  const totalSecs = Object.values(secsBySite).reduce((a, b) => a + b, 0);

  return (
    <div className="px-2 pt-3 pb-1">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{total.toLocaleString()}</div>
          <div className="mt-1.5 text-xs text-muted-foreground">things kept off your screen this week</div>
        </div>
        {change !== null && (
          <span className="rounded-full border px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground tabular-nums">
            {change >= 0 ? '+' : ''}{change}% vs last week
          </span>
        )}
      </div>

      {/* seven days */}
      <div className="mt-4 flex h-[72px] items-end gap-1.5">
        {days.map((d, i) => (
          <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn('w-full rounded-[4px] transition-[height] duration-700 ease-[cubic-bezier(.32,.72,0,1)]', i === 6 ? 'bg-hush' : 'bg-foreground/20')}
              style={{ height: `${Math.max(3, (d.n / max) * 56)}px`, transitionDelay: `${i * 40}ms` }}
              title={`${d.n} on ${d.key}`}
            />
            <span className={cn('text-[10px]', i === 6 ? 'text-foreground' : 'text-muted-foreground')}>{d.label}</span>
          </div>
        ))}
      </div>

      {sites.length > 0 ? (
        <div className="mt-4 flex flex-col gap-1">
          {sites.map(([h, n]) => (
            <div key={h} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm">
              <Favicon host={h} />
              <span className="flex-1 truncate">{h}</span>
              {secsBySite[h] ? <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">{fmtMins(secsBySite[h])}</span> : null}
              <span className="w-12 text-right font-mono text-xs text-muted-foreground tabular-nums">{n.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">Browse as usual. hush tallies what it hides here.</p>
      )}
      {totalSecs > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span className="flex-1">Time on these sites this week</span>
          <span className="font-mono text-foreground tabular-nums">{fmtMins(totalSecs)}</span>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground/70">Counted on this device only. Nothing is sent anywhere.</p>
    </div>
  );
}

/* --------------------------- what you've hushed ---------------------------- */

export function HiddenByYou({ s, host, update }: { s: Settings; host: string; update(p: Partial<Settings>): unknown }) {
  const list = (s.hidden || {})[host] || [];
  const remove = (sel: string) => {
    const next = list.filter((r) => r.s !== sel);
    const hidden = { ...(s.hidden || {}) };
    if (next.length) hidden[host] = next; else delete hidden[host];
    update({ hidden });
  };
  return (
    <section>
      <div className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground">Hidden by you</div>
      {list.length === 0 ? (
        <div className="flex items-center gap-2.5 px-2 py-2 text-xs text-muted-foreground">
          <MousePointerClick className="size-3.5 shrink-0" />
          Right-click anything on the page and choose “hush this”.
        </div>
      ) : (
        list.map((r) => (
          <div key={r.s} className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50">
            <EyeOff className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm" title={r.s}>{r.l}</span>
            <button
              type="button"
              onClick={() => remove(r.s)}
              aria-label={`Show “${r.l}” again`}
              className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))
      )}
    </section>
  );
}

/* ------------------------------ muted words ------------------------------- */

export function MutedWords({ s, update }: { s: Settings; update(p: Partial<Settings>): unknown }) {
  const list = s.muted || [];
  const [draft, setDraft] = React.useState('');
  const add = () => {
    const w = draft.trim();
    if (w.length < 2 || list.some((x) => x.toLowerCase() === w.toLowerCase())) return;
    update({ muted: [...list, w] });
    setDraft('');
  };
  return (
    <section className="px-2 pt-3">
      <div className="text-xs font-medium text-muted-foreground">Muted words</div>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground/80">Posts, videos and games that mention these are hidden.</p>
      <form
        className="mt-2 flex items-center gap-1.5 rounded-md border bg-transparent px-2 focus-within:ring-[3px] focus-within:ring-ring/40"
        onSubmit={(e) => { e.preventDefault(); add(); }}
      >
        <MessageSquareOff className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="a word or phrase"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <button type="submit" aria-label="Mute" className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40" disabled={draft.trim().length < 2}>
          <Plus className="size-3.5" />
        </button>
      </form>
      {list.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {list.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-xs animate-in fade-in-0 zoom-in-95 duration-200">
              {w}
              <button
                type="button"
                aria-label={`Unmute ${w}`}
                onClick={() => update({ muted: list.filter((x) => x !== w) })}
                className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ time nudges ------------------------------- */

const NUDGES = [0, 20, 45, 90];
export function NudgeRow({ s, update }: { s: Settings; update(p: Partial<Settings>): unknown }) {
  const v = s.nudge || 0;
  return (
    <section className="px-2 pt-4">
      <div className="text-xs font-medium text-muted-foreground">Time nudges</div>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground/80">A quiet note after this long on a site each day.</p>
      <div className="mt-2 grid grid-cols-4 rounded-md border p-0.5 text-xs">
        {NUDGES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => update({ nudge: n })}
            className={cn('rounded-[5px] py-1.5 transition-colors', v === n ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {n ? `${n} min` : 'Off'}
          </button>
        ))}
      </div>
    </section>
  );
}
