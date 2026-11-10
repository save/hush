import * as React from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check, Command, Heart, Pause, Play, Star } from 'lucide-react';
import { Shader } from './components/Shader';
import { BrowserDemo } from './components/BrowserDemo';
import { SitesStrip } from './components/SitesStrip';
import { photo } from './components/mocks';
import { icons, LINKS, Logo, Mark } from './components/brand';

const EASE = [0.32, 0.72, 0, 1] as const;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/* fade + rise + unblur when scrolled into view */
function Reveal({ children, delay = 0, className, y = 16 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ buttons -------------------------------- */

function ChromeButton({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <a
      href={LINKS.chrome}
      className={cx(
        'group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-white font-medium text-black transition-transform duration-200 active:scale-[0.97]',
        size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4.5 text-sm',
      )}
    >
      {/* a light that passes over on hover */}
      <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-black/[0.07] transition-transform duration-700 ease-out group-hover:translate-x-[300%]" />
      <Logo icon={icons.chrome} className="size-4" />
      Add to Chrome
      <span className="text-black/40">· free</span>
    </a>
  );
}

function GithubButton({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <a
      href={LINKS.github}
      className={cx(
        'inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.03] font-medium text-white backdrop-blur transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.07] active:scale-[0.97]',
        size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4.5 text-sm',
      )}
    >
      <Logo icon={icons.github} className="size-4" />
      View on GitHub
      <ArrowUpRight className="size-3.5 text-white/40" />
    </a>
  );
}

/* -------------------------------- nav ---------------------------------- */

function Nav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = React.useState(false);
  React.useEffect(() => scrollY.on('change', (v) => setSolid(v > 24)), [scrollY]);
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <nav
        className={cx(
          'flex h-12 w-full max-w-5xl items-center gap-6 rounded-full px-3 pl-4 transition-all duration-500',
          solid ? 'border border-white/[0.08] bg-[#0b0b0d]/75 backdrop-blur-xl' : 'border border-transparent',
        )}
      >
        <a href="#" className="flex items-center gap-2">
          <img src="./logo-96.png" alt="" className="size-6 rounded-[7px]" />
          <span className="text-[15px] font-semibold tracking-tight">hush</span>
        </a>
        <div className="hidden items-center gap-5 text-[13px] text-dim sm:flex">
          <a href="#sites" className="transition-colors hover:text-fg">Sites</a>
          <a href="#features" className="transition-colors hover:text-fg">Features</a>
          <a href="#source" className="transition-colors hover:text-fg">Open source</a>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href={LINKS.github} aria-label="GitHub" className="grid size-9 place-items-center rounded-full text-dim transition-colors hover:bg-white/5 hover:text-fg">
            <Logo icon={icons.github} className="size-4" />
          </a>
          <a href={LINKS.chrome} className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-medium text-black transition-transform active:scale-[0.97]">
            <Logo icon={icons.chrome} className="size-3.5" />
            <span className="hidden sm:inline">Add to Chrome</span>
            <span className="sm:hidden">Install</span>
          </a>
        </div>
      </nav>
    </motion.header>
  );
}

/* -------------------------------- hero --------------------------------- */

function Words({ text, delay, className }: { text: string; delay: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: delay + i * 0.07, ease: EASE }}
        >
          {w + ' '}
        </motion.span>
      ))}
    </span>
  );
}

function Hero() {
  const demo = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: demo, offset: ['start end', 'start 25%'] });
  const prog = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const rotateX = useTransform(prog, [0, 1], [24, 0]);
  const scale = useTransform(prog, [0, 1], [0.9, 1]);
  const y = useTransform(prog, [0, 1], [40, 0]);

  return (
    <section className="relative">
      {/* the shader sits in an inset panel: room at the top and sides, fading out below */}
      <div className="absolute inset-x-2.5 top-2.5 h-[calc(100svh+40px)] min-h-[680px] overflow-hidden rounded-[28px] border border-white/[0.06] sm:inset-x-4 sm:top-4">
        <Shader className="absolute inset-0 size-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-ink" />
        <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),inset_0_0_80px_rgb(0_0_0/0.6)]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-4 pt-24 pb-40 text-center">
        <motion.a
          href={LINKS.github}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          className="group relative mb-8 inline-flex overflow-hidden rounded-full p-px text-[12.5px] text-dim transition-colors hover:text-fg"
        >
          {/* a faint resting border, and a light that spins behind it */}
          <span className="absolute inset-0 rounded-full bg-white/10" />
          <span className="beam-spin absolute top-1/2 left-1/2 aspect-square w-[160%] bg-[conic-gradient(from_0deg,transparent_0%,transparent_62%,rgb(255_255_255/0.25)_74%,rgb(255_255_255/0.95)_86%,oklch(0.72_0.19_25)_93%,transparent_100%)]" />
          <span className="relative inline-flex items-center gap-2 rounded-full bg-[#0c0c0f] py-1 pr-3 pl-1.5">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-fg">New</span>
            Free and open source, for Chrome
            <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </motion.a>

        <h1 className="text-[clamp(2.6rem,7.5vw,5.6rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
          <Words text="The web is loud." delay={0.45} className="block text-white/35" />
          <span className="block">
            <motion.img
              src="./logo.png"
              alt=""
              className="mr-[0.18em] -mt-[0.12em] inline-block size-[0.86em] rounded-[22%] align-middle shadow-[0_10px_40px_-8px_rgb(220_70_55/0.45)]"
              initial={{ opacity: 0, scale: 0.6, rotate: -12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.85 }}
            />
            <Words text="hush turns it down." delay={0.9} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.5, ease: EASE }}
          className="mt-7 max-w-xl text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed text-pretty text-dim"
        >
          A free extension that strips the promos, badges and noise from X, YouTube and Roblox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <ChromeButton size="lg" />
          <GithubButton size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.1 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-faint"
        >
          {['Free forever', 'No account', 'Nothing leaves your browser'].map((t) => (
            <span key={t} className="flex items-center gap-1.5"><Check className="size-3.5" />{t}</span>
          ))}
        </motion.div>
      </div>

      {/* the demo rises and flattens as you scroll to it */}
      <div ref={demo} className="relative mx-auto -mt-28 max-w-[1180px] px-4 [perspective:1600px]">
        <motion.div style={{ rotateX, scale, y, transformOrigin: '50% 0%' }} className="will-change-transform">
          <BrowserDemo />
        </motion.div>
        <Reveal className="mt-6 flex items-center justify-center gap-2 text-[13px] text-faint">
          Click a tab, or the
          <Mark className="size-4 text-dim" />
          button to flip it yourself.
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- sites --------------------------------- */

function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty('--x', `${e.clientX - r.left}px`);
    ref.current!.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cx(
        'group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-panel',
        'before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100',
        'before:bg-[radial-gradient(420px_circle_at_var(--x)_var(--y),rgb(255_255_255/0.06),transparent_60%)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------ features ------------------------------- */

function PaletteDemo() {
  const items = ['Mute “crypto”', 'Show “Arsenal” again', 'Calm titles', 'Image colour: 90%', 'Time nudges: 45 min'];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 1400);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0b0b0d] p-1.5 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-2.5 pb-2 pt-1 text-[13px] text-faint">
        <Command className="size-3.5" /> Type a command…
      </div>
      <div className="relative mt-1.5">
        <motion.div
          className="absolute inset-x-0 h-8 rounded-md bg-white/[0.07]"
          animate={{ y: i * 32 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
        {items.map((t, k) => (
          <div key={t} className={cx('relative flex h-8 items-center justify-between px-2.5 text-[13px] transition-colors duration-200', k === i ? 'text-fg' : 'text-dim')}>
            {t}
            <span className={cx('h-4 w-7 rounded-full p-0.5 transition-colors duration-300', k % 2 ? 'bg-white' : 'bg-white/15')}>
              <span className={cx('block size-3 rounded-full transition-transform duration-300', k % 2 ? 'translate-x-3 bg-black' : 'bg-white/70')} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColourDemo() {
  const [v, setV] = React.useState(90);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl">
        <div className="grid grid-cols-3 gap-1.5" style={{ filter: `saturate(${v / 100})`, transition: 'filter .15s' }}>
          {[1015, 582, 766, 106, 984, 1011].map((id) => (
            <img key={id} src={photo(id, 320, 180)} alt="" className="aspect-video w-full rounded-md object-cover" loading="lazy" />
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[12px] text-faint">Image colour</span>
        <input
          type="range" min={0} max={100} value={v}
          onChange={(e) => setV(+e.target.value)}
          aria-label="Image colour"
          className="hush-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
          style={{ backgroundImage: `linear-gradient(#fafafa,#fafafa)`, backgroundSize: `${v}% 100%`, backgroundRepeat: 'no-repeat' }}
        />
        <span className="w-9 text-right font-mono text-[12px] tabular-nums text-dim">{v}%</span>
      </div>
    </div>
  );
}

function MenuDemo() {
  const [mode, setMode] = React.useState<'words' | 'icons' | 'both'>('both');
  const rows = [['home', '⌂'], ['explore', '⌕'], ['messages', '✉'], ['profile', '◯']];
  return (
    <div>
      <div className="flex rounded-lg border border-white/[0.08] p-0.5 text-[12px]">
        {(['words', 'icons', 'both'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cx('relative flex-1 rounded-md py-1.5 transition-colors', mode === m ? 'text-fg' : 'text-faint hover:text-dim')}>
            {mode === m && <motion.span layoutId="menu-seg" className="absolute inset-0 rounded-md bg-white/[0.08]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{m}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="mt-4 flex flex-col gap-1" transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
        {rows.map(([l, ic], k) => (
          <motion.div layout key={l} className={cx('flex h-8 items-center gap-3 rounded-md px-2.5 text-[13px]', k === 0 ? 'bg-white/[0.06] text-fg' : 'text-dim')}>
            <AnimatePresence initial={false}>
              {mode !== 'words' && (
                <motion.span key="i" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} className="w-4 text-center">{ic}</motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {mode !== 'icons' && (
                <motion.span key="w" layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}>{l}</motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function MotionDemo() {
  const [still, setStill] = React.useState(true);
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid aspect-video w-36 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/[0.04]">
        <div className="flex items-end gap-1">
          {[0, 1, 2, 3, 4].map((k) => (
            <motion.span
              key={k}
              className="w-1.5 rounded-full bg-white/50"
              animate={still ? { height: 6 } : { height: [6, 24, 10, 20, 6] }}
              transition={still ? { duration: 0.4 } : { duration: 1.1, repeat: Infinity, delay: k * 0.12, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
      <button
        onClick={() => setStill((s) => !s)}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 px-3 text-[12.5px] text-dim transition-colors hover:border-white/20 hover:text-fg"
      >
        {still ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        {still ? 'still: nothing autoplays' : 'off: everything moves'}
      </button>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-40">
      <Reveal>
        <p className="text-[13px] font-medium text-faint">Features</p>
        <h2 className="mt-3 max-w-2xl text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance">
          Quiet by default.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-3 md:grid-cols-6">
        <Reveal className="md:col-span-3">
          <Spotlight className="h-full p-6">
            <div className="flex items-center gap-1.5 text-[12px] text-faint">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[11px] text-dim">Ctrl</kbd>
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[11px] text-dim">K</kbd>
            </div>
            <h3 className="mt-3 font-semibold tracking-tight">Ctrl K for everything</h3>
            <p className="mt-1.5 text-[14px] text-dim">Mute a word, bring something back, flip any switch.</p>
            <div className="mt-6"><PaletteDemo /></div>
          </Spotlight>
        </Reveal>
        <Reveal className="md:col-span-3" delay={0.08}>
          <Spotlight className="h-full p-6">
            <h3 className="font-semibold tracking-tight">Colour that sits back</h3>
            <p className="mt-1.5 text-[14px] text-dim">Thumbnails stop shouting. You pick how much.</p>
            <div className="mt-6"><ColourDemo /></div>
          </Spotlight>
        </Reveal>
        <Reveal className="md:col-span-2" delay={0.04}>
          <Spotlight className="h-full p-6">
            <h3 className="font-semibold tracking-tight">Words, icons or both</h3>
            <p className="mt-1.5 text-[14px] text-dim">Your menu, your way.</p>
            <div className="mt-5"><MenuDemo /></div>
          </Spotlight>
        </Reveal>
        <Reveal className="md:col-span-4" delay={0.1}>
          <Spotlight className="h-full p-6">
            <h3 className="font-semibold tracking-tight">Still motion</h3>
            <p className="mt-1.5 text-[14px] text-dim">Nothing plays until you press play.</p>
            <div className="mt-6"><MotionDemo /></div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-6">
              {[['160', 'fps while scrolling'], ['0', 'trackers'], ['0 B', 'sent anywhere']].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-semibold tracking-tight tabular-nums">{n}</div>
                  <div className="mt-0.5 text-[12px] text-faint">{l}</div>
                </div>
              ))}
            </div>
          </Spotlight>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- open source ------------------------------ */

const CODE: [string, string][][] = [
  [['k', 'Hush'], ['p', '.'], ['f', 'register'], ['p', '({']],
  [['p', '  id: '], ['s', "'yt'"], ['p', ', name: '], ['s', "'YouTube'"], ['p', ',']],
  [['p', '  options: [{ key: '], ['s', "'noshorts'"], ['p', ' }],']],
  [['p', '  '], ['f', 'setup'], ['p', '(ctx) {']],
  [['c', '    // calm the page, and keep it calm']],
  [['p', '    ctx.'], ['f', 'keys'], ['p', '({ '], ['s', "'g h'"], ['p', ': () => '], ['f', 'go'], ['p', '('], ['s', "'/'"], ['p', ') });']],
  [['p', '  },']],
  [['p', '});']],
];
const TOK: Record<string, string> = { k: 'text-fg', f: 'text-[#d4d4d8]', s: 'text-[#a1a1aa]', p: 'text-faint', c: 'text-white/25 italic' };

function OpenSource() {
  return (
    <section id="source" className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-40">
      <Spotlight className="grid gap-8 p-7 md:grid-cols-2 md:p-10">
        <Reveal>
          <div className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <Logo icon={icons.github} className="size-6" />
          </div>
          <h2 className="mt-6 text-[clamp(1.5rem,2.8vw,2.1rem)] leading-[1.05] font-semibold tracking-[-0.035em]">
            Open source.<br /><span className="text-white/40">Read every line.</span>
          </h2>
          <p className="mt-4 max-w-sm text-dim">
            It stores nothing but your settings. Check for yourself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GithubButton />
            <a href={LINKS.github} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-dim transition-colors hover:text-fg">
              <Star className="size-4" /> Star it
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="self-center">
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0b0d]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 font-mono text-[11.5px] text-faint">
              src/sites/youtube.js
            </div>
            <pre className="overflow-x-auto p-4 [scrollbar-width:none] font-mono text-[12.5px] leading-6">
              {CODE.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease: EASE }}
                >
                  <span className="mr-4 inline-block w-4 text-right text-white/15 select-none">{i + 1}</span>
                  {line.map(([t, s], k) => <span key={k} className={TOK[t]}>{s}</span>)}
                </motion.div>
              ))}
            </pre>
          </div>
        </Reveal>
      </Spotlight>
    </section>
  );
}

/* ------------------------------ closing -------------------------------- */

function Closing() {
  return (
    <section id="install" className="relative mx-auto max-w-5xl scroll-mt-24 px-4 pt-44 pb-20 text-center">
      {/* the silk again, fading out at every edge */}
      <div className="pointer-events-none absolute inset-x-0 top-16 bottom-0 -z-0 [mask-image:radial-gradient(ellipse_55%_55%_at_50%_55%,#000_20%,transparent_75%)] opacity-80">
        <Shader className="size-full" startCalm />
      </div>
      <Reveal className="relative">
        <img src="./logo.png" alt="" className="mx-auto size-16 rounded-[18px] shadow-[0_20px_60px_-12px_rgb(220_70_55/0.45)]" />
        <h2 className="mt-8 text-[clamp(2rem,5vw,3.6rem)] leading-[0.98] font-semibold tracking-[-0.045em]">Turn it down.</h2>
        <p className="mx-auto mt-5 max-w-md text-dim">Free, forever. Install in a second, switch it off per site with <kbd className="whitespace-nowrap rounded border border-white/10 bg-white/[0.04] px-1 font-mono text-[12px]">Alt ⇧ H</kbd>.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <ChromeButton size="lg" />
          <GithubButton size="lg" />
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4">
        <div className="hairline" />
        <div className="mt-8 flex flex-col items-start justify-between gap-6 text-[13px] text-faint sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <img src="./logo-96.png" alt="" className="size-5 rounded-[6px]" />
            <span className="text-dim">hush</span>
            <span>· made quietly</span>
          </div>
          <div className="flex items-center gap-5">
            <a href={LINKS.github} className="transition-colors hover:text-fg">GitHub</a>
            <a href={LINKS.support} className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"><Heart className="size-3.5" />Support</a>
            <a href="#source" className="transition-colors hover:text-fg">Privacy: we collect nothing</a>
          </div>
        </div>
      </div>
      {/* the brand, as big as the page allows, sinking off the bottom edge */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
        aria-hidden="true"
        className="pointer-events-none mt-10 -mb-[0.24em] flex items-center justify-center text-[clamp(7rem,31vw,27rem)] leading-[0.8] font-semibold tracking-[-0.07em] select-none"
      >
        <span className="bg-gradient-to-b from-white/[0.16] to-white/[0.015] bg-clip-text text-transparent">hush</span>
      </motion.div>
    </footer>
  );
}

export function App() {
  // ?shot renders only the demo window (README screenshots, social images)
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('shot')) {
    return (
      <div className="shot grid min-h-svh place-items-center bg-ink p-10">
        <div className="w-full max-w-[1120px]"><BrowserDemo /></div>
      </div>
    );
  }
  return (
    <div className="grain">
      <Nav />
      <main>
        <Hero />
        <SitesStrip />
        <Features />
        <OpenSource />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
