// hush — the top island: Apple-style "live activities" for the browser.
//
// A black pill at the top of the page that only appears when something is happening:
// music or video playing in another tab (Spotify, YouTube, YouTube Music, SoundCloud and any
// player that tells the browser what it's playing), a timer you started from Ctrl K, or a
// short hush note (what used to be a toast). Compact, it shows the art and a waveform; point
// at it and it springs open with the title, progress and controls.
//
// Every tab also reports its own media to the background worker, which tells the active tab
// about the best one playing elsewhere. Nothing leaves the browser.
(() => {
  const H = globalThis.Hush;
  if (!H || H.live || window.top !== window) return;

  const host = location.hostname;
  let settings = H.DEFAULTS;
  const ready = H.load().then((s) => { settings = s; render(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') { H.load().then((s) => { settings = s; render(); }); }
    if (area === 'local' && changes.hushTimer) { timer = changes.hushTimer.newValue || null; render(); }
  });
  const wanted = () => settings.island !== false && H.isOn(settings, host) && !document.fullscreenElement;

  /* =============================== the island ================================ */

  let hostEl = null, root = null, island = null;
  let media = null;          // from the background: what's playing in another tab
  let timer = null;          // { endsAt, total, label, done }
  let note = null;           // { text, active, until }
  let expanded = false, tucked = false, collapseTimer = 0, tick = 0;

  chrome.storage.local.get('hushTimer').then((r) => { timer = r.hushTimer || null; render(); }).catch(() => {});

  const ICON = {
    play: 'M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z',
    pause: 'M7 4.5h3.2v15H7zM13.8 4.5H17v15h-3.2z',
    next: 'M5 6.2v11.6a.7.7 0 0 0 1.1.6l8-5.8a.7.7 0 0 0 0-1.2l-8-5.8a.7.7 0 0 0-1.1.6ZM16.5 5.5h2.5v13h-2.5z',
    prev: 'M19 6.2v11.6a.7.7 0 0 1-1.1.6l-8-5.8a.7.7 0 0 1 0-1.2l8-5.8a.7.7 0 0 1 1.1.6ZM5 5.5h2.5v13H5z',
    clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    x: 'M6 6l12 12M18 6 6 18',
    plus: 'M12 5v14M5 12h14'
  };
  function svg(name, filled = true) {
    const NS = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', ICON[name]);
    if (filled) p.setAttribute('fill', 'currentColor');
    else { p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round'); }
    s.append(p);
    return s;
  }
  const el = (tag, cls, kids = []) => { const e = document.createElement(tag); if (cls) e.className = cls; e.append(...kids); return e; };

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    [hidden] { display: none !important; }
    .island {
      --ease: cubic-bezier(0.32, 0.72, 0, 1);
      --spring: cubic-bezier(0.34, 1.32, 0.64, 1);
      position: fixed; top: 8px; left: 50%; z-index: 2147483647;
      width: var(--w, 120px); height: var(--h, 34px); border-radius: var(--r, 17px);
      transform: translateX(-50%) translateY(var(--y, -64px)) scale(var(--s, 0.9));
      opacity: var(--o, 0);
      background: #000; color: #fff; overflow: hidden;
      box-shadow: 0 10px 34px -10px rgba(0,0,0,.55), 0 0 0 0.5px rgba(255,255,255,.08) inset;
      font: 500 13px/1.25 -apple-system, "SF Pro Text", "Inter", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
      letter-spacing: -0.01em; -webkit-font-smoothing: antialiased;
      transition: width .55s var(--spring), height .55s var(--spring), border-radius .55s var(--spring),
        transform .5s var(--spring), opacity .3s ease;
      user-select: none; cursor: default;
    }
    .island[data-shown] { --y: 0px; --s: 1; --o: 1; }
    .island[data-tucked] { --y: -64px; --o: 0; pointer-events: none; }
    @media (prefers-reduced-motion: reduce) { .island { transition-duration: .01s; } }

    /* layers fade between sizes; only one is visible at a time */
    .layer { position: absolute; inset: 0; opacity: 0; filter: blur(4px); transform: scale(.96);
      transition: opacity .22s ease, filter .3s ease, transform .4s var(--ease); pointer-events: none; }
    .island[data-view="compact"] .compact,
    .island[data-view="media"] .media,
    .island[data-view="timer"] .timerv,
    .island[data-view="note"] .note { opacity: 1; filter: none; transform: none; pointer-events: auto; transition-delay: .08s; }

    /* compact: art on the left, a waveform or a time on the right, black between */
    .compact { display: flex; align-items: center; justify-content: space-between; padding: 0 12px 0 7px; }
    .compact .art { width: 22px; height: 22px; border-radius: 6px; object-fit: cover; background: #1c1c1e; }
    .compact .lead { display: flex; align-items: center; gap: 6px; color: #ff9f0a; }
    .compact .lead svg { width: 16px; height: 16px; }
    .trail { display: flex; align-items: center; gap: 8px; font: 600 13px/1 -apple-system, "SF Pro Text", "Inter", "Segoe UI", system-ui, sans-serif; font-variant-numeric: tabular-nums; }
    .trail .t { color: #ff9f0a; }
    .wave { display: flex; align-items: center; gap: 2px; height: 14px; }
    .wave i { display: block; width: 2.5px; height: 100%; border-radius: 2px; background: var(--tint, #fff); transform-origin: center; transform: scaleY(.35); }
    .playing .wave i { animation: bar 1.1s ease-in-out infinite; }
    .wave i:nth-child(2) { animation-delay: -.35s !important; } .wave i:nth-child(3) { animation-delay: -.7s !important; } .wave i:nth-child(4) { animation-delay: -.2s !important; }
    @keyframes bar { 0%,100% { transform: scaleY(.3); } 30% { transform: scaleY(1); } 60% { transform: scaleY(.55); } }

    /* expanded media: art, title, wave; progress; controls */
    .media { padding: 16px 18px 14px; display: flex; flex-direction: column; gap: 12px; }
    .media .top { display: flex; align-items: center; gap: 12px; }
    .media .art { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; background: #1c1c1e; cursor: pointer; flex: none; }
    .media .meta { flex: 1; min-width: 0; cursor: pointer; }
    .media .title { font-size: 14.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .media .sub { margin-top: 2px; font-size: 13px; color: rgba(255,255,255,.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .media .wave { height: 18px; gap: 2.5px; } .media .wave i { width: 3px; }
    .bar { display: flex; align-items: center; gap: 10px; font: 500 11px/1 -apple-system, "SF Pro Text", "Inter", "Segoe UI", system-ui, sans-serif; color: rgba(255,255,255,.5); font-variant-numeric: tabular-nums; }
    .track { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,.18); overflow: hidden; }
    .fill { height: 100%; width: 0; border-radius: 3px; background: #fff; transition: width .9s linear; }
    .controls { display: flex; align-items: center; justify-content: center; gap: 34px; margin-top: -2px; }
    button { all: unset; display: grid; place-items: center; color: #fff; cursor: pointer; border-radius: 50%; transition: transform .2s var(--spring), opacity .2s ease; }
    button:hover { opacity: .8; } button:active { transform: scale(.88); }
    button:focus-visible { outline: 2px solid rgba(255,255,255,.5); outline-offset: 3px; }
    button[disabled] { opacity: .25; pointer-events: none; }
    .controls svg { width: 26px; height: 26px; } .controls .pp svg { width: 32px; height: 32px; }

    /* expanded timer */
    .timerv { display: flex; align-items: center; justify-content: space-between; padding: 0 14px 0 20px; }
    .timerv .label { font-size: 12.5px; color: rgba(255,255,255,.55); }
    .timerv .big { margin-top: 2px; font: 300 30px/1 -apple-system, "SF Pro Display", "Inter", "Segoe UI", system-ui, sans-serif; color: #ff9f0a; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .timerv .btns { display: flex; gap: 8px; }
    .timerv button { width: 38px; height: 38px; background: rgba(255,255,255,.12); }
    .timerv button.stop { background: rgba(255,69,58,.25); color: #ff453a; }
    .timerv button svg { width: 16px; height: 16px; }

    /* a note */
    .note { display: flex; align-items: center; justify-content: center; gap: 9px; padding: 0 18px; white-space: nowrap; font-weight: 500; }
    .note .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.35); flex: none; }
    .note .dot.on { background: #30d158; box-shadow: 0 0 8px rgba(48,209,88,.6); }
  `;

  // views: [width, height, radius]
  const SIZE = { hidden: [120, 34, 17], compact: [208, 34, 17], media: [372, 158, 40], timer: [300, 72, 36], note: [0, 36, 18] };

  const parts = {};
  function build() {
    hostEl = document.createElement('hush-live');
    root = hostEl.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CSS;
    island = el('div', 'island');
    island.setAttribute('role', 'status');
    island.setAttribute('aria-live', 'polite');

    // compact
    parts.cArt = el('img', 'art'); parts.cArt.alt = '';
    parts.cLead = el('span', 'lead', [svg('clock', false)]);
    parts.cWave = el('span', 'wave', [el('i'), el('i'), el('i'), el('i')]);
    parts.cTime = el('span', 't');
    const compact = el('div', 'layer compact', [el('span', 'lead-wrap', [parts.cArt, parts.cLead]), el('span', 'trail', [parts.cTime, parts.cWave])]);

    // media
    parts.mArt = el('img', 'art'); parts.mArt.alt = '';
    parts.mTitle = el('div', 'title'); parts.mSub = el('div', 'sub');
    parts.mWave = el('span', 'wave', [el('i'), el('i'), el('i'), el('i')]);
    const meta = el('div', 'meta', [parts.mTitle, parts.mSub]);
    parts.mPos = el('span'); parts.mDur = el('span');
    parts.mFill = el('div', 'fill');
    parts.prev = el('button', 'prev', [svg('prev')]); parts.prev.setAttribute('aria-label', 'previous');
    parts.pp = el('button', 'pp', [svg('pause')]); parts.pp.setAttribute('aria-label', 'play or pause');
    parts.next = el('button', 'next', [svg('next')]); parts.next.setAttribute('aria-label', 'next');
    const mediaV = el('div', 'layer media', [
      el('div', 'top', [parts.mArt, meta, parts.mWave]),
      el('div', 'bar', [parts.mPos, el('div', 'track', [parts.mFill]), parts.mDur]),
      el('div', 'controls', [parts.prev, parts.pp, parts.next])
    ]);
    for (const x of [parts.mArt, meta]) x.addEventListener('click', () => send('focus'));
    parts.pp.addEventListener('click', () => { send('toggle'); if (media) { media.playing = !media.playing; media.at = Date.now(); render(); } });
    parts.next.addEventListener('click', () => send('next'));
    parts.prev.addEventListener('click', () => send('prev'));

    // timer
    parts.tLabel = el('div', 'label'); parts.tBig = el('div', 'big');
    parts.tAdd = el('button', 'add', [svg('plus', false)]); parts.tAdd.setAttribute('aria-label', 'add a minute');
    parts.tStop = el('button', 'stop', [svg('x', false)]); parts.tStop.setAttribute('aria-label', 'cancel timer');
    const timerV = el('div', 'layer timerv', [el('div', '', [parts.tLabel, parts.tBig]), el('div', 'btns', [parts.tAdd, parts.tStop])]);
    parts.tAdd.addEventListener('click', () => { if (timer) chrome.storage.local.set({ hushTimer: { ...timer, endsAt: Math.max(timer.endsAt, Date.now()) + 60000, total: timer.total + 60000, done: false } }); });
    parts.tStop.addEventListener('click', () => chrome.storage.local.remove('hushTimer'));

    // note
    parts.nDot = el('span', 'dot'); parts.nText = el('span', 'text');
    const noteV = el('div', 'layer note', [parts.nDot, parts.nText]);

    island.append(compact, mediaV, timerV, noteV);
    root.append(style, island);
    (document.body || document.documentElement).append(hostEl);

    island.addEventListener('pointerenter', () => { clearTimeout(collapseTimer); if (activity()) { expanded = true; render(); } });
    island.addEventListener('pointerleave', () => { clearTimeout(collapseTimer); collapseTimer = setTimeout(() => { expanded = false; render(); }, 280); });
    island.addEventListener('click', (e) => { if (e.target === island && activity()) { expanded = !expanded; render(); } });
  }

  function send(action) {
    if (!media) return;
    try { chrome.runtime.sendMessage({ type: 'hush:media-cmd', tabId: media.tabId, action }); } catch { /* the extension was reloaded */ }
  }

  const fmt = (s) => { if (!isFinite(s) || s < 0) return '–:––'; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const TINT = { 'open.spotify.com': '#1ed760', 'music.youtube.com': '#ff4e45', 'www.youtube.com': '#ff6b6b', 'soundcloud.com': '#ff7a1a', 'music.apple.com': '#fa5c75' };
  const timerLeft = () => (timer ? Math.max(0, (timer.endsAt - Date.now()) / 1000) : 0);
  const activity = () => !!(media || timer);
  const measure = (text) => { const c = measure.c || (measure.c = document.createElement('canvas').getContext('2d')); c.font = '500 13px -apple-system, "Segoe UI", system-ui, sans-serif'; return Math.ceil(c.measureText(text).width); };

  function render() {
    if (!wanted() || !(activity() || note)) {
      if (island) { island.removeAttribute('data-shown'); island.dataset.view = 'hidden'; size('hidden'); }
      stopTick();
      return;
    }
    if (!hostEl || !hostEl.isConnected) build();
    let view = 'compact';
    if (note && note.until > Date.now()) view = 'note';
    else if (expanded) view = media ? 'media' : timer ? 'timer' : 'compact';
    island.dataset.view = view;
    island.toggleAttribute('data-tucked', tucked);
    requestAnimationFrame(() => island.setAttribute('data-shown', ''));

    // compact contents
    const t = timer && !timer.done ? timerLeft() : null;
    parts.cArt.hidden = !media; parts.cLead.hidden = !!media || !timer;
    if (media && media.art && parts.cArt.src !== media.art) parts.cArt.src = media.art;
    parts.cWave.hidden = !media;
    parts.cTime.textContent = t != null ? fmt(t) : '';
    island.classList.toggle('playing', !!(media && media.playing));
    island.style.setProperty('--tint', (media && TINT[media.site]) || '#fff');

    if (media) {
      if (parts.mArt.src !== (media.art || '')) parts.mArt.src = media.art || '';
      parts.mTitle.textContent = media.title || '';
      parts.mSub.textContent = media.artist || media.site || '';
      parts.pp.replaceChildren(svg(media.playing ? 'pause' : 'play'));
      parts.next.disabled = !media.canNext;
      parts.prev.disabled = !media.canPrev;
    }
    if (timer) {
      parts.tLabel.textContent = timer.done ? 'Timer done' : (timer.label || 'Timer');
      parts.tBig.textContent = fmt(timerLeft());
    }
    if (view === 'note') {
      parts.nText.textContent = note.text;
      parts.nDot.className = 'dot' + (note.active ? ' on' : '');
    }
    size(view);
    updateProgress();
    startTick();
  }

  function size(view) {
    if (!island) return;
    let [w, h, r] = SIZE[view];
    if (view === 'note') w = Math.min(440, measure(note ? note.text : '') + 56);
    if (view === 'compact' && !media && timer) w = 150;
    island.style.setProperty('--w', w + 'px');
    island.style.setProperty('--h', h + 'px');
    island.style.setProperty('--r', r + 'px');
  }

  function updateProgress() {
    if (!media || !island) return;
    const pos = media.duration ? Math.min(media.duration, media.position + (media.playing ? (Date.now() - media.at) / 1000 : 0)) : 0;
    parts.mPos.textContent = media.duration ? fmt(pos) : '';
    parts.mDur.textContent = media.duration ? '-' + fmt(media.duration - pos) : 'live';
    parts.mFill.style.width = media.duration ? (pos / media.duration) * 100 + '%' : '100%';
  }

  function startTick() {
    if (tick) return;
    tick = setInterval(() => {
      if (note && note.until <= Date.now()) { note = null; render(); return; }
      if (timer && !timer.done && timerLeft() <= 0) finishTimer();
      if (timer) { parts.cTime.textContent = timer.done ? '' : fmt(timerLeft()); parts.tBig.textContent = fmt(timerLeft()); }
      updateProgress();
    }, 1000);
  }
  function stopTick() { clearInterval(tick); tick = 0; }

  async function finishTimer() {
    // the first visible tab to notice says so, once
    timer = { ...timer, done: true };
    if (document.visibilityState !== 'visible') return;
    const r = await chrome.storage.local.get('hushTimer').catch(() => ({}));
    if (!r.hushTimer || r.hushTimer.done) return;
    chrome.storage.local.set({ hushTimer: { ...r.hushTimer, done: true } });
    flash(`${r.hushTimer.label || 'Timer'} done`, true, 4000);
    chime();
    setTimeout(() => chrome.storage.local.remove('hushTimer'), 6000);
  }
  function chime() {
    try {
      const ac = new AudioContext();
      [[880, 0], [1320, 0.16]].forEach(([f, t]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0, ac.currentTime + t);
        g.gain.linearRampToValueAtTime(0.08, ac.currentTime + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.9);
        o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 1);
      });
    } catch { /* no sound is fine */ }
  }

  /** a short note in the island (hush's toasts land here when the island is on) */
  function flash(text, active, ms = 2000) {
    note = { text: String(text), active: !!active, until: Date.now() + ms };
    expanded = false;
    render();
    setTimeout(render, ms + 20);
  }

  // out of the way: an input under the island, or fullscreen
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!(t instanceof Element) || !t.matches('input, textarea, [contenteditable="true"], [contenteditable=""]')) return;
    const r = t.getBoundingClientRect(), cx = innerWidth / 2;
    const under = r.top < 70 && r.right > cx - 200 && r.left < cx + 200;
    if (under !== tucked) { tucked = under; render(); }
  }, true);
  document.addEventListener('focusout', () => { if (tucked) { tucked = false; setTimeout(render, 120); } }, true);
  document.addEventListener('fullscreenchange', render);

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'hush:live') { media = msg.media ? { ...msg.media, at: Date.now() } : null; if (!media) expanded = false; render(); }
    if (msg.type === 'hush:media-do') control(msg.action);
  });

  // hush's toasts become island notes while the island is on
  const plainToast = H.toast;
  H.toast = (text, active) => { if (wanted()) flash(text, active); else if (plainToast) plainToast(text, active); };

  /* ============================ this tab's media ============================= */

  const $ = (s) => document.querySelector(s);
  const clickIf = (s) => { const b = $(s); if (b) { b.click(); return true; } return false; };
  const secs = (txt) => { const p = String(txt || '').replace('-', '').trim().split(':').map(Number); return p.some(isNaN) ? NaN : p.reduce((a, b) => a * 60 + b, 0); };

  // sites with buttons we can press for play / next / previous
  const SITES = {
    'open.spotify.com': {
      read() {
        const pp = $('[data-testid="control-button-playpause"]');
        if (!pp) return null;
        const label = (pp.getAttribute('aria-label') || '').toLowerCase();
        const pos = secs(($('[data-testid="playback-position"]') || {}).textContent);
        const dur = secs(($('[data-testid="playback-duration"]') || {}).textContent);
        // the player bar's corner ("now-playing-widget-v2" since 2026; the older names stay as a fallback)
        const w = $('[data-testid^="now-playing-widget"]:not([data-testid$="byline"])') || document;
        const art = w.querySelector('[data-testid="cover-art-image"], img');
        const byline = w.querySelector('[data-testid$="byline"], [data-testid="context-item-info-subtitles"]');
        const artists = byline ? [...byline.querySelectorAll('a[href*="/artist/"], a[href*="/show/"]')].map((a) => a.textContent.trim()).filter(Boolean) : [];
        return {
          title: (w.querySelector('[data-testid="context-item-link"], [data-testid="context-item-info-title"]') || {}).textContent,
          artist: artists.join(', ') || (byline || {}).textContent || [...document.querySelectorAll('[data-testid="context-item-info-artist"]')].map((a) => a.textContent).join(', '),
          art: art && art.src,
          playing: /pause/.test(label),
          position: isFinite(pos) ? pos : 0,
          duration: isFinite(dur) ? (String(($('[data-testid="playback-duration"]') || {}).textContent).trim().startsWith('-') ? pos + dur : dur) : 0
        };
      },
      toggle: () => clickIf('[data-testid="control-button-playpause"]'),
      next: () => clickIf('[data-testid="control-button-skip-forward"]'),
      prev: () => clickIf('[data-testid="control-button-skip-back"]'),
      canNext: true, canPrev: true
    },
    'www.youtube.com': { next: () => clickIf('.ytp-next-button'), prev: () => clickIf('.ytp-prev-button:not([aria-disabled="true"])'), canNext: true, canPrev: false },
    'music.youtube.com': { toggle: () => clickIf('#play-pause-button'), next: () => clickIf('.next-button'), prev: () => clickIf('.previous-button'), canNext: true, canPrev: true },
    'soundcloud.com': { toggle: () => clickIf('.playControl'), next: () => clickIf('.skipControl__next'), prev: () => clickIf('.skipControl__previous'), canNext: true, canPrev: true }
  };
  const site = SITES[host] || {};

  function mainElement() {
    const els = [...document.querySelectorAll('video, audio')].filter((e) => e.currentTime > 0 || !e.paused);
    return els.find((e) => !e.paused) || els.sort((a, b) => (b.duration || 0) - (a.duration || 0))[0] || null;
  }

  function readMedia() {
    let s = site.read ? site.read() : null;
    const md = navigator.mediaSession && navigator.mediaSession.metadata;
    const e = mainElement();
    if (!s) {
      // only real players: something that told the browser what it plays, or audible media of a real length
      const audible = e && !e.muted && e.volume > 0 && isFinite(e.duration) && e.duration > 45;
      if (!md && !audible) return null;
      s = {
        title: (md && md.title) || document.title,
        artist: (md && (md.artist || md.album)) || '',
        art: '',
        playing: e ? !e.paused : navigator.mediaSession.playbackState === 'playing',
        position: e ? e.currentTime : 0,
        duration: e && isFinite(e.duration) ? e.duration : 0
      };
    }
    if (md && md.artwork && md.artwork.length) s.art = s.art || md.artwork[md.artwork.length - 1].src;
    if (md && !s.title) s.title = md.title;
    if (md && !s.artist) s.artist = md.artist;
    if (!s.title) return null;
    s.title = String(s.title).trim();
    s.artist = String(s.artist || '').trim();
    s.canNext = !!site.canNext;
    s.canPrev = !!site.canPrev;
    return s;
  }

  function control(action) {
    if (action === 'toggle') {
      if (site.toggle && site.toggle()) return;
      const e = mainElement();
      if (e) { if (e.paused) e.play().catch(() => {}); else e.pause(); }
    } else if (action === 'next' && site.next) site.next();
    else if (action === 'prev' && site.prev) site.prev();
    setTimeout(report, 400);
  }

  let last = '', lastSent = 0, changedAt = 0, hadMedia = false;
  function report() {
    let s = null;
    try { s = readMedia(); } catch { s = null; }
    if (!s) {
      if (hadMedia) { hadMedia = false; last = ''; post(null); }
      return;
    }
    const key = `${s.title}|${s.artist}|${s.playing}|${s.art}`;
    if (key !== last) changedAt = Date.now();
    // changes go out at once; while playing, the position is refreshed every 5 seconds
    if (key !== last || (s.playing && Date.now() - lastSent > 5000)) {
      last = key;
      hadMedia = true;
      post({ ...s, changedAt });
    }
  }
  function post(state) {
    lastSent = Date.now();
    try { chrome.runtime.sendMessage({ type: 'hush:media', state }); } catch { clearInterval(reporter); }
  }
  const reporter = setInterval(report, 1000);
  for (const ev of ['play', 'pause', 'ended', 'loadedmetadata']) document.addEventListener(ev, () => setTimeout(report, 50), true);
  addEventListener('pagehide', () => { if (hadMedia) post(null); });

  // ask what's playing elsewhere once settings are in
  ready.then(() => { try { chrome.runtime.sendMessage({ type: 'hush:live?' }); } catch { /* reloaded */ } });

  H.live = {
    flash,
    /** minutes → a timer every tab can see */
    startTimer(minutes, label) { const ms = Math.round(minutes * 60000); return chrome.storage.local.set({ hushTimer: { endsAt: Date.now() + ms, total: ms, label: label || `${minutes} min timer`, done: false } }); },
    cancelTimer: () => chrome.storage.local.remove('hushTimer'),
    timer: () => timer
  };
})();
