import * as React from 'react';
import { animate, AnimatePresence, motion, useInView, useMotionValue, useMotionTemplate, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight, Lock, RotateCw } from 'lucide-react';
import { icons, Logo, Mark } from './brand';
import { GhCalm, GhLoud, RbxCalm, RbxLoud, XCalm, XLoud, YtCalm, YtLoud } from './mocks';

const W = 1120; // design size of the page area; the whole browser scales from this
const H = 620;
const CHROME = 84; // tab strip + toolbar

const SITES = [
  { id: 'x', name: 'X', host: 'x.com/home', icon: icons.x, Loud: XLoud, Calm: XCalm, hidden: 14 },
  { id: 'yt', name: 'YouTube', host: 'youtube.com', icon: icons.youtube, Loud: YtLoud, Calm: YtCalm, hidden: 23 },
  { id: 'rbx', name: 'Roblox', host: 'roblox.com/home', icon: icons.roblox, Loud: RbxLoud, Calm: RbxCalm, hidden: 11 },
  { id: 'gh', name: 'GitHub', host: 'github.com/save/hush', icon: icons.github, Loud: GhLoud, Calm: GhCalm, hidden: 6 },
] as const;

const EASE = [0.65, 0, 0.35, 1] as const;

// ?freeze=loud|calm&site=0..3 holds the demo still: handy for screenshots
const Q = typeof location === 'undefined' ? null : new URLSearchParams(location.search);
const FREEZE = Q?.get('freeze') as 'loud' | 'calm' | null | undefined;
const START = Math.min(3, Math.max(0, Number(Q?.get('site')) || 0));

export function BrowserDemo() {
  const wrap = React.useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { margin: '-15% 0px' });
  const [scale, setScale] = React.useState(1);
  const [site, setSite] = React.useState(START);
  const [on, setOn] = React.useState(false);
  const pausedUntil = React.useRef(0);
  const anim = React.useRef<{ stop(): void } | null>(null);
  const reset = React.useCallback(() => { anim.current?.stop(); p.set(0); setOn(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // the sweep: 0 = loud page, 1 = hushed
  const p = useMotionValue(0);
  const clip = useTransform(p, (v) => `inset(0 0 ${(1 - v) * 100}% 0)`);
  const lineY = useTransform(p, (v) => v * H);
  const lineOpacity = useTransform(p, [0, 0.04, 0.92, 1], [0, 1, 1, 0]);
  const loudBlur = useTransform(p, [0, 1], [0, 3]);
  const loudFilter = useMotionTemplate`blur(${loudBlur}px) saturate(${useTransform(p, [0, 1], [1, 0.4])})`;

  // fit the fixed-size browser to the column
  React.useLayoutEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sweep = React.useCallback((to: boolean) => {
    setOn(to);
    anim.current?.stop();
    anim.current = animate(p, to ? 1 : 0, { duration: to ? 1.15 : 0.7, ease: EASE });
  }, [p]);

  // autoplay: loud beat → sweep → calm hold → next site
  React.useEffect(() => {
    if (FREEZE) { p.set(FREEZE === 'calm' ? 1 : 0); setOn(FREEZE === 'calm'); return; }
    if (!inView) return;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => alive && fn(), ms));
    const run = () => {
      if (Date.now() < pausedUntil.current) { at(pausedUntil.current - Date.now() + 50, run); return; }
      reset();
      at(1500, () => sweep(true));
      at(1500 + 1150 + 3400, () => {
        if (Date.now() < pausedUntil.current) { run(); return; }
        setSite((s) => (s + 1) % SITES.length);
        at(450, run);
      });
    };
    run();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [inView, sweep, reset, p]);

  const pickTimer = React.useRef<ReturnType<typeof setTimeout>>();
  const interact = () => { pausedUntil.current = Date.now() + 9000; };
  const pick = (i: number) => {
    interact();
    setSite(i);
    reset();
    clearTimeout(pickTimer.current);
    pickTimer.current = setTimeout(() => sweep(true), 450);
  };
  const toggle = () => { interact(); sweep(!on); };

  const S = SITES[site];

  return (
    <div ref={wrap} className="relative w-full" style={{ height: (H + CHROME) * scale }}>
      <div
        className="absolute top-0 left-1/2 origin-top overflow-hidden rounded-[14px] border border-white/10 bg-[#141417] shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8),0_0_0_1px_rgb(0_0_0/0.5)]"
        style={{ width: W, height: H + CHROME, transform: `translateX(-50%) scale(${scale})` }}
      >
        {/* tab strip */}
        <div className="flex h-10 items-end gap-1 bg-[#0e0e10] px-3">
          <div className="mr-3 mb-3 flex gap-1.5">
            {[0, 1, 2].map((i) => <span key={i} className="size-3 rounded-full bg-white/12" />)}
          </div>
          {SITES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => pick(i)}
              className={`relative flex h-8 w-[180px] items-center gap-2 rounded-t-lg px-3 text-[12px] transition-colors duration-200 ${i === site ? 'text-white' : 'text-white/45 hover:text-white/75'}`}
            >
              {i === site && <motion.span layoutId="tab" className="absolute inset-0 rounded-t-lg bg-[#1b1b1f]" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
              <Logo icon={s.icon} className="relative size-3.5" />
              <span className="relative">{s.name}</span>
            </button>
          ))}
        </div>
        {/* toolbar */}
        <div className="flex h-11 items-center gap-3 border-b border-white/[0.06] bg-[#1b1b1f] px-3 text-white/45">
          <ArrowLeft className="size-4" /><ArrowRight className="size-4 opacity-40" /><RotateCw className="size-3.5" />
          <div className="flex h-7 flex-1 items-center gap-2 rounded-full bg-black/35 px-3 text-[12.5px]">
            <Lock className="size-3" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={S.host} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }} className="text-white/70">
                {S.host}
              </motion.span>
            </AnimatePresence>
          </div>
          {/* the extension button */}
          <button
            onClick={toggle}
            aria-label={on ? 'Turn hush off' : 'Turn hush on'}
            className="relative grid size-8 place-items-center rounded-md text-white transition-colors hover:bg-white/10"
          >
            <Mark className="size-[18px]" />
            <motion.span
              className="absolute top-1 right-1 size-1.5 rounded-full bg-hush"
              animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            />
            {/* a ripple when it switches on */}
            <AnimatePresence>
              {on && (
                <motion.span
                  key={`ripple-${site}`}
                  className="absolute inset-0 rounded-md border border-white/40"
                  initial={{ opacity: 0.8, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* the page */}
        <div className="relative overflow-hidden" style={{ height: H }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={S.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div className="absolute inset-0" style={{ filter: loudFilter }}>
                <S.Loud />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
                <S.Calm />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* the sweep line: a hairline with a soft light trailing behind it */}
          <motion.div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ y: lineY, opacity: lineOpacity }}>
            <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-white/[0.06]" />
            <div className="absolute inset-x-0 top-0 h-px bg-white/80 shadow-[0_0_24px_4px_rgb(255_255_255/0.35)]" />
          </motion.div>

          {/* toast, like the real one */}
          <AnimatePresence>
            {on && (
              <motion.div
                key={`toast-${site}`}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.9, type: 'spring', stiffness: 380, damping: 30 } }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
                className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border border-white/10 bg-[#18181b]/95 px-3.5 py-2.5 text-[13px] text-white shadow-2xl backdrop-blur"
              >
                <span className="size-1.5 rounded-full bg-hush" />
                hush on for {S.host.split('/')[0]}
                <span className="text-white/45">· {S.hidden} things hidden</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
