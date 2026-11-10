import * as React from 'react';
import { EyeOff, MousePointerClick, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Settings } from './hush';

/* ---------------------------- the weekly report --------------------------- */

type Quiet = Record<string, Record<string, number>>; // { 'YYYY-MM-DD': { host: count } }

function useQuiet() {
  const [q, setQ] = React.useState<Quiet>({});
  React.useEffect(() => {
    const load = () => chrome.storage.local.get('quiet').then((r) => setQ((r.quiet as Quiet) || {}));
    load();
    const on = (_c: unknown, area: string) => area === 'local' && load();
    chrome.storage.onChanged.addListener(on);
    return () => chrome.storage.onChanged.removeListener(on);
  }, []);
  return q;
}

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
  const q = useQuiet();
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
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{n.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">Browse as usual. hush tallies what it hides here.</p>
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
