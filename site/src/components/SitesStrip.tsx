import * as React from 'react';
import { motion } from 'motion/react';
import { icons, Logo } from './brand';

const EASE = [0.32, 0.72, 0, 1] as const;

// Supported sites as one slow line of type: big, monochrome, nothing to read twice.
const ITEMS: { icon?: { path: string; title: string }; name: string; dim?: boolean }[] = [
  { icon: icons.x, name: 'X' },
  { icon: icons.youtube, name: 'YouTube' },
  { icon: icons.roblox, name: 'Roblox' },
  { name: 'and every other site', dim: true },
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((it) => (
        <React.Fragment key={it.name}>
          <span
            className={`flex items-center gap-[0.28em] px-[0.55em] whitespace-nowrap transition-colors duration-300 ${
              it.dim ? 'font-normal text-white/25 italic' : 'text-white/85 hover:text-white'
            }`}
          >
            {it.icon && <Logo icon={it.icon} className="size-[0.72em]" />}
            {it.name}
          </span>
          <span className="size-[0.14em] shrink-0 rounded-full bg-white/20" />
        </React.Fragment>
      ))}
    </div>
  );
}

export function SitesStrip() {
  return (
    <section id="sites" className="scroll-mt-24 pt-40">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        className="text-center text-[13px] font-medium text-faint"
      >
        Built for
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.1 }}
        className="marquee mt-6 overflow-hidden py-2 text-[clamp(2.4rem,6vw,4.75rem)] leading-none font-semibold tracking-[-0.04em] [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
      >
        <div className="marquee-track flex w-max">
          <Row />
          <Row hidden />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        className="mx-auto mt-6 max-w-md px-4 text-center text-[15px] text-dim"
      >
        A tailored layout for each of these. Still motion and soft colour everywhere else.
      </motion.p>
    </section>
  );
}
