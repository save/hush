// hush — "tune" command palette (Ctrl/⌘+K) and toasts. Both live in a closed
// shadow root so site CSS can't touch them (and "still motion" can't either).
(() => {
  const H = globalThis.Hush;
  if (!H || H.palette) return;

  const FONT = `"Inter","Geist","SF Pro Text",-apple-system,"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif`;

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }

    /* shadcn/ui zinc tokens */
    .root {
      --background: #09090b; --popover: #18181b; --foreground: #fafafa;
      --muted: #27272a; --muted-foreground: #a1a1aa;
      --accent: rgba(255,255,255,.06); --border: rgba(255,255,255,.1); --input: rgba(255,255,255,.15);
      --primary: #e4e4e7; --primary-foreground: #18181b; --ring: rgba(161,161,170,.5);
      --overlay: rgba(0,0,0,.5); --dot: #ff4b4b;
      --shadow: 0 16px 48px -12px rgba(0,0,0,.55), 0 4px 12px -4px rgba(0,0,0,.35);
      --ease: cubic-bezier(.32,.72,0,1);
      font: 400 14px/1.5 ${FONT};
      -webkit-font-smoothing: antialiased;
      color: var(--foreground);
    }
    .root.light {
      --background: #ffffff; --popover: #ffffff; --foreground: #09090b;
      --muted: #f4f4f5; --muted-foreground: #71717a;
      --accent: #f4f4f5; --border: #e4e4e7; --input: #e4e4e7;
      --primary: #18181b; --primary-foreground: #fafafa;
      --overlay: rgba(0,0,0,.18);
      --shadow: 0 16px 48px -12px rgba(0,0,0,.18), 0 4px 12px -4px rgba(0,0,0,.08);
    }

    /* ---- command dialog ---- */
    .scrim {
      position: fixed; inset: 0; z-index: 2147483646;
      display: flex; align-items: flex-start; justify-content: center;
      padding: 14vh 16px 0;
      background: var(--overlay);
      opacity: 0;
      transition: opacity .18s ease;
    }
    .scrim.open { opacity: 1; }
    .box {
      width: min(560px, 100%);
      background: var(--popover);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: var(--shadow);
      overflow: hidden;
      opacity: 0;
      transform: translateY(-4px) scale(.96);
      transition: opacity .2s var(--ease), transform .3s var(--ease);
      will-change: transform, opacity;
    }
    .scrim.open .box { opacity: 1; transform: none; }
    .scrim.closing { transition-duration: .12s; }
    .scrim.closing .box { opacity: 0; transform: scale(.97); transition: opacity .12s ease-in, transform .12s ease-in; }

    .field { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 12px 0 14px; border-bottom: 1px solid var(--border); }
    .glyph { width: 16px; height: 16px; flex: none; color: var(--muted-foreground); opacity: .7; }
    input {
      all: unset; flex: 1; min-width: 0; height: 100%;
      font: inherit; font-size: 14px; color: var(--foreground);
    }
    input::placeholder { color: var(--muted-foreground); }

    .list { position: relative; margin: 0; padding: 4px; max-height: min(360px, 52vh); overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--muted) transparent; overscroll-behavior: contain; }
    .hl {
      position: absolute; left: 4px; right: 4px; top: 0; height: 36px;
      border-radius: 6px; background: var(--accent);
      transition: transform .16s var(--ease), height .16s var(--ease), opacity .12s ease;
      pointer-events: none; will-change: transform;
    }
    .group { padding: 8px 8px 4px; color: var(--muted-foreground); font-size: 12px; font-weight: 500; }
    .item {
      position: relative;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      height: 36px; padding: 0 8px; border-radius: 6px;
      font-size: 14px; color: var(--foreground); cursor: default;
    }
    .item .left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .item .ico { width: 16px; height: 16px; flex: none; color: var(--muted-foreground); transition: color .12s ease; }
    .item.on .ico { color: var(--foreground); }
    .item .label { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item .label::first-letter, .group::first-letter { text-transform: uppercase; }
    .item mark { background: none; color: inherit; font-weight: 600; }
    .right { display: flex; align-items: center; gap: 10px; flex: none; }
    .item.enter { animation: rise .22s var(--ease) both; }
    @keyframes rise { from { opacity: 0; transform: translateY(2px); } }

    /* kbd — flat */
    .keys { display: inline-flex; gap: 3px; }
    kbd {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 5px;
      font: 500 11px/1 ${FONT}; color: var(--muted-foreground);
      background: var(--muted); border: 0; border-radius: 4px;
    }

    /* switch — shadcn */
    .sw { position: relative; width: 32px; height: 18px; border-radius: 99px; background: var(--input); transition: background .2s var(--ease); flex: none; }
    .sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--foreground); box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: transform .25s var(--ease), background .2s ease; }
    .root:not(.light) .sw:not(.active)::after { background: var(--foreground); }
    .root.light .sw:not(.active)::after { background: var(--background); }
    .sw.active { background: var(--primary); }
    .sw.active::after { transform: translateX(14px); background: var(--primary-foreground); }

    /* tabs list — shadcn, for choice options */
    .seg { display: inline-flex; gap: 0; padding: 3px; height: 28px; border-radius: 8px; background: var(--muted); font-size: 12px; }
    .seg span { display: inline-flex; align-items: center; padding: 0 8px; border-radius: 5px; color: var(--muted-foreground); font-weight: 500; transition: color .15s ease, background .2s var(--ease), box-shadow .2s var(--ease); }
    .seg span.cur { color: var(--foreground); background: var(--background); box-shadow: 0 1px 2px rgba(0,0,0,.08); }
    .root:not(.light) .seg span.cur { background: var(--input); box-shadow: none; }

    .empty { padding: 24px 16px; color: var(--muted-foreground); text-align: center; font-size: 14px; }
    .foot { display: flex; align-items: center; gap: 16px; height: 40px; padding: 0 14px; border-top: 1px solid var(--border); color: var(--muted-foreground); font-size: 12px; }
    .foot span { display: inline-flex; align-items: center; gap: 6px; }
    .foot .brand { margin-left: auto; }
    .foot .brand b { color: var(--foreground); font-weight: 600; }

    /* ---- toast — sonner-like card ---- */
    .toasts { position: fixed; left: 0; right: 0; bottom: 24px; z-index: 2147483647; display: flex; justify-content: center; pointer-events: none; }
    .toast {
      display: inline-flex; align-items: center; gap: 10px;
      min-height: 40px; padding: 0 16px 0 14px; border-radius: 10px;
      background: var(--popover); color: var(--foreground);
      border: 1px solid var(--border);
      box-shadow: var(--shadow); font-size: 13px; font-weight: 500;
      opacity: 0; transform: translateY(12px) scale(.96);
      transition: opacity .3s var(--ease), transform .4s var(--ease);
      will-change: transform, opacity;
    }
    .toast.in { opacity: 1; transform: none; }
    .toast.out { opacity: 0; transform: translateY(6px) scale(.98); transition-duration: .18s; }
    .toast .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted-foreground); opacity: .6; }
    .toast .dot.active { background: var(--dot); opacity: 1; }

    @media (prefers-reduced-motion: reduce) {
      .box, .scrim, .hl, .toast, .sw, .sw::after, .seg span { transition-duration: .01ms !important; }
      .item.enter { animation: none; }
    }
  `;

  // tiny DOM builder — no innerHTML, so Trusted Types pages (YouTube, Google) can't block it
  function h(tag, attrs, ...kids) {
    const svg = tag === 'svg' || tag === 'circle' || tag === 'path';
    const el = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    for (const kid of kids) if (kid != null) el.append(kid);
    return el;
  }
  const searchGlyph = () => h('svg', { class: 'glyph', viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round' },
    h('circle', { cx: '7', cy: '7', r: '4.75' }), h('path', { d: 'm10.6 10.6 3.4 3.4' }));
  const caps = (...keys) => h('span', { class: 'keys' }, ...keys.map((k) => h('kbd', null, k)));

  let host = null, shadow = null, rootEl = null, scrim = null, input = null, list = null, hl = null, toastWrap = null;
  let providers = [];
  let items = [];
  let index = 0;
  let open = false;
  let lastFocus = null;
  let renderSeq = 0;

  function ensureHost() {
    if (host) {
      if (!host.isConnected) document.documentElement.append(host);
      return;
    }
    host = document.createElement('hush-ui');
    shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CSS;
    toastWrap = h('div', { class: 'toasts' });
    rootEl = h('div', { class: 'root' }, toastWrap);
    shadow.append(style, rootEl);
    for (const t of ['keydown', 'keyup', 'keypress']) host.addEventListener(t, (e) => e.stopPropagation());
    document.documentElement.append(host);
  }

  function syncTheme() {
    rootEl.classList.toggle('light', document.documentElement.getAttribute('data-hush-theme') === 'light');
  }

  function buildPalette() {
    input = h('input', { type: 'text', placeholder: 'go to, toggle, or search…', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'command' });
    hl = h('div', { class: 'hl' });
    list = h('div', { class: 'list', role: 'listbox' }, hl);
    scrim = h('div', { class: 'scrim' },
      h('div', { class: 'box', role: 'dialog', 'aria-label': 'hush tune' },
        h('div', { class: 'field' }, searchGlyph(), input),
        list,
        h('div', { class: 'foot' },
          h('span', null, caps('↑', '↓'), 'move'),
          h('span', null, caps('↵'), 'run'),
          h('span', null, caps('esc'), 'close'),
          h('span', { class: 'brand' }, h('b', null, 'hush'), ' tune'))));
    scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) close(); });
    input.addEventListener('input', () => { index = 0; render(true); });
  }

  // While the palette is open it owns the keyboard. Many sites (Roblox, GitHub…)
  // grab "typing anywhere" for their own search; registered at document_start,
  // this capture listener runs before theirs and keeps keys away from them.
  // Text still reaches our input because nothing calls preventDefault on it.
  const guard = (e) => {
    if (!open) return;
    if (e.type === 'keydown') {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); close(); }
      else onKey(e);
    }
    e.stopImmediatePropagation();
    // if something stole focus anyway, take it back
    if (input && document.activeElement !== host) input.focus({ preventScroll: true });
  };
  for (const t of ['keydown', 'keypress', 'keyup']) window.addEventListener(t, guard, true);
  // focus pulled out of the palette (site scripts, autofocus) comes straight back
  document.addEventListener('focusin', (e) => {
    if (open && input && e.target !== host) setTimeout(() => open && input.focus({ preventScroll: true }), 0);
  }, true);

  async function collect(query) {
    const all = [];
    for (const p of providers) {
      try { all.push(...(await p(query))); } catch { /* a broken provider shouldn't break the palette */ }
    }
    return all;
  }

  function score(item, q) {
    if (!q) return 1;
    const label = item.label.toLowerCase();
    const hay = label + ' ' + (item.keywords || '').toLowerCase();
    if (label.startsWith(q)) return 4;
    if (label.includes(q)) return 3;
    if (hay.includes(q)) return 2;
    let i = 0;
    for (const ch of label) if (ch === q[i]) i++;
    return i === q.length ? 1 : 0;
  }

  // page commands get an icon from their words when the adapter doesn't name one
  const PAGE_ICONS = {
    home: 'house', explore: 'compass', notifications: 'bell', chat: 'message-circle', messages: 'message-circle',
    bookmarks: 'bookmark', likes: 'heart', 'liked videos': 'thumbs-up', profile: 'user', lists: 'list',
    settings: 'settings', 'write a post': 'pencil', search: 'search', 'load new posts': 'rotate-cw',
    'keyboard shortcuts': 'keyboard', subscriptions: 'list-video', history: 'history', 'watch later': 'clock',
    playlists: 'list', you: 'circle-user', friends: 'users', avatar: 'shirt', inventory: 'package',
    trade: 'repeat', communities: 'users', charts: 'chart-column', marketplace: 'shopping-bag'
  };
  function iconFor(it) {
    if (it.icon) return it.icon;
    const l = it.label.toLowerCase();
    if (PAGE_ICONS[l]) return PAGE_ICONS[l];
    if (l.startsWith('search')) return 'search';
    if (l.startsWith('open @')) return 'user';
    return 'arrow-right';
  }
  function iconNode(name) {
    const data = H.icons && H.icons[name];
    if (!data) return null;
    const svg = h('svg', { class: 'ico', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    for (const [tag, attrs] of data) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      svg.append(el);
    }
    return svg;
  }

  function labelNode(text, q) {
    const span = document.createElement('span');
    span.className = 'label';
    const i = q ? text.toLowerCase().indexOf(q) : -1;
    if (i < 0) { span.textContent = text; return span; }
    const mark = document.createElement('mark');
    mark.textContent = text.slice(i, i + q.length);
    span.append(text.slice(0, i), mark, text.slice(i + q.length));
    return span;
  }

  function keysNode(hint) {
    const k = H.keycaps(hint);
    k.className = 'keys';
    for (const c of k.children) c.removeAttribute('class');
    return k;
  }

  async function render(animate) {
    const seq = ++renderSeq;
    const raw = input.value.trim();
    const q = raw.toLowerCase();
    const all = await collect(raw);
    if (seq !== renderSeq) return;

    if (q) {
      items = all
        .map((it) => ({ it, s: it.always ? 0.5 : score(it, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.it);
    } else {
      items = all.filter((it) => !it.always);
    }
    if (index >= items.length) index = Math.max(0, items.length - 1);

    for (const el of [...list.children]) if (el !== hl) el.remove();
    if (!items.length) {
      const e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'nothing matches';
      list.append(e);
      hl.style.opacity = '0';
      return;
    }

    let group = null;
    items.forEach((it, i) => {
      if (!q && it.group !== group) {
        group = it.group;
        const g = document.createElement('div');
        g.className = 'group';
        g.textContent = group;
        list.append(g);
      }
      const row = document.createElement('div');
      row.className = 'item' + (animate ? ' enter' : '');
      if (animate) row.style.animationDelay = Math.min(i, 10) * 14 + 'ms';
      row.setAttribute('role', 'option');
      row.dataset.i = i;
      const right = document.createElement('span');
      right.className = 'right';
      if (it.hint) right.append(keysNode(it.hint));
      if (it.choices) {
        const seg = document.createElement('span');
        seg.className = 'seg';
        for (const c of it.choices) {
          const opt = document.createElement('span');
          opt.textContent = c;
          if (c === it.value) opt.className = 'cur';
          seg.append(opt);
        }
        right.append(seg);
      }
      if (typeof it.active === 'boolean') {
        const sw = document.createElement('span');
        sw.className = 'sw' + (it.active ? ' active' : '');
        right.append(sw);
      }
      const left = document.createElement('span');
      left.className = 'left';
      const ico = iconNode(iconFor(it));
      if (ico) left.append(ico);
      left.append(labelNode(it.label, q));
      row.append(left, right);
      row.addEventListener('mousemove', () => { if (index !== i) { index = i; paint(); } });
      row.addEventListener('click', () => run(i));
      list.append(row);
    });
    paint(true);
  }

  function paint(instant) {
    const rows = list.querySelectorAll('.item');
    rows.forEach((r, i) => r.classList.toggle('on', i === index));
    const on = rows[index];
    if (!on) return;
    if (instant) hl.style.transition = 'none';
    hl.style.opacity = '1';
    hl.style.height = on.offsetHeight + 'px';
    hl.style.transform = `translateY(${on.offsetTop}px)`;
    if (instant) { void hl.offsetWidth; hl.style.transition = ''; }
    const top = on.offsetTop, bottom = top + on.offsetHeight;
    if (top < list.scrollTop + 6) list.scrollTop = top - 30;
    else if (bottom > list.scrollTop + list.clientHeight - 6) list.scrollTop = bottom - list.clientHeight + 6;
  }

  function onKey(e) {
    const n = Math.max(items.length, 1);
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n') || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); index = (index + 1) % n; paint(); }
    else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p') || (e.key === 'Tab' && e.shiftKey)) { e.preventDefault(); index = (index - 1 + n) % n; paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(index); }
  }

  async function run(i) {
    const it = items[i];
    if (!it) return;
    // choices cycle in place: the palette stays open so you can see (and keep) cycling
    if (it.choices) {
      try { await it.run(); } catch (e) { console.warn('[hush] command failed', e); }
      await new Promise((r) => setTimeout(r, 60)); // let settings land
      index = i;
      render(false);
      return;
    }
    // toggles flip in place for a beat so the switch animation is visible
    if (typeof it.active === 'boolean') {
      const sw = list.querySelectorAll('.item')[i]?.querySelector('.sw');
      if (sw) { sw.classList.toggle('active'); await new Promise((r) => setTimeout(r, 170)); }
    }
    close();
    try {
      await it.run();
      if (typeof it.active === 'boolean' && it.toast !== false) toast(`${it.label} ${it.active ? 'off' : 'on'}`, !it.active);
    } catch (e) { console.warn('[hush] command failed', e); }
  }

  function show() {
    if (open) return;
    ensureHost();
    syncTheme();
    if (!scrim) buildPalette();
    lastFocus = document.activeElement;
    scrim.classList.remove('open', 'closing');
    rootEl.prepend(scrim);
    open = true;
    input.value = '';
    index = 0;
    render(true);
    requestAnimationFrame(() => requestAnimationFrame(() => scrim.classList.add('open')));
    input.focus({ preventScroll: true });
  }

  function close() {
    if (!open) return;
    open = false;
    scrim.classList.add('closing');
    scrim.classList.remove('open');
    const s = scrim;
    setTimeout(() => { if (!open) s.remove(); }, 160);
    if (lastFocus && lastFocus.focus && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
  }

  let toastTimer = null;
  function toast(text, active) {
    ensureHost();
    syncTheme();
    toastWrap.replaceChildren();
    const t = document.createElement('div');
    t.className = 'toast';
    const dot = document.createElement('span');
    dot.className = 'dot' + (active ? ' active' : '');
    t.append(dot, text);
    toastWrap.append(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 220);
    }, 1600);
  }

  H.toast = toast;
  H.palette = {
    open: show,
    close,
    toggle: () => (open ? close() : show()),
    isOpen: () => open,
    /** provider(query) -> [{ label, group, hint?, keywords?, active?, always?, toast?, run }] */
    addProvider(fn) { providers.push(fn); return () => { providers = providers.filter((p) => p !== fn); }; }
  };
})();
