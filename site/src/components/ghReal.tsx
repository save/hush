import * as React from 'react';
import {
  Activity, BookOpen, Bot, ChevronDown, CircleDot, Code2, Eye, File, Folder, GitBranch, GitFork, GitPullRequest,
  History, Inbox, LineChart, Menu, Pin, PlayCircle, Plus, Scale, Search, Settings, Shield, Star, Table2, Tag, Users,
} from 'lucide-react';
import { Real } from './rbxReal';

/*
 * GitHub, at real size (1440 wide): the hush repo as GitHub draws it in dark
 * mode today, and with hush, using the values from src/sites/github.css.
 * Avatars are placeholders.
 */

type Theme = {
  bg: string; bar: string; line: string; soft: string; fg: string; dim: string; link: string;
  btn: string; btnLine: string; primary: string; primaryFg: string; underline: string;
  counter: string; topicBg: string; topicFg: string; topicLine: string; folder: string; field: string;
};
const LOUD: Theme = {
  bg: '#0d1117', bar: '#010409', line: '#3d444d', soft: '#3d444db3', fg: '#f0f6fc', dim: '#9198a1', link: '#4493f8',
  btn: '#212830', btnLine: '#3d444d', primary: '#238636', primaryFg: '#fff', underline: '#f78166',
  counter: '#2f3742', topicBg: '#388bfd1a', topicFg: '#4493f8', topicLine: 'transparent', folder: '#9198a1', field: '#0d1117',
};
const CALM: Theme = {
  bg: '#0b0b0c', bar: '#0b0b0c', line: '#232326', soft: '#1a1a1d', fg: '#ececec', dim: '#8e8e93', link: '#a9bfdc',
  btn: '#121214', btnLine: '#232326', primary: '#ececec', primaryFg: '#0b0b0c', underline: '#ececec',
  counter: 'transparent', topicBg: 'transparent', topicFg: '#8e8e93', topicLine: '#232326', folder: '#8e8e93', field: 'rgba(255,255,255,.06)',
};

const FONT = '"Mona Sans", -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';

const FILES: [boolean, string, string][] = [
  [true, '.github', 'hush 0.5.0'],
  [true, 'build/popup', 'Add GitHub and Reddit adapters'],
  [true, 'docs', 'Add GitHub and Reddit adapters'],
  [true, 'icons', 'hush 0.5.0'],
  [true, 'site', 'Add GitHub and Reddit adapters'],
  [true, 'src', 'Add GitHub and Reddit adapters'],
  [true, 'ui', 'Add GitHub and Reddit adapters'],
  [false, '.editorconfig', 'hush 0.5.0'],
  [false, 'CHANGELOG.md', 'hush 0.6.0'],
  [false, 'README.md', 'hush 0.6.0'],
];
const TOPICS = ['browser-extension', 'chrome-extension', 'declutter', 'digital-wellbeing', 'focus', 'github', 'manifest-v3', 'privacy', 'reddit', 'roblox', 'youtube'];
const LANGS: [string, number, string][] = [['CSS', 38.1, '#663399'], ['TypeScript', 32.4, '#3178c6'], ['JavaScript', 28.9, '#f1e05a'], ['HTML', 0.6, '#e34c26']];

function Avatar({ size, t, letter = 's' }: { size: number; t: Theme; letter?: string }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold" style={{ width: size, height: size, background: t === CALM ? '#2a2a2e' : '#30363d', color: t.dim, fontSize: size * 0.45 }}>
      {letter}
    </span>
  );
}

function Btn({ t, children, primary }: { t: Theme; children: React.ReactNode; primary?: boolean }) {
  return (
    <span
      className="flex h-8 items-center gap-1.5 px-3 text-[13px] font-semibold"
      style={{
        background: primary ? t.primary : t.btn,
        color: primary ? t.primaryFg : t.fg,
        border: `1px solid ${primary ? (t === CALM ? 'transparent' : '#2ea04366') : t.btnLine}`,
        borderRadius: t === CALM ? 8 : 6,
      }}
    >
      {children}
    </span>
  );
}

function Count({ t, n }: { t: Theme; n: string | number }) {
  return (
    <span className="rounded-full px-1.5 text-[12px] leading-[18px]" style={{ background: t.counter, color: t === CALM ? t.dim : t.fg, fontWeight: t === CALM ? 400 : 500 }}>
      {n}
    </span>
  );
}

function GhPage({ t }: { t: Theme }) {
  const calm = t === CALM;
  const tabs: [React.ElementType, string, number | null][] = [
    [Code2, 'Code', null], [CircleDot, 'Issues', null], [GitPullRequest, 'Pull requests', null],
    ...(calm ? [] : [[Bot, 'Agents', null] as [React.ElementType, string, number | null]]),
    [PlayCircle, 'Actions', null], [Table2, 'Projects', null], [Shield, 'Security and quality', null], [LineChart, 'Insights', null], [Settings, 'Settings', null],
  ];
  const radius = calm ? 12 : 6;
  return (
    <Real w={1440}>
      <div className="size-full" style={{ background: t.bg, color: t.fg, fontFamily: FONT, fontSize: 14 }}>
        {/* header */}
        <div style={{ background: t.bar, borderBottom: `1px solid ${calm ? t.soft : t.line}` }}>
          <div className="flex h-16 items-center gap-3 px-4">
            <span className="grid size-8 place-items-center rounded-md" style={{ border: `1px solid ${t.btnLine}` }}><Menu className="size-4" style={{ color: t.dim }} /></span>
            <svg viewBox="0 0 24 24" className="size-8" fill={t.fg}><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" /></svg>
            <span className="text-[14px] font-semibold">save <span style={{ color: t.dim, fontWeight: 400 }} className="mx-1">/</span> hush</span>
            <ChevronDown className="size-3.5" style={{ color: t.dim }} />
            <div className="flex-1" />
            <span className="flex h-8 w-[300px] items-center gap-2 px-3 text-[13px]" style={{ border: calm ? 'none' : `1px solid ${t.line}`, background: calm ? t.field : 'transparent', borderRadius: calm ? 8 : 6, color: t.dim }}>
              <Search className="size-4" /> Type <kbd className="rounded px-1 text-[11px]" style={{ border: `1px solid ${t.line}` }}>/</kbd> to search
            </span>
            {!calm && (
              <span className="flex h-8 items-center gap-1 rounded-md px-2" style={{ border: `1px solid ${t.line}` }}>
                <Bot className="size-4" style={{ color: t.dim }} /><ChevronDown className="size-3" style={{ color: t.dim }} />
              </span>
            )}
            <span className="h-5 w-px" style={{ background: t.line }} />
            {[Plus, CircleDot, GitPullRequest, Inbox].map((I, i) => (
              <span key={i} className="relative grid size-8 place-items-center rounded-md" style={{ border: `1px solid ${t.line}` }}>
                <I className="size-4" style={{ color: t.dim }} />
                {i === 3 && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full" style={{ background: calm ? t.link : '#4493f8', boxShadow: `0 0 0 2px ${t.bar}` }} />}
              </span>
            ))}
            <Avatar size={32} t={t} />
          </div>
          {/* repo tabs */}
          <div className="flex h-12 items-end gap-1 px-4">
            {tabs.map(([I, label], i) => (
              <span key={label} className="relative flex h-full items-center gap-2 px-2 text-[14px]" style={{ color: i === 0 || !calm ? t.fg : t.dim, fontWeight: i === 0 ? 600 : 400 }}>
                <I className="size-4" style={{ color: t.dim, opacity: calm && i ? 0.7 : 1 }} />
                {label}
                {i === 0 && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full" style={{ background: t.underline }} />}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto w-[1216px] px-0 pt-6">
          {/* a promo strip, as GitHub shows them today */}
          {!calm && (
            <div className="mb-5 flex items-center gap-3 rounded-md px-4 py-3 text-[13px]" style={{ background: '#388bfd1a', border: '1px solid #388bfd66' }}>
              <Bot className="size-4" style={{ color: '#4493f8' }} />
              <span><b>Assign issues to Copilot.</b> <span style={{ color: t.dim }}>Let the coding agent open pull requests for you, right from this repository.</span></span>
              <span className="ml-auto rounded-md px-3 py-1 text-[12px] font-semibold" style={{ background: '#1f6feb', color: '#fff' }}>Try it now</span>
            </div>
          )}
          {/* title row */}
          <div className="flex items-center gap-2 pb-4" style={{ borderBottom: `1px solid ${t.soft}` }}>
            <img src="./logo-96.png" alt="" className="size-6 rounded-full" />
            <span className="text-[20px] font-semibold">hush</span>
            <span className="rounded-full px-2 text-[12px] leading-5" style={{ border: `1px solid ${t.line}`, color: t.dim }}>Public</span>
            <div className="flex-1" />
            <Btn t={t}><Pin className="size-4" style={{ color: t.dim }} />Pin</Btn>
            <Btn t={t}><Eye className="size-4" style={{ color: t.dim }} />Watch <Count t={t} n={0} /><ChevronDown className="size-3" /></Btn>
            <Btn t={t}><GitFork className="size-4" style={{ color: t.dim }} />Fork <Count t={t} n={0} /></Btn>
            <Btn t={t}><Star className="size-4" style={{ color: t.dim }} />Star <Count t={t} n={0} /></Btn>
          </div>

          <div className="mt-6 flex gap-6">
            {/* files */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                <Btn t={t}><GitBranch className="size-4" style={{ color: t.dim }} />main<ChevronDown className="size-3" style={{ color: t.dim }} /></Btn>
                <span className="flex items-center gap-1.5 text-[14px]" style={{ color: t.dim }}><GitBranch className="size-4" /><b style={{ color: t.fg }}>1</b> Branch</span>
                <span className="flex items-center gap-1.5 text-[14px]" style={{ color: t.dim }}><Tag className="size-4" /><b style={{ color: t.fg }}>1</b> Tag</span>
                <div className="flex-1" />
                <span className="flex h-8 w-[230px] items-center gap-2 px-3 text-[13px]" style={{ border: `1px solid ${t.line}`, borderRadius: calm ? 8 : 6, color: t.dim }}><Search className="size-4" />Go to file</span>
                <Btn t={t}>Add file<ChevronDown className="size-3" /></Btn>
                <Btn t={t} primary><Code2 className="size-4" />Code<ChevronDown className="size-3" /></Btn>
              </div>
              <div className="mt-4 overflow-hidden" style={{ border: `1px solid ${t.line}`, borderRadius: radius }}>
                <div className="flex h-[52px] items-center gap-2 px-4 text-[13px]" style={{ background: calm ? '#121214' : '#151b23', borderBottom: `1px solid ${t.line}` }}>
                  <Avatar size={20} t={t} />
                  <b>save</b><span style={{ color: t.dim }}>and</span><b>claude</b>
                  <span style={{ color: t.dim }}>hush 0.6.0</span>
                  <div className="flex-1" />
                  <span style={{ color: t.dim }}>ffb10dc · now</span>
                  <span className="ml-3 flex items-center gap-1 font-semibold"><History className="size-4" style={{ color: t.dim }} />14 Commits</span>
                </div>
                {FILES.map(([dir, name, msg], i) => (
                  <div key={name} className="flex h-[41px] items-center px-4 text-[14px]" style={{ borderTop: i ? `1px solid ${calm ? t.soft : t.line}` : 'none' }}>
                    {dir
                      ? <Folder className="size-4" style={{ color: calm ? t.folder : '#9198a1', fill: calm ? t.folder : '#9198a1' }} />
                      : <File className="size-4" style={{ color: t.dim }} />}
                    <span className="ml-3 w-[300px]">{name}</span>
                    <span style={{ color: t.dim }}>{msg}</span>
                    <span className="ml-auto" style={{ color: t.dim }}>{msg === 'hush 0.5.0' ? '5 days ago' : 'now'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* sidebar */}
            <div className="w-[296px] shrink-0">
              <div className="text-[16px] font-semibold">About</div>
              <p className="mt-3 text-[16px] leading-6">The web is loud. hush turns it down. A free, open-source browser extension that calms X, YouTube, Roblox, GitHub and Reddit.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {TOPICS.map((tp) => (
                  <span key={tp} className="rounded-full px-2.5 text-[12px] leading-[22px]" style={{ background: t.topicBg, color: t.topicFg, border: `1px solid ${t.topicLine}`, fontWeight: calm ? 400 : 500 }}>{tp}</span>
                ))}
              </div>
              <div className="mt-4 space-y-2.5 text-[14px]" style={{ color: t.dim }}>
                {([[BookOpen, 'Readme'], [Scale, 'MIT license'], [Users, 'Contributing'], [Activity, 'Activity'], [Star, '0 stars'], [Eye, '0 watching'], [GitFork, '0 forks']] as [React.ElementType, string][]).map(([I, l]) => (
                  <div key={l} className="flex items-center gap-2"><I className="size-4" />{l}</div>
                ))}
              </div>
              <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${t.soft}` }}>
                <div className="flex items-center gap-2 text-[16px] font-semibold">Releases <Count t={t} n={1} /></div>
                <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
                  <Tag className="size-4" style={{ color: calm ? t.dim : '#3fb950' }} />hush 0.6.0
                  <span className="rounded-full px-2 text-[12px] leading-5 font-medium" style={{ border: `1px solid ${calm ? '#3a5a44' : '#238636'}`, color: calm ? '#8fb59a' : '#3fb950' }}>Latest</span>
                </div>
              </div>
              <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${t.soft}` }}>
                <div className="text-[16px] font-semibold">Languages</div>
                <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full" style={{ filter: calm ? 'grayscale(1)' : undefined }}>
                  {LANGS.map(([n, p, c]) => <span key={n} style={{ width: `${p}%`, background: c }} />)}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]" style={{ color: t.dim }}>
                  {LANGS.map(([n, p, c]) => (
                    <span key={n} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: c, filter: calm ? 'grayscale(1)' : undefined }} />
                      <b style={{ color: t.fg }}>{n}</b> {p}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Real>
  );
}

export function GhLoud() {
  return <GhPage t={LOUD} />;
}
export function GhCalm() {
  return <GhPage t={CALM} />;
}
