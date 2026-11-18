import * as React from 'react';
import { motion } from 'motion/react';
import {
  Bell, Bookmark, ChartColumn, CircleUser, Compass, Focus, History, House, ListVideo, MessageCircle, Pencil, Shirt, ShoppingBag, User, Users, UsersRound,
} from 'lucide-react';

// Focus mode's bottom island, as src/core/island.js + generic.css draw it: the site's menu
// as one floating pill, the page you're on named, a dot for unread, "leave focus" at the end.

type Item = [React.ElementType, string, boolean?]; // icon, label, unread dot
const SETS: Record<'x' | 'yt' | 'rbx', { items: Item[]; extra?: Item[] }> = {
  x: { items: [[House, 'home'], [Compass, 'explore'], [Bell, 'notifications', true], [MessageCircle, 'chat'], [Bookmark, 'bookmarks'], [User, 'profile']], extra: [[Pencil, 'post']] },
  yt: { items: [[House, 'home'], [ListVideo, 'subscriptions'], [History, 'history'], [CircleUser, 'you']] },
  rbx: { items: [[House, 'home'], [ChartColumn, 'charts'], [ShoppingBag, 'marketplace'], [Shirt, 'avatar'], [Users, 'friends'], [UsersRound, 'communities'], [MessageCircle, 'messages', true], [User, 'profile']] },
};

export function FocusIsland({ site, light = false }: { site: 'x' | 'yt' | 'rbx'; light?: boolean }) {
  const set = SETS[site];
  const c = light
    ? { bg: 'rgba(255,255,255,.92)', ring: 'rgba(0,0,0,.08)', fg: '#141414', dim: 'rgba(20,20,20,.5)', on: 'rgba(0,0,0,.07)', shadow: '0 20px 44px -16px rgba(0,0,0,.28)' }
    : { bg: 'rgba(14,14,14,.92)', ring: 'rgba(255,255,255,.09)', fg: '#f2f2f2', dim: 'rgba(242,242,242,.55)', on: 'rgba(255,255,255,.13)', shadow: '0 22px 50px -14px rgba(0,0,0,.75)' };
  const btn = ([I, label, dot]: Item, active: boolean) => (
    <span
      key={label}
      className="relative flex h-[42px] items-center rounded-full"
      style={{ padding: active ? '0 14px 0 12px' : '0 11px', gap: active ? 8 : 0, background: active ? c.on : 'transparent', color: active ? c.fg : c.dim }}
    >
      <I className="size-5 shrink-0" strokeWidth={1.9} />
      {active && <span className="text-[13.5px] font-medium whitespace-nowrap">{label}</span>}
      {dot && <span className="absolute top-[9px] right-[8px] size-[6px] rounded-full bg-[#ff4b4b]" style={{ boxShadow: `0 0 0 2px ${light ? '#fff' : '#0e0e0e'}` }} />}
    </span>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scaleX: 0.6, scaleY: 0.8, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scaleX: 1, scaleY: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.5 }}
      className="absolute bottom-[22px] left-1/2 z-10 -translate-x-1/2"
    >
      <div className="flex items-center gap-[2px] rounded-full p-1.5 backdrop-blur-xl" style={{ background: c.bg, boxShadow: `${c.shadow}, 0 0 0 1px ${c.ring}, inset 0 1px 0 rgba(255,255,255,.06)` }}>
        {set.items.map((it, i) => btn(it, i === 0))}
        <span className="mx-1 h-5 w-px" style={{ background: c.ring }} />
        {(set.extra || []).map((it) => btn(it, false))}
        {btn([Focus, 'leave focus'], false)}
      </div>
    </motion.div>
  );
}
