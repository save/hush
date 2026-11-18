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
    if (area === 'local' && changes.hushIslandPos && !drag) { pos = changes.hushIslandPos.newValue || { x: 0.5, y: 0 }; place(); lookSoon(300); }
  });
  const wanted = () => settings.island !== false && H.isOn(settings, host) && !document.fullscreenElement;

  /* =============================== the island ================================ */

  let hostEl = null, root = null, island = null;
  let media = null;          // from the background: what's playing in another tab
  let timer = null;          // { endsAt, total, label, done }
  let note = null;           // { text, active, until }
  let notice = null;         // { host, title, body, tabId, until }: a notification from another tab
  let expanded = false, tucked = false, collapseTimer = 0, tick = 0;
  // where it sits: x is the centre as a share of the width, y the top as a share of the height
  const HOME = { x: 0.5, y: 0 };
  let pos = { ...HOME };
  let drag = null, justDragged = false;
  chrome.storage.local.get('hushIslandPos').then((r) => { if (r.hushIslandPos) { pos = r.hushIslandPos; place(); } }).catch(() => {});

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
      /* a soft spring: overshoots a touch, settles without wobbling */
      --spring: linear(0, 0.0071 1.1%, 0.0285 2.3%, 0.1092 4.7%, 0.4359 11.5%, 0.6145 16%, 0.7539 20.4%, 0.8605 25.1%, 0.9366 30.2%, 0.9653 32.9%, 0.9882 35.8%, 1.0084 39.2%, 1.0215 43.1%, 1.0272 47.6%, 1.0254 53.5%, 1.0102 66.8%, 1.0019 81.7%, 1);
      position: fixed; z-index: 2147483647;
      top: var(--top, 8px); bottom: var(--bottom, auto); left: var(--left, 50%);
      width: var(--w, 120px); height: var(--h, 34px); border-radius: var(--r, 17px);
      transform: translateX(-50%) translateY(var(--y, -10px)) scale(var(--sx, 0.5), var(--sy, 0.6));
      transform-origin: 50% var(--origin, 0%);
      opacity: var(--o, 0);
      background: #000; color: #fff; overflow: hidden;
      box-shadow: 0 10px 34px -10px rgba(0,0,0,.55), 0 0 0 0.5px rgba(255,255,255,.08) inset;
      font: 500 13px/1.25 -apple-system, "SF Pro Text", "Inter", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
      letter-spacing: -0.01em; -webkit-font-smoothing: antialiased;
      /* going away: quick and quiet */
      transition: transform .28s cubic-bezier(.4, 0, 1, 1), opacity .2s ease, width .3s var(--ease), height .3s var(--ease), border-radius .3s var(--ease);
      user-select: none; cursor: grab; touch-action: none;
    }
    /* arriving and changing size: the spring */
    .island[data-shown] {
      --y: 0px; --sx: 1; --sy: 1; --o: 1;
      transition: width .62s var(--spring), height .62s var(--spring), border-radius .62s var(--spring),
        transform .6s var(--spring), opacity .18s ease, left .5s var(--spring), top .5s var(--spring), bottom .5s var(--spring);
    }
    .island[data-tucked] { --y: -14px; --sx: .7; --sy: .7; --o: 0; pointer-events: none; }
    .island[data-dragging] { transition: width .62s var(--spring), height .62s var(--spring), border-radius .62s var(--spring), transform .3s var(--ease), opacity .18s ease; cursor: grabbing; --sx: 1.04; --sy: 1.04; box-shadow: 0 24px 60px -16px rgba(0,0,0,.7), 0 0 0 0.5px rgba(255,255,255,.1) inset; }
    /* a new song or note: a small bump, like the real one */
    .island.bump { animation: bump .5s var(--spring); }
    @keyframes bump { 0% { scale: 1; } 30% { scale: 1.045 1.08; } 100% { scale: 1; } }
    @media (prefers-reduced-motion: reduce) { .island, .island[data-shown] { transition-duration: .01s !important; } .island.bump { animation: none; } }

    /* layers: the old one blurs away fast, the new one's parts arrive one after another */
    .layer { position: absolute; inset: 0; opacity: 0; filter: blur(6px); transform: scale(.94);
      transition: opacity .14s ease, filter .18s ease, transform .3s var(--ease); pointer-events: none; }
    .island[data-view="compact"] .compact,
    .island[data-view="media"] .media,
    .island[data-view="timer"] .timerv,
    .island[data-view="note"] .note,
    .island[data-view="notice"] .notice { opacity: 1; filter: none; transform: none; pointer-events: auto; transition: opacity .3s ease .1s, filter .35s ease .1s, transform .55s var(--spring) .06s; }
    .island[data-view="media"] .media > *, .island[data-view="timer"] .timerv > *, .island[data-view="notice"] .notice > * { animation: rise .55s var(--spring) both; }
    .island[data-view="notice"] .notice > :nth-child(2) { animation-delay: .06s; } .island[data-view="notice"] .notice > :nth-child(3) { animation-delay: .12s; }
    .island[data-view="media"] .media > :nth-child(2), .island[data-view="timer"] .timerv > :nth-child(2) { animation-delay: .07s; }
    .island[data-view="media"] .media > :nth-child(3) { animation-delay: .13s; }
    @keyframes rise { from { opacity: 0; transform: translateY(8px) scale(.96); filter: blur(4px); } }
    .island[data-view="media"] .media .art { animation: grow .6s var(--spring) both; }
    @keyframes grow { from { transform: scale(.42); border-radius: 6px; } }
    /* anchored to the bottom of the screen: grows upward, arrives from below */
    .island[data-anchor="bottom"] { --y: 10px; }
    .island[data-anchor="bottom"][data-shown] { --y: 0px; }

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

    /* a notification from another tab: app icon, who or what, one line, and where it's from */
    .notice { display: flex; align-items: center; gap: 12px; padding: 0 18px 0 14px; cursor: pointer; }
    .notice .app { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; flex: none; background: var(--app, #333); box-shadow: inset 0 0 0 .5px rgba(255,255,255,.14); }
    .notice .app svg { width: 21px; height: 21px; fill: #fff; }
    .notice .words { flex: 1; min-width: 0; }
    .notice .who { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notice .what { margin-top: 2px; font-size: 13px; color: rgba(255,255,255,.62); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notice .from { align-self: flex-start; margin-top: 17px; font-size: 11.5px; color: rgba(255,255,255,.4); white-space: nowrap; }
  `;

  // views: [width, height, radius]
  const SIZE = { hidden: [120, 34, 17], compact: [208, 34, 17], media: [372, 158, 40], timer: [300, 72, 36], note: [0, 36, 18], notice: [360, 68, 34] };

  const parts = {};
  let hovering = false;
  // a brand glyph (24×24 path) for a notice's app icon
  function pathSvg(d) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d || 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z');
    s.append(p);
    return s;
  }
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

    // notice
    parts.xApp = el('span', 'app'); parts.xWho = el('div', 'who'); parts.xWhat = el('div', 'what'); parts.xFrom = el('span', 'from');
    const noticeV = el('div', 'layer notice', [parts.xApp, el('div', 'words', [parts.xWho, parts.xWhat]), parts.xFrom]);
    noticeV.addEventListener('click', (e) => {
      e.stopPropagation();
      if (justDragged || !notice) return;
      try { chrome.runtime.sendMessage({ type: 'hush:notice-open', tabId: notice.tabId }); } catch { /* reloaded */ }
      notice = null; render();
    });

    island.append(compact, mediaV, timerV, noteV, noticeV);
    root.append(style, island);
    (document.body || document.documentElement).append(hostEl);

    island.title = 'drag to move · double-click to put back';
    island.addEventListener('pointerenter', () => { hovering = true; });
    island.addEventListener('pointerleave', () => { hovering = false; if (notice && notice.until <= Date.now()) setTimeout(render, 600); });
    island.addEventListener('pointerenter', () => { clearTimeout(collapseTimer); if (activity() && !drag) { expanded = true; render(); } });
    island.addEventListener('pointerleave', () => { clearTimeout(collapseTimer); collapseTimer = setTimeout(() => { if (!drag) { expanded = false; render(); } }, 280); });
    island.addEventListener('click', (e) => {
      if (justDragged) { justDragged = false; e.stopPropagation(); return; }
      if (e.target === island && activity()) { expanded = !expanded; render(); }
    }, true);
    island.addEventListener('dblclick', (e) => { if (e.target.closest && e.target.closest('button')) return; pos = { ...HOME }; spot = null; chrome.storage.local.set({ hushIslandPos: pos }).catch(() => {}); place(); lookSoon(350); });
    island.addEventListener('pointerdown', startDrag);
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
    if (notice && notice.until <= Date.now() && !hovering) notice = null;
    if (!wanted() || !(activity() || note || notice)) {
      if (island) { island.removeAttribute('data-shown'); island.dataset.view = 'hidden'; size('hidden'); }
      stopTick();
      return;
    }
    if (!hostEl || !hostEl.isConnected) build();
    let view = 'compact';
    if (notice) view = 'notice';
    else if (note && note.until > Date.now()) view = 'note';
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
    if (view === 'notice') {
      const a = (H.noticeApps || {})[notice.host] || { name: notice.host, color: '#333', path: '' };
      parts.xApp.style.setProperty('--app', a.color);
      parts.xApp.replaceChildren(pathSvg(a.path));
      parts.xWho.textContent = notice.title;
      parts.xWhat.textContent = notice.body;
      parts.xWhat.hidden = !notice.body;
      parts.xFrom.textContent = a.name + ' · now';
    }
    if (view === 'note') {
      parts.nText.textContent = note.text;
      parts.nDot.className = 'dot' + (note.active ? ' on' : '');
    }
    size(view);
    place();
    if (!spot && !lookTimer) lookSoon(60);
    const songKey = media ? media.title + '|' + media.artist : '';
    if (songKey && songKey !== lastSong && lastSong !== null) bump();
    lastSong = songKey;
    updateProgress();
    startTick();
  }
  let lastSong = null;
  function bump() { if (!island) return; island.classList.remove('bump'); void island.offsetWidth; island.classList.add('bump'); }

  // put it where it was left, kept on screen even as it grows
  function place() {
    if (!island) return;
    const w = parseFloat(island.style.getPropertyValue('--w')) || 200;
    const h = parseFloat(island.style.getPropertyValue('--h')) || 34;
    const half = w / 2 + 8;
    const want = atHome() && spot != null ? spot : pos.x * innerWidth;
    const cx = Math.min(Math.max(want, half), innerWidth - half);
    island.style.setProperty('--left', cx + 'px');
    const bottomHalf = pos.y > 0.5;
    island.dataset.anchor = bottomHalf ? 'bottom' : 'top';
    if (bottomHalf) {
      const fromBottom = Math.max(8, innerHeight - pos.y * innerHeight - 34);
      island.style.setProperty('--top', 'auto');
      island.style.setProperty('--bottom', Math.min(fromBottom, innerHeight - h - 8) + 'px');
      island.style.setProperty('--origin', '100%');
    } else {
      const top = atHome() && spotY != null ? spotY : Math.max(8, pos.y * innerHeight);
      island.style.setProperty('--top', Math.min(top, innerHeight - h - 8) + 'px');
      island.style.setProperty('--bottom', 'auto');
      island.style.setProperty('--origin', '0%');
    }
  }
  addEventListener('resize', () => { lookSoon(150); place(); });

  /* ---- staying out of the way ----------------------------------------------
     At its home spot the island would sit on top of whatever the site puts at the top
     centre: YouTube's search box, X's tabs, Reddit's and Roblox's search, GitHub's header.
     So it looks along the strip it would cover, marks every link, button, field, tab,
     icon and line of text there, and slides into the nearest gap wide enough. A spot you
     dragged it to is yours: it stays put. */
  let spot = null, spotY = null, lookTimer = 0, lastHref = location.href;
  const atHome = () => Math.abs(pos.x - HOME.x) < 0.001 && pos.y === HOME.y;
  const BUSY = 'a, button, input, textarea, select, label, summary, [role="button"], [role="link"], [role="tab"], [role="search"], [role="searchbox"], [role="combobox"], [role="menuitem"], [contenteditable=""], [contenteditable="true"], img, svg, video, canvas, picture';
  function deepAt(x, y) {
    let hit = null;
    for (const e of document.elementsFromPoint(x, y)) if (e !== hostEl) { hit = e; break; }
    // reach into open shadow roots (Reddit is built out of them)
    for (let i = 0; hit && hit.shadowRoot && i < 6; i++) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    return hit;
  }
  const range = document.createRange();
  function busyAt(x, y) {
    const e = deepAt(x, y);
    if (!e || e === document.body || e === document.documentElement) return false;
    if (e.closest(BUSY)) {
      // a link or button the width of the page is a backdrop, not a control
      const r = e.closest(BUSY).getBoundingClientRect();
      return r.width < innerWidth * 0.6;
    }
    for (const n of e.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 4 && y <= r.bottom + 4) return true;
    }
    return false;
  }
  function look() {
    lookTimer = 0;
    if (!island || !atHome() || expanded || drag || !island.hasAttribute('data-shown')) return;
    const W = innerWidth, step = 12, cols = Math.ceil(W / step);
    const top = 8, h = 34;
    const ys = [top + 7, top + h - 7];
    const free = new Uint8Array(cols);
    for (let c = 0; c < cols; c++) {
      const x = c * step + step / 2;
      free[c] = ys.some((y) => busyAt(x, y)) ? 0 : 1;
    }
    const w = SIZE.compact[0], pad = w / 2 + 14;
    let best = null;
    for (let c = 0; c < cols;) {
      if (!free[c]) { c++; continue; }
      let e = c;
      while (e < cols && free[e]) e++;
      const lo = c * step + pad, hi = e * step - pad;
      if (hi >= lo) {
        const cx = Math.min(Math.max(W / 2, lo), hi);
        if (!best || Math.abs(cx - W / 2) < Math.abs(best - W / 2)) best = cx;
      }
      c = e;
    }
    // no gap wide enough (Roblox's bar is links, a long search box, then buttons):
    // sit just under the site's own fixed header instead of on it
    let y = null;
    if (best == null) {
      best = W / 2;
      for (let e = deepAt(W / 2, top + h / 2); e && e !== document.body; e = e.parentElement || (e.getRootNode && e.getRootNode().host)) {
        const p = getComputedStyle(e).position;
        if (p !== 'fixed' && p !== 'sticky') continue;
        const r = e.getBoundingClientRect();
        if (r.top <= 4 && r.bottom > top && r.bottom < 180) y = Math.round(r.bottom + 8);
        break;
      }
    }
    if (best !== spot || y !== spotY) { spot = best; spotY = y; place(); }
  }
  // the scan is a few hundred hit tests: run it when the page is idle
  const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 600 }) : f());
  function lookSoon(ms = 250) { clearTimeout(lookTimer); lookTimer = setTimeout(() => idle(look), ms); }
  addEventListener('scroll', () => lookSoon(300), { passive: true });

  function startDrag(e) {
    if (e.button !== 0 || (e.target.closest && e.target.closest('button'))) return;
    const r = island.getBoundingClientRect();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - r.top, moved: false };
    island.setPointerCapture(e.pointerId);
    island.addEventListener('pointermove', onDrag);
    island.addEventListener('pointerup', endDrag);
    island.addEventListener('pointercancel', endDrag);
  }
  function onDrag(e) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
    if (!drag.moved) { drag.moved = true; expanded = false; island.setAttribute('data-dragging', ''); render(); }
    pos = { x: Math.min(1, Math.max(0, (e.clientX - drag.dx) / innerWidth)), y: Math.min(1, Math.max(0, (e.clientY - drag.dy) / innerHeight)) };
    // follow the pointer exactly while dragging (top-anchored), settle on release
    island.dataset.anchor = 'top';
    island.style.setProperty('--left', pos.x * innerWidth + 'px');
    island.style.setProperty('--top', pos.y * innerHeight + 'px');
    island.style.setProperty('--bottom', 'auto');
  }
  function endDrag() {
    island.removeEventListener('pointermove', onDrag);
    island.removeEventListener('pointerup', endDrag);
    island.removeEventListener('pointercancel', endDrag);
    if (drag && drag.moved) {
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 300);
      // near the top centre, snap home
      if (Math.abs(pos.x - 0.5) < 0.06 && pos.y < 0.06) { pos = { ...HOME }; spot = null; lookSoon(350); }
      chrome.storage.local.set({ hushIslandPos: pos }).catch(() => {});
    }
    drag = null;
    island.removeAttribute('data-dragging');
    place();
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

  let looks = 0;
  function startTick() {
    if (tick) return;
    tick = setInterval(() => {
      if (note && note.until <= Date.now()) { note = null; render(); return; }
      if (notice && notice.until <= Date.now() && !hovering) { notice = null; render(); return; }
      if (timer && !timer.done && timerLeft() <= 0) finishTimer();
      if (timer) { parts.cTime.textContent = timer.done ? '' : fmt(timerLeft()); parts.tBig.textContent = fmt(timerLeft()); }
      updateProgress();
      // single-page sites: a new page, a new header; otherwise a quiet recheck now and then
      if (location.href !== lastHref) { lastHref = location.href; lookSoon(400); }
      else if (++looks % 12 === 0) lookSoon(0);
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
    bump();
    setTimeout(render, ms + 20);
  }

  // out of the way: an input under the island, or fullscreen
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!(t instanceof Element) || !t.matches('input, textarea, [contenteditable="true"], [contenteditable=""]')) return;
    if (!island) return;
    const r = t.getBoundingClientRect(), i = island.getBoundingClientRect();
    const under = r.top < i.bottom + 24 && r.bottom > i.top - 24 && r.right > i.left - 40 && r.left < i.right + 40;
    if (under !== tucked) { tucked = under; render(); }
  }, true);
  document.addEventListener('focusout', () => { if (tucked) { tucked = false; setTimeout(render, 120); } }, true);
  document.addEventListener('fullscreenchange', render);

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'hush:live') { media = msg.media ? { ...msg.media, at: Date.now() } : null; if (!media) expanded = false; render(); }
    if (msg.type === 'hush:media-do') control(msg.action);
    if (msg.type === 'hush:notice-show' && msg.notice) {
      notice = { ...msg.notice, until: Date.now() + 5500 };
      expanded = false;
      render();
      bump();
    }
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
    // muted players are previews (YouTube's hover previews on the home page), not something you're watching
    const els = [...document.querySelectorAll('video, audio')].filter((e) => !e.muted && (e.currentTime > 0 || !e.paused) && !e.closest('#inline-preview-player, ytd-video-preview, #video-preview'));
    return els.find((e) => !e.paused) || els.sort((a, b) => (b.duration || 0) - (a.duration || 0))[0] || null;
  }

  function readMedia() {
    let s = site.read ? site.read() : null;
    const md = navigator.mediaSession && navigator.mediaSession.metadata;
    const e = mainElement();
    // YouTube keeps the last video's details around after you leave it: only a real player counts
    if (!s && host === 'www.youtube.com' && !e) return null;
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
