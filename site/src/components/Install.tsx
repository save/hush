import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Download, FolderOpen, Puzzle, RotateCw } from 'lucide-react';
import manifest from '../../../manifest.json';
import { LINKS } from './brand';
import { useBrowser } from './browser';

const EASE = [0.32, 0.72, 0, 1] as const;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function CopyUrl() {
  // brave://, edge://, opera:// or chrome:// (Arc and the rest)
  const url = useBrowser().extensions;
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* the text is selectable anyway */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="group mt-4 flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-black/30 pr-1.5 pl-3 text-left font-mono text-[12.5px] text-fg transition-colors hover:border-white/15"
    >
      <span className="flex-1 truncate select-all">{url}</span>
      <span className="relative grid h-6 min-w-6 place-items-center rounded-md bg-white/[0.06] px-1.5 text-[11px] text-dim transition-colors group-hover:text-fg">
        <AnimatePresence mode="popLayout" initial={false}>
          {copied ? (
            <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 font-sans">
              <Check className="size-3.5" /> Copied
            </motion.span>
          ) : (
            <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Copy className="size-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

/* little pictures of what you'll see, drawn like the real thing */
function DevModeToggle() {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#1b1b1f] px-3 py-2.5 text-[12.5px] text-dim">
      <span>Developer mode</span>
      <span className={cx('relative h-[18px] w-8 rounded-full transition-colors duration-300', on ? 'bg-[#8ab4f8]' : 'bg-white/15')}>
        <motion.span
          className="absolute top-[3px] left-[3px] size-3 rounded-full bg-white shadow"
          animate={{ x: on ? 14 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </span>
    </div>
  );
}

function LoadUnpacked() {
  return (
    <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#1b1b1f] px-2 py-2 text-[12px] whitespace-nowrap">
      <span className="relative rounded-md border border-[#8ab4f8]/50 px-2 py-1 text-[#8ab4f8]">
        Load unpacked
        <motion.span
          className="absolute inset-0 rounded-md border border-[#8ab4f8]"
          animate={{ opacity: [0.7, 0], scale: [1, 1.18] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      </span>
      <span className="truncate rounded-md px-1.5 py-1 text-white/30">Pack extension</span>
      <span className="ml-auto flex items-center gap-1.5 pr-1 text-dim"><FolderOpen className="size-3.5" />hush</span>
    </div>
  );
}

const STEPS: { title: string; body: React.ReactNode; extra: React.ReactNode }[] = [
  {
    title: 'Download',
    body: <>One small zip. Unzip it anywhere you'll keep it, like Documents: you get a folder called <b className="font-medium text-fg">hush</b>.</>,
    extra: (
      <a
        href={LINKS.download}
        className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-medium text-black transition-transform active:scale-[0.97]"
      >
        <Download className="size-4" /> Download hush.zip
      </a>
    ),
  },
  {
    title: 'Open your extensions',
    body: <>Paste this in the address bar, then switch on <b className="font-medium text-fg">Developer mode</b>, top right.</>,
    extra: <><CopyUrl /><DevModeToggle /></>,
  },
  {
    title: 'Load it',
    body: <>Click <b className="font-medium text-fg">Load unpacked</b> and choose the hush folder. Pin it from the <Puzzle className="inline size-3.5 -translate-y-px" /> menu. Done.</>,
    extra: <LoadUnpacked />,
  },
];

export function Install() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl text-left">
      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.08 * i, ease: EASE }}
            className="flex flex-col rounded-2xl border border-white/[0.07] bg-panel/80 p-5 backdrop-blur"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded-full border border-white/10 font-mono text-[11px] text-dim">{i + 1}</span>
              <h3 className="text-[15px] font-medium tracking-[-0.01em]">{s.title}</h3>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-dim">{s.body}</p>
            <div className="mt-auto">{s.extra}</div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="mt-6 flex flex-col items-center gap-1.5 text-center text-[12.5px] text-faint"
      >
        <span>
          Version {manifest.version} · Chrome, Brave, Edge, Arc and Opera · The Chrome Web Store version is on its way, and will update itself.
        </span>
        <span className="flex items-center gap-1.5">
          <RotateCw className="size-3" /> To update: download again, replace the folder, press reload on hush's card.
        </span>
      </motion.div>
    </div>
  );
}
