import * as React from 'react';

/*
 * Roblox-style game thumbnails and headshots, drawn as SVG: blue skies,
 * blocky platforms, a classic avatar, and the loud sticker title games put
 * on their art. Original drawings in the style, not any real game's art.
 */

export type Game = {
  name: string;
  rate: number;
  playing: string;
  sky: [string, string];
  title: string;
  titleFill: string;
  hues: [number, number, number];
  shirt: string;
  pants: string;
  sun?: boolean;
  lava?: boolean;
};

export const GAMES: Game[] = [
  { name: 'Tower of Tumbles', rate: 94, playing: '41.2K', sky: ['#3fb6ff', '#c4ecff'], title: 'OBBY', titleFill: '#ffd400', hues: [0, 48, 205], shirt: '#e5242b', pants: '#1f4ea8', sun: true },
  { name: 'Pet Party Hatchers', rate: 95, playing: '52.3K', sky: ['#38d6a6', '#c9f7e8'], title: 'PETS!', titleFill: '#ff5fa2', hues: [320, 190, 50], shirt: '#ff8a00', pants: '#3b2a8f' },
  { name: 'Mega Mansion Tycoon', rate: 91, playing: '18.7K', sky: ['#ff9f5a', '#ffe0b5'], title: 'TYCOON', titleFill: '#5cff6a', hues: [30, 140, 265], shirt: '#2ecc71', pants: '#222', sun: true },
  { name: 'Pizza Shift Simulator', rate: 93, playing: '27.9K', sky: ['#ff6b8a', '#ffd6df'], title: 'PIZZA', titleFill: '#fff200', hues: [10, 40, 120], shirt: '#ffffff', pants: '#c0392b' },
  { name: 'Blox Kart Racers', rate: 89, playing: '9.4K', sky: ['#6d5cff', '#cbc1ff'], title: 'RACE!', titleFill: '#00e0ff', hues: [280, 0, 60], shirt: '#111', pants: '#ffcc00' },
  { name: 'Lava Rush Obby', rate: 87, playing: '6.1K', sky: ['#ff6a2b', '#ffd36b'], title: 'LAVA', titleFill: '#fff', hues: [20, 0, 35], shirt: '#1f8ef1', pants: '#0b3d91', lava: true },
  { name: 'Island Survival', rate: 88, playing: '3.2K', sky: ['#1ea7ff', '#a8e6ff'], title: 'SURVIVE', titleFill: '#ffe14d', hues: [45, 120, 30], shirt: '#8e5a2b', pants: '#2d572c', sun: true },
  { name: 'Escape the Haunted Mall', rate: 90, playing: '11.8K', sky: ['#2c2459', '#7059b0'], title: 'ESCAPE', titleFill: '#b8ff3d', hues: [270, 300, 200], shirt: '#6c3483', pants: '#1b1b1b' },
];

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

function Block({ x, y, w, h, d = 22, hue, sat = 75 }: { x: number; y: number; w: number; h: number; d?: number; hue: number; sat?: number }) {
  const dy = d * 0.6;
  return (
    <g>
      <polygon points={`${x},${y} ${x + d},${y - dy} ${x + w + d},${y - dy} ${x + w},${y}`} fill={hsl(hue, sat, 66)} />
      <rect x={x} y={y} width={w} height={h} fill={hsl(hue, sat, 50)} />
      <polygon points={`${x + w},${y} ${x + w + d},${y - dy} ${x + w + d},${y + h - dy} ${x + w},${y + h}`} fill={hsl(hue, sat, 38)} />
      {/* stud line, the classic brick look */}
      <rect x={x} y={y} width={w} height={3} fill="rgb(255 255 255 / .18)" />
    </g>
  );
}

function Avatar({ x, y, s = 1, shirt, pants }: { x: number; y: number; s?: number; shirt: string; pants: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* legs */}
      <rect x={-14} y={30} width={13} height={30} fill={pants} />
      <rect x={1} y={30} width={13} height={30} fill={pants} />
      {/* arms, one raised */}
      <rect x={-27} y={-2} width={12} height={30} fill="#f5cd30" transform="rotate(-28 -21 0)" />
      <rect x={15} y={2} width={12} height={30} fill="#f5cd30" />
      {/* torso */}
      <rect x={-15} y={0} width={30} height={31} fill={shirt} />
      {/* head */}
      <rect x={-11} y={-25} width={22} height={23} rx={6} fill="#f5cd30" />
      <circle cx={-4.5} cy={-16} r={2} fill="#111" />
      <circle cx={4.5} cy={-16} r={2} fill="#111" />
      <path d="M-6 -9 q6 5 12 0" stroke="#111" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function GameThumb({ g, className }: { g: Game; className?: string }) {
  const id = React.useId().replace(/:/g, '');
  const [h1, h2, h3] = g.hues;
  return (
    <svg viewBox="0 0 300 300" className={className} preserveAspectRatio="xMidYMid slice" aria-label={g.name}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g.sky[0]} />
          <stop offset="1" stopColor={g.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill={`url(#sky${id})`} />
      {g.sun && <circle cx="238" cy="62" r="30" fill="#fff6b0" opacity=".9" />}
      <g fill="#fff" opacity=".85">
        <rect x="24" y="44" width="70" height="20" rx="10" />
        <rect x="48" y="32" width="38" height="22" rx="11" />
        <rect x="170" y="96" width="56" height="16" rx="8" opacity=".7" />
      </g>
      {/* ground */}
      {g.lava ? (
        <rect y="232" width="300" height="68" fill="#ff4d00" />
      ) : (
        <>
          <rect y="236" width="300" height="64" fill="#7a4b28" />
          <rect y="226" width="300" height="14" fill="#4cc23a" />
        </>
      )}
      {g.lava && <rect y="232" width="300" height="8" fill="#ffcf3d" opacity=".8" />}
      {/* platforms */}
      <Block x={18} y={186} w={70} h={40} hue={h1} />
      <Block x={116} y={152} w={74} h={80} hue={h2} />
      <Block x={214} y={200} w={56} h={30} hue={h3} />
      <Block x={232} y={128} w={40} h={22} d={16} hue={h1} />
      <Avatar x={150} y={91} shirt={g.shirt} pants={g.pants} />
      {/* the sticker title */}
      <text
        x="150"
        y="62"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Geist Variable', sans-serif"
        fontWeight={900}
        fontSize={g.title.length > 6 ? 40 : 50}
        fill={g.titleFill}
        stroke="#111"
        strokeWidth={8}
        paintOrder="stroke"
        strokeLinejoin="round"
        transform="rotate(-6 150 62)"
      >
        {g.title}
      </text>
    </svg>
  );
}

export function Headshot({ shirt, bg, className }: { shirt: string; bg: string; className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className}>
      <rect width="60" height="60" fill={bg} />
      <rect x="12" y="44" width="36" height="20" fill={shirt} />
      <rect x="17" y="12" width="26" height="28" rx="7" fill="#f5cd30" />
      <circle cx="25" cy="24" r="2.2" fill="#111" />
      <circle cx="35" cy="24" r="2.2" fill="#111" />
      <path d="M24 31 q6 5 12 0" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Robux({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
