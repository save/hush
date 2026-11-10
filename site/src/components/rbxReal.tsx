import * as React from 'react';
import {
  ArrowLeftRight, Bell, Gift, Home, Lock, MessageSquare, Newspaper, Package, Search, Settings, Shirt, Store, ThumbsUp, User, Users,
} from 'lucide-react';
import { Robux } from './rbx';

/*
 * Roblox home, 1:1 with roblox.com (light theme) and with hush on it.
 * Built at Roblox's real size (1440 wide) from measurements of the live
 * page, then scaled into the demo frame. Thumbnails are the games' real
 * ones, saved in /public/rbx. Only general-audience games are used.
 */

export const REAL_W = 1440;

/** Render children at real-site size, scaled to fill a 1120×620 frame. */
export function Real({ children, w = REAL_W }: { children: React.ReactNode; w?: number }) {
  const s = 1120 / w;
  return (
    <div className="absolute top-0 left-0 origin-top-left overflow-hidden" style={{ width: w, height: 620 / s, transform: `scale(${s})` }}>
      {children}
    </div>
  );
}

type G = { name: string; img: string; rate: number };
const ROW1: G[] = [
  { name: 'Steal An Egg', img: 'steal-an-egg', rate: 91 },
  { name: '[🎃] Blox Fruits', img: 'blox-fruits', rate: 92 },
  { name: '[RANKED] Huss Valley', img: 'huss-valley', rate: 87 },
  { name: 'Arsenal', img: 'arsenal', rate: 88 },
];
const ROW2: G[] = [
  { name: 'RIVALS', img: 'rivals', rate: 93 },
  { name: '[🔥UPD] Sniper Arena', img: 'sniper-arena', rate: 91 },
  { name: '[🎃] Speed Run 4', img: 'speed-run-4', rate: 73 },
  { name: 'Natural Disaster Survival', img: 'natural-disaster', rate: 90 },
];
const MISSING: G[] = [
  { name: 'Draw and Guess!', img: 'draw-and-guess', rate: 56 },
  { name: 'Draw Me! 🎨', img: 'draw-me', rate: 87 },
  { name: 'Spray Paint!', img: 'spray-paint', rate: 82 },
  { name: 'Doodle Transform!', img: 'doodle-transform', rate: 70 },
  { name: 'Steal An Egg', img: 'steal-an-egg', rate: 91 },
];

const thumb = (k: string) => `./rbx/${k}.jpg`;
const ME = './rbx/me.png';
const USER = 'blockbuddy';

const FONT_RBX = '"Builder Sans", "Segoe UI", Helvetica, Arial, sans-serif';
const FONT_HUSH = '"Geist Variable", Inter, system-ui, sans-serif';
const HUSH_RED = 'oklch(0.66 0.21 25)';

function Wordmark({ size = 22, color = '#202227' }: { size?: number; color?: string }) {
  return (
    <span style={{ fontSize: size, color, letterSpacing: '0.02em' }} className="font-black whitespace-nowrap">
      R<span className="inline-block" style={{ transform: 'rotate(15deg)' }}>O</span>BLOX
    </span>
  );
}

/* ------------------------------- today ---------------------------------- */

export function RbxLoud() {
  const nav: [React.ElementType, string, string?][] = [
    [Home, 'Home'], [User, 'Profile'], [Robux, 'Roblox Plus'], [MessageSquare, 'Messages', '1'], [Users, 'Friends'], [Shirt, 'Avatar'],
    [Package, 'Inventory'], [ArrowLeftRight, 'Trade'], [Users, 'Communities'], [Newspaper, 'Newsroom'], [Store, 'Official Store'], [Gift, 'Buy Gift Cards'],
  ];
  return (
    <Real>
      <div className="flex h-full flex-col bg-white text-[#202227]" style={{ fontFamily: FONT_RBX }}>
        {/* header, 40px */}
        <div className="flex h-10 shrink-0 items-center bg-[#f7f7f8] px-5 text-[16px]">
          <Wordmark />
          <div className="ml-14 flex gap-[66px] font-semibold"><span>Charts</span><span>Marketplace</span><span>Create</span><span>Robux</span></div>
          <div className="ml-6 flex h-7 w-[214px] items-center gap-2 rounded-lg bg-[rgb(27_37_75/0.08)] px-2.5 text-[15px] text-[#202227]/60">
            <Search className="size-4" />Search
          </div>
          <div className="ml-auto flex items-center gap-5">
            <span className="flex items-center gap-2 text-[12px] font-semibold"><img src={ME} alt="" className="size-7 rounded-full bg-[#e3e5e8]" />{USER}</span>
            <Bell className="size-5" strokeWidth={1.7} />
            <span className="flex items-center gap-1 text-[14px] font-semibold"><Robux className="size-5" />0</span>
            <Settings className="size-5" strokeWidth={1.7} />
            <span className="rounded-lg bg-[#335fff] px-3 py-1.5 text-[12px] font-semibold text-white">Download</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* left nav, 289px */}
          <aside className="w-[289px] shrink-0 bg-white px-4 pt-3">
            <div className="mb-2 flex items-center gap-3 px-2 py-1.5">
              <img src={ME} alt="" className="size-8 rounded-full bg-[#e3e5e8]" />
              <span className="text-[16px] font-bold">{USER}</span>
              <span className="rounded-full border border-[#202227]/20 px-2 py-0.5 text-[12px] font-semibold">Unchecked</span>
            </div>
            {nav.map(([I, l, b], i) => (
              <div key={l} className={`flex h-12 items-center gap-2 rounded-lg px-1 ${i === 0 ? 'bg-[rgb(27_37_75/0.06)]' : ''}`}>
                <span className="grid size-10 place-items-center"><I className="size-[22px]" strokeWidth={1.7} /></span>
                <span className="text-[16px] font-bold">{l}</span>
                {b && <span className="mr-2 ml-auto grid size-6 place-items-center rounded-full bg-[#202227] text-[12px] font-bold text-white">{b}</span>}
              </div>
            ))}
            <div className="mt-3 rounded-lg border border-[#202227]/10 bg-[#f7f7f8] p-3.5 text-[14px] leading-snug">
              <Robux className="mb-2 size-5" />
              More fun for less Robux. Subscribe to Roblox Plus.
              <div className="mt-2 font-semibold underline">Subscribe</div>
            </div>
          </aside>

          {/* main */}
          <main className="min-w-0 flex-1 px-[23px] pt-[27px]">
            <h1 className="text-[32px] leading-[55px] font-extrabold">Home</h1>
            <div className="mt-2 rounded-lg border border-[#202227]/10 bg-[#f7f7f8] px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-[14px] font-semibold"><Lock className="size-4 text-[#335fff]" />Set up your account</div>
              <div className="mt-2.5 text-[14px]">Unlock chat and more games with an age check.</div>
              <span className="mt-3 inline-block rounded-md bg-[rgb(27_37_75/0.1)] px-2.5 py-1 text-[12px] font-semibold">Unlock</span>
            </div>

            <h2 className="mt-6 text-[20px] font-bold">Recommended For You</h2>
            <div className="mt-4 grid grid-cols-4 gap-[17px]">
              {ROW1.map((g) => (
                <div key={g.name}>
                  <img src={thumb(g.img)} alt="" className="aspect-video w-full rounded-lg bg-[rgb(27_37_75/0.12)] object-cover" />
                  <div className="mt-2 truncate text-[16px] font-bold">{g.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#494d5a]"><ThumbsUp className="size-3" />{g.rate}% Rating</div>
                </div>
              ))}
            </div>

            <h2 className="mt-7 text-[20px] font-bold">Games you’re missing</h2>
            <div className="mt-1 text-[14px]">Get an age check to unlock games for you. <b className="underline">Continue</b></div>
            <div className="mt-3 flex gap-4">
              {MISSING.map((g) => (
                <div key={g.name + g.img} className="w-[241px] shrink-0">
                  <div className="relative">
                    <img src={thumb(g.img)} alt="" className="aspect-video w-full rounded-lg object-cover opacity-55" />
                    <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-white/90"><Lock className="size-3.5" /></span>
                  </div>
                  <div className="mt-2 truncate text-[16px] font-bold">{g.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#494d5a]"><ThumbsUp className="size-3" />{g.rate}% Rating</div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </Real>
  );
}

/* ------------------------------ with hush -------------------------------- */

export function RbxCalm() {
  // roblox.css, 0.6 layout: normal-case words, pill for "you are here", Home + greeting, big titles
  const nav: [React.ElementType, string, string?][] = [
    [Home, 'Home'], [User, 'Profile'], [MessageSquare, 'Messages', '1'], [Users, 'Friends'], [Shirt, 'Avatar'], [Package, 'Inventory'], [ArrowLeftRight, 'Trade'], [Users, 'Communities'],
  ];
  const soft = { filter: 'saturate(.9) contrast(.98) brightness(1.01)' };
  return (
    <Real>
      <div className="flex h-full flex-col bg-white text-[#1b1b1b]" style={{ fontFamily: FONT_HUSH }}>
        {/* header: words as words, one wide pill search, no balance or app upsell */}
        <div className="flex h-12 shrink-0 items-center bg-white px-5 shadow-[0_1px_0_rgb(0_0_0/0.06)]">
          <Wordmark size={21} color="#1b1b1b" />
          <div className="ml-[60px] flex gap-[56px] text-[15px] font-medium text-[#1b1b1b]/80"><span>Charts</span><span>Marketplace</span><span>Create</span><span>Robux</span></div>
          <div className="mx-auto flex h-9 w-[520px] items-center gap-2.5 rounded-full border border-black/[0.08] bg-black/[0.03] px-4 text-[14px] text-[#7c7c7c]"><Search className="size-4" />Search</div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 text-[14px] font-medium"><img src={ME} alt="" className="size-7 rounded-full bg-[#ececec]" style={soft} />{USER}</span>
            <Bell className="size-5 text-[#1b1b1b]/70" strokeWidth={1.7} />
            <Settings className="size-5 text-[#1b1b1b]/70" strokeWidth={1.7} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-[244px] shrink-0 border-r border-black/[0.06] bg-white px-4 pt-[18px]">
            <div className="mb-3 flex items-center gap-3 px-3 py-1.5">
              <img src={ME} alt="" className="size-8 rounded-full bg-[#ececec]" style={soft} />
              <span className="text-[15px] font-medium">{USER}</span>
            </div>
            {nav.map(([I, l, b], i) => (
              <div key={l} className={'mb-1 flex h-[44px] items-center gap-3.5 rounded-xl px-3.5 text-[15px] font-medium ' + (i === 0 ? 'bg-black/[0.06] text-[#1b1b1b]' : 'text-[#1b1b1b]/75')}>
                <I className="size-5" strokeWidth={1.7} />{l}
                {b && <span className="ml-auto text-[12.5px] font-medium">{b}</span>}
              </div>
            ))}
          </aside>

          <main className="min-w-0 flex-1 px-10 pt-9">
            <div className="text-[32px] leading-[1.15] font-bold tracking-[-0.02em]">Home</div>
            <div className="mt-1 text-[19px] text-[#7c7c7c]">good evening</div>
            <div className="mt-7 rounded-xl border border-black/[0.07] bg-[#fafafa] px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-[14px] font-medium"><Lock className="size-4 text-[#7c7c7c]" />Set up your account</div>
              <div className="mt-2 text-[13.5px] text-[#7c7c7c]">Unlock chat and more games with an age check.</div>
            </div>
            <div className="mt-8 text-[20px] font-semibold tracking-[-0.01em]">Recommended for you</div>
            {[ROW1, ROW2].map((row, r) => (
              <div key={r} className="mt-4 mb-8 grid grid-cols-4 gap-x-[22px]">
                {row.map((g) => (
                  <div key={g.name}>
                    <img src={thumb(g.img)} alt="" className="aspect-video w-full rounded-[14px] bg-[rgb(27_37_75/0.08)] object-cover" style={soft} />
                    <div className="mt-3 truncate text-[15px] font-medium">{g.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#7c7c7c]"><ThumbsUp className="size-3.5" />{g.rate}% Rating</div>
                  </div>
                ))}
              </div>
            ))}
          </main>
        </div>
      </div>
    </Real>
  );
}
