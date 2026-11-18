import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Pause, SkipBack, SkipForward } from 'lucide-react';
import { icons } from './brand';

const EASE = [0.32, 0.72, 0, 1] as const;
const SPRING = { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 } as const;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

// The top island, played out on a pretend page: the same black pill, sizes and states as
// src/core/live.js, so what you see here is what you get in the browser.

type Step = 'playing' | 'away' | 'timer' | 'notice';
const STEPS: { id: Step; title: string; body: string }[] = [
  { id: 'playing', title: 'Now playing', body: 'Spotify, YouTube, SoundCloud and more, from any tab. Point at it for the controls.' },
  { id: 'away', title: 'Out of the way', body: 'It finds a gap in each site’s header, so it never sits on a search box. Or drag it anywhere.' },
  { id: 'timer', title: 'Timers', body: 'Type “timer 25 study” in Ctrl K. The countdown follows you to every tab.' },
  { id: 'notice', title: 'Notifications', body: 'A Roblox message, an X reply, a GitHub ping: it drops in on whatever tab you’re on. Click to jump there.' },
];
const DWELL = 4600;

const ART = 'linear-gradient(135deg,#ff2a4f 0%,#b02cff 55%,#3a2cff 100%)';

function Wave({ playing = true, className }: { playing?: boolean; className?: string }) {
  return (
    <span className={cx('flex h-3.5 items-center gap-[2.5px]', className)}>
      {[0, 1, 2, 3].map((k) => (
        <motion.i
          key={k}
          className="block w-[3px] rounded-full bg-[#1ed760]"
          animate={playing ? { height: [4, 13, 6, 11, 4] } : { height: 4 }}
          transition={playing ? { duration: 1.05, repeat: Infinity, delay: k * 0.13, ease: 'easeInOut' } : { duration: 0.3 }}
        />
      ))}
    </span>
  );
}

function useCountdown(active: boolean) {
  const [s, setS] = React.useState(25 * 60);
  React.useEffect(() => {
    if (!active) return;
    setS(25 * 60);
    const t = setInterval(() => setS((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [active]);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function useProgress(active: boolean) {
  const [p, setP] = React.useState(62);
  React.useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setP((v) => (v >= 243 ? 0 : v + 1)), 1000);
    return () => clearInterval(t);
  }, [active]);
  const f = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return { pos: f(p), left: '-' + f(243 - p), pct: (p / 243) * 100 };
}

type View = 'compact' | 'media' | 'timer' | 'notice';
const SIZE: Record<View, [number, number, number]> = { compact: [208, 34, 17], media: [372, 158, 40], timer: [150, 34, 17], notice: [360, 68, 34] };

const layer = {
  initial: { opacity: 0, filter: 'blur(6px)', scale: 0.94 },
  animate: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.35, delay: 0.08, ease: EASE } },
  exit: { opacity: 0, filter: 'blur(6px)', scale: 0.96, transition: { duration: 0.14 } },
};

function Pill({ view, x, onHover }: { view: View; x: number; onHover: (on: boolean) => void }) {
  const [w, h, r] = SIZE[view];
  const time = useCountdown(view === 'timer');
  const prog = useProgress(view === 'media' || view === 'compact');
  return (
    <motion.div
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      className="absolute top-2.5 z-10 overflow-hidden bg-black text-white shadow-[0_10px_34px_-10px_rgba(0,0,0,.55)]"
      initial={false}
      animate={{ width: Math.min(w, 9999), height: h, borderRadius: r, left: x - w / 2 }}
      transition={SPRING}
      style={{ cursor: 'grab' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {view === 'compact' && (
          <motion.div key="c" {...layer} className="absolute inset-0 flex items-center justify-between px-[7px]">
            <span className="size-[22px] rounded-[7px]" style={{ background: ART }} />
            <Wave className="mr-1.5" />
          </motion.div>
        )}
        {view === 'media' && (
          <motion.div key="m" {...layer} className="absolute inset-0 flex flex-col px-[18px] pt-[16px] pb-3">
            <div className="flex items-center gap-3">
              <span className="size-[52px] shrink-0 rounded-[12px]" style={{ background: ART }} />
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">Midnight City</div>
                <div className="truncate text-[12.5px] text-white/50">M83</div>
              </div>
              <Wave />
            </div>
            <div className="mt-3.5 flex items-center gap-2.5 font-mono text-[10.5px] text-white/55 tabular-nums">
              <span>{prog.pos}</span>
              <span className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/20">
                <span className="absolute inset-y-0 left-0 rounded-full bg-white/85 transition-[width] duration-1000 ease-linear" style={{ width: prog.pct + '%' }} />
              </span>
              <span>{prog.left}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-9">
              <SkipBack className="size-[18px] fill-white" />
              <Pause className="size-[26px] fill-white" />
              <SkipForward className="size-[18px] fill-white" />
            </div>
          </motion.div>
        )}
        {view === 'timer' && (
          <motion.div key="t" {...layer} className="absolute inset-0 flex items-center justify-between pr-3.5 pl-2.5 text-[#ff9f0a]">
            <Clock className="size-[17px]" />
            <span className="font-mono text-[13px] font-medium tabular-nums">{time}</span>
          </motion.div>
        )}
        {view === 'notice' && (
          <motion.div key="n" {...layer} className="absolute inset-0 flex items-center gap-3 pr-[18px] pl-3.5 text-left">
            <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#3a3a3c] shadow-[inset_0_0_0_.5px_rgba(255,255,255,.14)]">
              <svg viewBox="0 0 24 24" className="size-[21px] fill-white"><path d={icons.roblox.path} /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">Alex</span>
              <span className="mt-0.5 block truncate text-[13px] text-white/60">you on? join my server, we need one more</span>
            </span>
            <span className="mt-[-18px] text-[11.5px] whitespace-nowrap text-white/40">Roblox · now</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* a pretend site: a header with a search box in the middle, and a few quiet rows */
function Page({ busy }: { busy: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#f5f5f4] text-left">
      <div className="flex h-[54px] items-center gap-4 border-b border-black/[0.06] bg-white px-4 sm:px-5">
        <span className="size-6 shrink-0 rounded-[7px] bg-[#e5484d]" />
        <span className="hidden h-2 w-14 rounded-full bg-black/10 md:block" />
        <span className="hidden h-2 w-10 rounded-full bg-black/10 md:block" />
        <motion.span
          className="mx-auto hidden h-9 w-[38%] items-center gap-2 rounded-full bg-black/[0.05] px-3.5 sm:flex"
          animate={{ boxShadow: busy ? 'inset 0 0 0 1.5px rgba(229,72,77,.55)' : 'inset 0 0 0 1.5px rgba(229,72,77,0)' }}
          transition={{ duration: 0.4 }}
        >
          <span className="size-3 rounded-full border-[1.5px] border-black/25" />
          <span className="h-2 w-16 rounded-full bg-black/10" />
        </motion.span>
        <span className="ml-auto size-7 shrink-0 rounded-full bg-black/10 sm:ml-0" />
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {[0, 1, 2].map((k) => (
          <div key={k} className={cx('rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.04)]', k > 0 && 'hidden sm:block')}>
            <div className="aspect-video rounded-lg bg-black/[0.06]" />
            <div className="mt-3 h-2 w-4/5 rounded-full bg-black/10" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-black/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IslandShowcase() {
  const stage = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(900);
  const [step, setStep] = React.useState(0);
  const [hover, setHover] = React.useState(false);
  const [phase, setPhase] = React.useState(0); // within a step: 0 = arriving, 1 = settled
  const [inView, setInView] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const [run, setRun] = React.useState(0); // a click replays the step

  React.useEffect(() => {
    const el = stage.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  // walk through the steps while it's on screen (and you're not pointing at the pill)
  React.useEffect(() => {
    setPhase(0);
    const a = setTimeout(() => setPhase(1), 1300);
    if (!inView || hover || held) return () => clearTimeout(a);
    const b = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), DWELL);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [step, inView, hover, held, run]);

  const id = STEPS[step].id;
  const narrow = width < 640;
  // the gap between the logo and the search box (on a phone there's no search box)
  const gap = narrow ? width / 2 : Math.max(width * 0.2, 120);
  let view: View = 'compact';
  let x = gap;
  if (id === 'playing') view = phase || hover ? 'media' : 'compact';
  if (id === 'away') { view = hover ? 'media' : 'compact'; x = phase || narrow ? gap : width / 2; }
  if (id === 'timer') view = 'timer';
  if (id === 'notice') view = 'notice';
  if (hover && id !== 'timer' && id !== 'notice') view = 'media';
  // keep the open player on the stage
  const half = SIZE[view][0] / 2 + 10;
  x = Math.min(Math.max(x, half), width - half);
  const busy = id === 'away' && !phase && !narrow;

  return (
    <section id="island" className="mx-auto max-w-5xl scroll-mt-24 px-4 pt-40">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mx-auto max-w-4xl"
      >
        <p className="text-[13px] font-medium text-faint">Dynamic island</p>
        <h2 className="mt-3 max-w-2xl text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
          A little black pill <span className="text-white/40">that only shows up when something’s happening.</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        className="mt-10 rounded-[22px] border border-white/[0.07] bg-panel p-2"
      >
        <div ref={stage} className="relative h-[260px] overflow-hidden rounded-[16px] sm:h-[300px]">
          <Page busy={busy} />
          <Pill view={view} x={x} onHover={setHover} />
        </div>
      </motion.div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4" onPointerLeave={() => setHeld(false)}>
        {STEPS.map((s, k) => (
          <button
            key={s.id}
            onClick={() => { setStep(k); setHeld(true); setRun((r) => r + 1); }}
            className={cx(
              'relative overflow-hidden rounded-xl border p-4 text-left transition-colors duration-300',
              k === step ? 'border-white/[0.12] bg-white/[0.04]' : 'border-white/[0.05] hover:border-white/[0.1]',
            )}
          >
            <div className={cx('text-[14px] font-semibold tracking-tight transition-colors', k === step ? 'text-fg' : 'text-dim')}>{s.title}</div>
            <p className={cx('mt-1 text-[13px] leading-snug transition-colors', k === step ? 'text-dim' : 'text-faint')}>{s.body}</p>
            {k === step && (
              <motion.span
                key={step + (inView && !hover && !held ? '-run' : '-hold')}
                className="absolute bottom-0 left-0 h-px bg-white/50"
                initial={{ width: '0%' }}
                animate={{ width: inView && !hover && !held ? '100%' : '0%' }}
                transition={{ duration: inView && !hover && !held ? DWELL / 1000 : 0.2, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>
      <p className="mt-5 text-center text-[13px] text-faint">
        On by default. Toggle it with{' '}
        <kbd className="whitespace-nowrap rounded border border-white/10 bg-white/[0.04] px-1 font-mono text-[12px]">Alt ⇧ I</kbd>, double-click it to send it home.
      </p>
    </section>
  );
}
