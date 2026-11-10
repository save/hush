import * as React from 'react';
import {
  BadgeCheck, BarChart2, Bell, Bookmark, CalendarClock, ChevronRight, Clapperboard, Clock, Film, Flame, Heart, History, Home,
  Image as ImageIcon, Library, ListVideo, Mail, MapPin, MessageCircle, Mic, MoreHorizontal, PenSquare, Plus, Repeat2, Search, Smile, Sparkles,
  ThumbsUp, Upload, User, Users, Crown, Music2, Gamepad2, Trophy,
} from 'lucide-react';
import { Real } from './rbxReal';

/*
 * X and YouTube, at real size (1440 wide), and with hush, using the values
 * from hush's own stylesheets (src/sites/x.css, youtube.css). Photos are
 * Lorem Picsum; the people, posts and videos are made up.
 */

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');
// self-hosted copies of Lorem Picsum photos (Unsplash licence), in /public/photos
export const photo = (id: number, _w?: number, _h?: number) => `./photos/${id}.jpg`;

function Img({ id, w, h, className, style }: { id: number; w?: number; h?: number; className?: string; style?: React.CSSProperties }) {
  return <img src={photo(id, w, h)} alt="" loading="eager" decoding="async" draggable={false} className={cx('object-cover', className)} style={style} />;
}

const HUSH_FONT = 'Inter, "Geist Variable", "SF Pro Text", -apple-system, "Segoe UI", system-ui, sans-serif';
const SOFT_DARK = { filter: 'saturate(.9) contrast(.98) brightness(.96)' } as const;

/* ================================ X ====================================== */

const X = { bg: '#000', line: '#2f3336', dim: '#71767b', fg: '#e7e9ea', blue: '#1d9bf0' };
const XH = { fg: '#e4e4e4', dim: '#8b8b8b', faint: '#555', line: 'rgba(255,255,255,.07)', accent: '#ff4b4b' };
const X_FONT = '"TwitterChirp", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

type Post = { name: string; handle: string; av: number; time: string; text: string; img?: number; counts: [string, string, string, string]; liked?: boolean; ad?: boolean };
const POSTS: Post[] = [
  { name: 'Lina Park', handle: 'linapark', av: 106, time: '2h', text: 'finally finished the desk setup. less stuff, more light. I can actually think in here now', img: 201, counts: ['214', '1.1K', '18K', '402K'], liked: true },
  { name: 'Fluxly', handle: 'fluxlyhq', av: 26, time: '', ad: true, text: 'Ship 10× faster with AI agents that never sleep 🚀 Start free today. No credit card required.', img: 26, counts: ['12', '31', '204', '1.9M'] },
  { name: 'Wild Frames', handle: 'wildframes', av: 823, time: '5h', text: 'a fox stopped to look at me for exactly one second and I got the shot', img: 582, counts: ['1.8K', '9.4K', '96K', '3.2M'] },
];

export function XLoud() {
  const nav: [React.ElementType, string, string?][] = [
    [Home, 'Home'], [Search, 'Explore'], [Bell, 'Notifications', '20+'], [Mail, 'Messages', '3'], [Sparkles, 'Grok'], [Bookmark, 'Bookmarks'],
    [Users, 'Communities'], [Crown, 'Premium'], [BadgeCheck, 'Verified Orgs'], [User, 'Profile'], [MoreHorizontal, 'More'],
  ];
  return (
    <Real>
      <div className="flex h-full justify-center" style={{ background: X.bg, color: X.fg, fontFamily: X_FONT }}>
        <header className="flex w-[275px] shrink-0 flex-col px-2">
          <div className="grid size-[52px] place-items-center text-[30px] font-black">𝕏</div>
          {nav.map(([I, l, b], i) => (
            <div key={l} className="flex h-[52px] items-center gap-5 px-3 text-[20px]">
              <span className="relative">
                <I className="size-[26px]" strokeWidth={i === 0 ? 2.6 : 1.9} />
                {b && <span className="absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border border-black px-1 text-[11px] font-bold text-white" style={{ background: X.blue }}>{b}</span>}
              </span>
              <span className={i === 0 ? 'font-bold' : ''}>{l}</span>
            </div>
          ))}
          <div className="mt-4 mr-6 h-[52px] rounded-full bg-[#eff3f4] text-center text-[17px] leading-[52px] font-bold text-black">Post</div>
        </header>

        <main className="w-[600px] shrink-0 border-x" style={{ borderColor: X.line }}>
          <div className="flex h-[53px] border-b text-[15px]" style={{ borderColor: X.line }}>
            <div className="flex flex-1 items-end justify-center"><span className="border-b-4 pb-3 font-bold" style={{ borderColor: X.blue }}>For you</span></div>
            <div className="flex flex-1 items-end justify-center pb-4" style={{ color: X.dim }}>Following</div>
          </div>
          <div className="flex gap-3 border-b px-4 pt-3 pb-2" style={{ borderColor: X.line }}>
            <Img id={1011} w={96} h={96} className="size-10 rounded-full" />
            <div className="flex-1">
              <div className="pt-1.5 pb-4 text-[20px]" style={{ color: X.dim }}>What’s happening?</div>
              <div className="flex items-center gap-4 border-t pt-2.5" style={{ borderColor: X.line, color: X.blue }}>
                <ImageIcon className="size-5" /><Film className="size-5" /><BarChart2 className="size-5" /><Smile className="size-5" /><CalendarClock className="size-5" /><MapPin className="size-5 opacity-50" />
                <span className="ml-auto rounded-full bg-[#787a7a] px-4 py-1.5 text-[15px] font-bold text-black">Post</span>
              </div>
            </div>
          </div>
          <div className="border-b py-3.5 text-center text-[15px]" style={{ borderColor: X.line, color: X.blue }}>Show 34 posts</div>
          {POSTS.map((p) => (
            <article key={p.handle} className="flex gap-3 border-b px-4 pt-3 pb-3" style={{ borderColor: X.line }}>
              <Img id={p.av} w={96} h={96} className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[15px]">
                  <span className="font-bold">{p.name}</span>
                  <BadgeCheck className="size-[18px] text-black" fill={p.ad ? '#e2b719' : X.blue} />
                  <span style={{ color: X.dim }}>@{p.handle}{p.time && ` · ${p.time}`}</span>
                  <MoreHorizontal className="ml-auto size-[18px]" style={{ color: X.dim }} />
                </div>
                <div className="mt-0.5 text-[15px] leading-5">{p.text}</div>
                {p.img && <Img id={p.img} w={1100} h={620} className="mt-3 h-[290px] w-full rounded-2xl border" style={{ borderColor: X.line }} />}
                <div className="mt-3 flex justify-between pr-1 text-[13px]" style={{ color: X.dim }}>
                  <span className="flex items-center gap-1.5"><MessageCircle className="size-[19px]" />{p.counts[0]}</span>
                  <span className="flex items-center gap-1.5"><Repeat2 className="size-[19px]" />{p.counts[1]}</span>
                  <span className="flex items-center gap-1.5" style={p.liked ? { color: '#f91880' } : undefined}><Heart className="size-[19px]" fill={p.liked ? '#f91880' : 'none'} />{p.counts[2]}</span>
                  <span className="flex items-center gap-1.5"><BarChart2 className="size-[19px]" />{p.counts[3]}</span>
                  <span className="flex gap-3"><Bookmark className="size-[19px]" /><Upload className="size-[19px]" /></span>
                </div>
                {p.ad && <div className="mt-1 text-[13px]" style={{ color: X.dim }}>Ad</div>}
              </div>
            </article>
          ))}
        </main>

        <aside className="ml-[30px] flex w-[350px] shrink-0 flex-col gap-4 pt-1.5">
          <div className="flex h-[42px] items-center gap-3 rounded-full border px-4 text-[15px]" style={{ borderColor: X.line, color: X.dim }}><Search className="size-[18px]" />Search</div>
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: X.line }}>
            <div className="text-[20px] font-extrabold">Subscribe to Premium</div>
            <div className="mt-1 text-[15px] leading-5">Subscribe to unlock new features and if eligible, receive a share of revenue.</div>
            <div className="mt-2.5 inline-block rounded-full px-4 py-1.5 text-[15px] font-bold text-white" style={{ background: X.blue }}>Subscribe</div>
          </div>
          <div className="rounded-2xl border py-3" style={{ borderColor: X.line }}>
            <div className="px-4 text-[20px] font-extrabold">What’s happening</div>
            {[['Sports · LIVE', 'Derby day', ''], ['Trending in Technology', 'Foldable phones', '24.1K posts'], ['Trending', '#SlowSunday', '8,412 posts'], ['Music · Trending', 'New album', '61K posts']].map(([a, b, c], i) => (
              <div key={b} className="px-4 py-2.5">
                <div className="text-[13px]" style={{ color: i === 0 ? '#f4212e' : X.dim, fontWeight: i === 0 ? 600 : 400 }}>{a}</div>
                <div className="text-[15px] font-bold">{b}</div>
                {c && <div className="text-[13px]" style={{ color: X.dim }}>{c}</div>}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border py-3" style={{ borderColor: X.line }}>
            <div className="px-4 text-[20px] font-extrabold">Who to follow</div>
            {[['Sana Ali', 'sanadraws', 1003], ['Kyoto Daily', 'kyotodaily', 164]].map(([n, h, id]) => (
              <div key={h} className="flex items-center gap-3 px-4 py-3">
                <Img id={id as number} w={80} h={80} className="size-10 rounded-full" />
                <div className="flex-1"><div className="text-[15px] font-bold">{n}</div><div className="text-[15px]" style={{ color: X.dim }}>@{h}</div></div>
                <span className="rounded-full bg-[#eff3f4] px-4 py-1.5 text-[14px] font-bold text-black">Follow</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Real>
  );
}

export function XCalm() {
  // x.css: menu 220px with 180px rows, 13.5px/1.6 in --h-dim; column 600px; the pair is centred
  const nav: [React.ElementType, string][] = [[Home, 'home'], [Search, 'explore'], [Bell, 'notifications'], [Mail, 'chat'], [Bookmark, 'bookmarks'], [User, 'profile'], [MoreHorizontal, 'more']];
  return (
    <Real>
      <div className="flex h-full justify-center" style={{ background: '#000', color: XH.fg, fontFamily: HUSH_FONT }}>
        <header className="w-[220px] shrink-0 pt-[18px]">
          <div className="mb-3 grid size-[44px] place-items-center pl-1 text-[22px] font-black opacity-80">𝕏</div>
          {nav.map(([I, l], i) => (
            <div key={l} className="relative flex w-[180px] items-center gap-3 py-[5px] pl-3 text-[13.5px] leading-[1.6]" style={{ color: i === 0 ? XH.fg : XH.dim }}>
              {i === 0 && <span className="absolute left-0 size-[5px] rounded-full" style={{ background: XH.accent }} />}
              <I className="size-[17px]" strokeWidth={1.8} />
              {l}
              {l === 'notifications' && <span className="ml-auto text-[12px]" style={{ color: XH.dim }}>3</span>}
            </div>
          ))}
          <div className="mt-2 flex w-[180px] items-center gap-3 py-[5px] pl-3 text-[13.5px]" style={{ color: XH.dim }}>
            <PenSquare className="size-[17px]" strokeWidth={1.8} />write
          </div>
        </header>

        <main className="w-[640px] shrink-0">
          <div className="w-[600px] border-x" style={{ borderColor: XH.line }}>
            <div className="relative flex h-[53px] border-b text-[13.5px]" style={{ borderColor: XH.line }}>
              <div className="flex flex-1 items-center justify-center" style={{ color: XH.fg }}>for you</div>
              <div className="flex flex-1 items-center justify-center" style={{ color: XH.dim }}>following</div>
              <span className="absolute bottom-0 left-[126px] h-[2px] w-[48px] rounded-full" style={{ background: XH.fg }} />
            </div>
            {POSTS.filter((p) => !p.ad).map((p) => (
              <article key={p.handle} className="flex gap-3 border-b px-4 pt-3.5 pb-3" style={{ borderColor: XH.line }}>
                <Img id={p.av} w={96} h={96} className="size-10 shrink-0 rounded-full" style={SOFT_DARK} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[13.5px]">
                    <span className="font-semibold">{p.name}</span>
                    <span style={{ color: XH.dim }}>@{p.handle} · {p.time}</span>
                  </div>
                  <div className="mt-0.5 text-[14.5px] leading-[1.55]">{p.text}</div>
                  {p.img && <Img id={p.img} w={1100} h={620} className="mt-3 h-[290px] w-full rounded-2xl" style={SOFT_DARK} />}
                  <div className="mt-2.5 flex gap-7 text-[13px] leading-[1.6]" style={{ color: XH.dim }}>
                    <span>reply {p.counts[0]}</span>
                    <span>repost {p.counts[1]}</span>
                    <span className="flex items-center gap-[5px]" style={p.liked ? { color: XH.fg } : undefined}>
                      {p.liked && <span className="size-[5px] rounded-full" style={{ background: XH.accent }} />}
                      {p.liked ? 'liked' : 'like'} {p.counts[2]}
                    </span>
                    <span>keep</span>
                    <span>share</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </Real>
  );
}

/* =============================== YouTube ================================= */

type Video = { id: number; title: string; channel: string; av: number; views: string; age: string; dur?: string; live?: boolean; sticker?: string };
const VIDEOS: Video[] = [
  { id: 957, title: 'I Built a Tiny Cabin in the Woods Alone (Full Build)', channel: 'Northwood Builds', av: 1018, views: '2.4M views', age: '3 weeks ago', dur: '32:18', sticker: 'BUILT IT ALONE' },
  { id: 201, title: 'lofi beats to study and relax to', channel: 'quiet room radio', av: 225, views: '12K watching', age: '', live: true },
  { id: 1015, title: 'Kayaking Norway’s Most Beautiful Fjord', channel: 'Ola Outdoors', av: 1011, views: '890K views', age: '5 days ago', dur: '18:42', sticker: 'WORTH IT?' },
  { id: 292, title: '15-Minute Dinners That Don’t Feel Lazy', channel: 'Small Kitchen', av: 429, views: '1.1M views', age: '1 month ago', dur: '12:05' },
  { id: 1025, title: 'My Dog Reacts to His Own Birthday Party', channel: 'Pugsley & Co', av: 837, views: '4.8M views', age: '2 days ago', dur: '8:31', sticker: 'HE CRIED' },
  { id: 1003, title: 'A Quiet Morning at the Lake (no talking)', channel: 'Slow Mornings', av: 10, views: '312K views', age: '1 week ago', dur: '24:00' },
  { id: 1039, title: 'Rain on a Forest Cabin Roof, 3 Hours', channel: 'Northwood Builds', av: 1018, views: '6.2M views', age: '1 year ago', dur: '3:00:00' },
  { id: 684, title: 'Winter Camping at −20°: Was It a Mistake?', channel: 'Ola Outdoors', av: 1011, views: '2.9M views', age: '4 months ago', dur: '27:51', sticker: '−20°C!!' },
];
const YT_FONT = 'Roboto, Arial, sans-serif';

function YtLogo({ calm }: { calm?: boolean }) {
  return (
    <div className="flex items-center gap-1 text-[20px] font-semibold tracking-[-0.05em]" style={calm ? { opacity: 0.85 } : undefined}>
      <span className="grid h-[20px] w-[29px] place-items-center rounded-[6px]" style={{ background: calm ? '#9a9a9a' : '#ff0033' }}>
        <span className="ml-0.5 border-y-[5px] border-l-[8px] border-y-transparent" style={{ borderLeftColor: calm ? '#0a0a0a' : '#fff' }} />
      </span>
      YouTube
    </div>
  );
}

function Thumb({ v, calm }: { v: Video; calm?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <Img id={v.id} w={640} h={360} className="aspect-video w-full" style={calm ? SOFT_DARK : undefined} />
      {!calm && v.sticker && (
        <span className="absolute bottom-3 left-3 rotate-[-3deg] text-[24px] leading-none font-black text-[#ffe500] [paint-order:stroke] [-webkit-text-stroke:6px_#000]">{v.sticker}</span>
      )}
      {calm && v.sticker && (
        // the sticker is part of the thumbnail image, so hush leaves it (just softer)
        <span className="absolute bottom-3 left-3 rotate-[-3deg] text-[24px] leading-none font-black text-[#ffe500] opacity-90 [paint-order:stroke] [-webkit-text-stroke:6px_#000]" style={SOFT_DARK}>{v.sticker}</span>
      )}
      {v.live ? (
        <span className={cx('absolute right-1.5 bottom-1.5 flex items-center gap-1 px-1 text-[12px] font-medium', calm ? 'rounded-[5px] bg-black/60 text-white/85' : 'rounded bg-[#cc0000] font-bold text-white')}>
          {calm && <span className="size-[5px] rounded-full bg-[#ff4b4b]" />}{calm ? 'live' : 'LIVE'}
        </span>
      ) : (
        <span className={cx('absolute right-1.5 bottom-1.5 px-1 text-[12px]', calm ? 'rounded-[5px] bg-black/60 font-medium text-white/85' : 'rounded bg-black/80 font-semibold text-white')}>{v.dur}</span>
      )}
    </div>
  );
}

export function YtLoud() {
  return (
    <Real>
      <div className="flex h-full flex-col bg-[#0f0f0f] text-[#f1f1f1]" style={{ fontFamily: YT_FONT }}>
        <div className="flex h-14 shrink-0 items-center px-4">
          <div className="flex w-[220px] items-center gap-5">
            <div className="flex flex-col gap-[4px] px-2"><div className="h-[2px] w-[18px] bg-white" /><div className="h-[2px] w-[18px] bg-white" /><div className="h-[2px] w-[18px] bg-white" /></div>
            <YtLogo />
          </div>
          <div className="mx-auto flex w-[640px] items-center gap-4">
            <div className="flex flex-1">
              <span className="flex-1 rounded-l-full border border-[#303030] bg-[#121212] px-4 py-[8px] text-[16px] text-[#888]">Search</span>
              <span className="rounded-r-full border border-l-0 border-[#303030] bg-[#222] px-5 py-[8px]"><Search className="size-5" /></span>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[#272727]"><Mic className="size-5" /></span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 rounded-full bg-[#272727] px-3.5 py-2 text-[14px] font-medium"><Plus className="size-5" />Create</span>
            <span className="relative"><Bell className="size-6" /><span className="absolute -top-2 -right-2.5 rounded-full bg-[#cc0000] px-1 text-[11px] font-medium">9+</span></span>
            <Img id={1011} w={64} h={64} className="size-8 rounded-full" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <aside className="w-[240px] shrink-0 overflow-hidden px-3 text-[14px]">
            {([[Home, 'Home'], [Clapperboard, 'Shorts'], [Library, 'Subscriptions']] as const).map(([I, l], i) => (
              <div key={l} className={cx('flex h-10 items-center gap-6 rounded-[10px] px-3', i === 0 && 'bg-[#272727] font-medium')}><I className="size-6" strokeWidth={1.6} />{l}</div>
            ))}
            <div className="my-3 h-px bg-[#3f3f3f]" />
            <div className="flex h-10 items-center gap-2 px-3 text-[16px] font-medium">You <ChevronRight className="size-4" /></div>
            {([[History, 'History'], [ListVideo, 'Playlists'], [Clock, 'Watch later'], [ThumbsUp, 'Liked videos']] as const).map(([I, l]) => (
              <div key={l} className="flex h-10 items-center gap-6 px-3"><I className="size-6" strokeWidth={1.6} />{l}</div>
            ))}
            <div className="my-3 h-px bg-[#3f3f3f]" />
            <div className="flex h-10 items-center px-3 text-[16px] font-medium">Subscriptions</div>
            {VIDEOS.slice(0, 5).map((v, i) => (
              <div key={v.channel + i} className="flex h-10 items-center gap-6 px-3">
                <Img id={v.av} w={48} h={48} className="size-6 rounded-full" />
                <span className="flex-1 truncate">{v.channel}</span>
                {i === 1 ? <span className="text-[#ff4e45]">((•))</span> : i < 4 && <span className="size-1 rounded-full bg-[#3ea6ff]" />}
              </div>
            ))}
            <div className="my-3 h-px bg-[#3f3f3f]" />
            <div className="flex h-10 items-center px-3 text-[16px] font-medium">Explore</div>
            {([[Flame, 'Trending'], [Music2, 'Music'], [Gamepad2, 'Gaming'], [Trophy, 'Sports']] as const).map(([I, l]) => (
              <div key={l} className="flex h-10 items-center gap-6 px-3"><I className="size-6" strokeWidth={1.6} />{l}</div>
            ))}
          </aside>
          <main className="min-w-0 flex-1 overflow-hidden pr-6 pl-2">
            <div className="flex gap-3 pt-3 pb-5 text-[14px] font-medium">
              {['All', 'Music', 'Gaming', 'Live', 'Podcasts', 'Mixes', 'Cooking', 'Camping', 'Recently uploaded', 'Watched', 'New to you'].map((c, i) => (
                <span key={c} className={cx('shrink-0 rounded-lg px-3 py-[6px]', i === 0 ? 'bg-[#f1f1f1] text-black' : 'bg-[#272727]')}>{c}</span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-x-4 gap-y-10">
              {[VIDEOS[0], VIDEOS[1]].map((v) => (
                <div key={v.id}>
                  <Thumb v={v} />
                  <div className="mt-3 flex gap-3">
                    <Img id={v.av} w={72} h={72} className="size-9 shrink-0 rounded-full" />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-[16px] leading-[22px] font-medium">{v.title}</div>
                      <div className="mt-1 text-[14px] text-[#aaa]">{v.channel} ✓</div>
                      <div className="text-[14px] text-[#aaa]">{v.views}{v.age && ` • ${v.age}`}</div>
                    </div>
                  </div>
                </div>
              ))}
              {/* the ad slot */}
              <div>
                <div className="relative overflow-hidden rounded-xl">
                  <Img id={766} w={640} h={360} className="aspect-video w-full" />
                  <span className="absolute top-2 left-2 rounded bg-[#ffd400] px-1.5 py-0.5 text-[13px] font-extrabold text-black">40% OFF</span>
                </div>
                <div className="mt-3 flex gap-3">
                  <Img id={42} w={72} h={72} className="size-9 shrink-0 rounded-full" />
                  <div>
                    <div className="text-[16px] leading-[22px] font-medium">Wake up to better coffee. Your first box is on us.</div>
                    <div className="mt-1 text-[14px] text-[#aaa]"><b className="text-white">Sponsored</b> · Brewbox</div>
                  </div>
                </div>
                <div className="mt-2.5 rounded-full bg-[#3ea6ff] py-2 text-center text-[14px] font-medium text-black">Shop now</div>
              </div>
              {[VIDEOS[2]].map((v) => (
                <div key={v.id}>
                  <Thumb v={v} />
                  <div className="mt-3 flex gap-3">
                    <Img id={v.av} w={72} h={72} className="size-9 shrink-0 rounded-full" />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-[16px] leading-[22px] font-medium">{v.title}</div>
                      <div className="mt-1 text-[14px] text-[#aaa]">{v.channel} ✓</div>
                      <div className="text-[14px] text-[#aaa]">{v.views} • {v.age}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-[20px] font-bold">
              <span className="grid size-6 place-items-center rounded-md bg-[#ff0033] text-[13px] font-black">S</span> Shorts
            </div>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {[[837, 'he heard the treat bag 😂'], [452, 'the drop at 0:12 🔥🔥'], [488, 'rating every donut in town'], [1035, 'this waterfall is unreal'], [593, 'wait for it…']].map(([id, t]) => (
                <div key={id as number}>
                  <Img id={id as number} w={270} h={480} className="aspect-[9/16] w-full rounded-xl" />
                  <div className="mt-2 line-clamp-1 text-[16px] font-medium">{t}</div>
                  <div className="text-[14px] text-[#aaa]">2.1M views</div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </Real>
  );
}

export function YtCalm() {
  // youtube.css, 0.6 layout: a 76px rail (icon + small word), one pill search,
  // pill chips, three big videos to a row, title and channel only
  const rail: [React.ElementType, string][] = [[Home, 'Home'], [Library, 'Subscriptions'], [History, 'History']];
  return (
    <Real>
      <div className="flex h-full flex-col bg-[#0a0a0a]" style={{ color: XH.fg, fontFamily: HUSH_FONT }}>
        <div className="flex h-16 shrink-0 items-center px-5">
          <div className="flex w-[240px] items-center gap-6">
            <div className="flex flex-col gap-[5px] px-1.5"><div className="h-[2px] w-[19px] bg-white/90" /><div className="h-[2px] w-[19px] bg-white/90" /><div className="h-[2px] w-[19px] bg-white/90" /></div>
            <YtLogo />
          </div>
          <div className="mx-auto flex h-11 w-[650px] items-center rounded-full border border-white/[0.07] bg-white/[0.03] pr-5 pl-6 text-[15.5px]" style={{ color: XH.dim }}>
            <span className="flex-1">Search</span>
            <Search className="size-5 opacity-80" />
          </div>
          <div className="flex w-[240px] justify-end">
            <Img id={1011} w={64} h={64} className="size-9 rounded-full" style={SOFT_DARK} />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 pt-3">
            {rail.map(([I, l], i) => (
              <div key={l} className={cx('flex size-14 flex-col items-center justify-center gap-1 rounded-[14px]', i === 0 && 'bg-white/[0.09]')} style={{ color: i === 0 ? XH.fg : XH.dim }}>
                <I className="size-[22px]" strokeWidth={1.8} />
                <span className="max-w-[64px] truncate text-[10.5px]">{l}</span>
              </div>
            ))}
          </aside>
          <main className="min-w-0 flex-1 overflow-hidden pr-10 pl-6">
            <div className="flex gap-2.5 pt-3 pb-7 text-[14.5px] font-medium">
              {['All', 'Gaming', 'Cooking', 'Camping', 'Podcasts'].map((c, i) => (
                <span key={c} className="flex h-[38px] items-center rounded-full px-[18px]" style={i === 0 ? { background: XH.fg, color: '#0a0a0a' } : { background: 'rgba(255,255,255,.07)', color: XH.fg }}>{c}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-x-[34px] gap-y-10">
              {VIDEOS.slice(0, 6).map((v) => (
                <div key={v.id}>
                  <div className="relative overflow-hidden rounded-2xl">
                    <Img id={v.id} w={640} h={360} className="aspect-video w-full" style={SOFT_DARK} />
                    {v.sticker && (
                      <span className="absolute bottom-3.5 left-3.5 rotate-[-3deg] text-[30px] leading-none font-black text-[#ffe500] opacity-90 [paint-order:stroke] [-webkit-text-stroke:7px_#000]">{v.sticker}</span>
                    )}
                    <span className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-full bg-[#0a0a0a]/70 px-[9px] py-[3px] text-[12.5px] font-medium text-white">
                      {v.live && <span className="size-[5px] rounded-full bg-[#ff4b4b]" />}{v.live ? 'live' : v.dur}
                    </span>
                  </div>
                  <div className="mt-3.5 flex gap-3">
                    <Img id={v.av} w={72} h={72} className="size-9 shrink-0 rounded-full" style={SOFT_DARK} />
                    <div className="min-w-0">
                      <div className="truncate text-[16px] leading-[1.35] font-medium">{v.title}</div>
                      <div className="mt-1 text-[14px]" style={{ color: XH.dim }}>{v.channel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </Real>
  );
}
