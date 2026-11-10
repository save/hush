// hush — "hush this": pick any element on the page and hide it for good.
// Opened from the right-click menu (pre-selecting what you right-clicked) or
// from the palette. ↑/↓ or the wheel grows/shrinks the selection, click or
// Enter hides it, Esc cancels. The overlay lives in a closed shadow root and
// never takes pointer events, so the page underneath stays measurable.
(() => {
  const H = globalThis.Hush;
  if (!H || H.picker || window.top !== window) return;

  const css = `
    :host { all: initial; }
    .box {
      position: fixed; left: 0; top: 0; pointer-events: none; z-index: 2147483646;
      border: 1.5px solid #ff4b4b; border-radius: 6px; background: rgba(255, 75, 75, .08);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, .28);
      transition: transform .18s cubic-bezier(.32,.72,0,1), width .18s cubic-bezier(.32,.72,0,1), height .18s cubic-bezier(.32,.72,0,1), opacity .2s;
    }
    .tag {
      position: fixed; left: 0; top: 0; pointer-events: none; z-index: 2147483647;
      font: 500 11.5px/1 Inter, Geist, system-ui, sans-serif; color: #fafafa; background: #18181b;
      border: 1px solid rgba(255,255,255,.1); border-radius: 6px; padding: 5px 7px; white-space: nowrap;
      transition: transform .18s cubic-bezier(.32,.72,0,1);
    }
    .tag b { font-weight: 600; color: #ff8080; }
    .bar {
      position: fixed; left: 50%; bottom: 22px; translate: -50% 0; z-index: 2147483647;
      display: flex; align-items: center; gap: 14px; padding: 9px 12px;
      font: 400 12.5px/1 Inter, Geist, system-ui, sans-serif; color: #a1a1aa;
      background: rgba(12, 12, 14, .92); border: 1px solid rgba(255,255,255,.1); border-radius: 10px;
      box-shadow: 0 16px 50px rgba(0,0,0,.45); backdrop-filter: blur(10px);
      animation: in .28s cubic-bezier(.32,.72,0,1) both;
    }
    .bar strong { color: #fafafa; font-weight: 500; }
    .bar span { display: inline-flex; align-items: center; gap: 5px; }
    kbd {
      font: 500 10.5px/1 "Geist Mono", ui-monospace, monospace; color: #d4d4d8;
      padding: 3px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05);
    }
    button {
      all: unset; cursor: pointer; pointer-events: auto; color: #fafafa; font-weight: 500;
      padding: 5px 9px; border-radius: 6px; background: rgba(255,255,255,.08);
    }
    button:hover { background: rgba(255,255,255,.14); }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #ff4b4b; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } }
    @media (prefers-reduced-motion: reduce) { .box, .tag { transition: none; } }
  `;

  let host = null, shadow = null, box = null, tag = null, bar = null;
  let stack = [];       // current element and the ancestors we've climbed through
  let active = false;
  let done = null;
  let undoTimer = 0;

  const OK_MIN_AREA = 600;
  const isRoot = (el) => !el || el === document.documentElement || el === document.body;

  function meaningful(el) {
    // right-clicks land on tiny spans and icons; climb to something you'd call "a thing"
    let e = el;
    while (e && !isRoot(e)) {
      const r = e.getBoundingClientRect();
      if (r.width * r.height >= OK_MIN_AREA && getComputedStyle(e).display !== 'inline') return e;
      e = e.parentElement;
    }
    return el;
  }

  function describe(el) {
    const t = el.localName;
    const id = el.id && el.id.length < 24 ? `#${el.id}` : '';
    const tid = el.getAttribute('data-testid');
    const name = tid ? `[${tid}]` : id || (el.classList[0] && el.classList[0].length < 24 ? `.${el.classList[0]}` : '');
    const r = el.getBoundingClientRect();
    return { name: t + name, size: `${Math.round(r.width)}×${Math.round(r.height)}` };
  }

  function label(el) {
    const a = el.getAttribute('aria-label');
    if (a) return a.slice(0, 48);
    const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (txt) return txt.slice(0, 48) + (txt.length > 48 ? '…' : '');
    return describe(el).name;
  }

  // A selector that survives reloads: anchor on ids / test ids / labels / stable
  // classes, add :nth-of-type only where siblings are ambiguous, stop once unique.
  const UNSTABLE = /\d{3,}|^css-|^r-[a-z0-9]{4,}|^_|^sc-|^jsx-|^svelte-|^ng-|^[a-z]{1,2}\d|^style-scope|[A-Z].*[A-Z].*\d/;
  function piece(e) {
    let p = e.localName;
    const tid = e.getAttribute('data-testid');
    if (tid) return `${p}[data-testid="${CSS.escape(tid)}"]`;
    const al = e.getAttribute('aria-label');
    if (al && al.length < 48) return `${p}[aria-label="${al.replace(/["\\]/g, '\\$&')}"]`;
    const cls = [...e.classList].filter((c) => c.length < 40 && !UNSTABLE.test(c) && !c.startsWith('hush')).slice(0, 2);
    if (cls.length) p += '.' + cls.map((c) => CSS.escape(c)).join('.');
    return p;
  }
  function selectorFor(el) {
    // feeds reorder, so a thing with a link is best found by that link, wherever it lands
    const link = el.matches('a[href]') ? el : el.querySelector('a[href]');
    const href = link && link.getAttribute('href');
    if (href && href.length < 200 && !href.startsWith('javascript:') && href !== '#') {
      const a = `a[href="${href.replace(/["\\]/g, '\\$&')}"]`;
      const sel = link === el ? a : `${piece(el)}:has(${a})`;
      try { if (document.querySelectorAll(sel).length === 1) return sel; } catch { /* fall through */ }
    }
    const parts = [];
    let e = el;
    while (e && !isRoot(e) && parts.length < 8) {
      if (e.id && /^[A-Za-z][\w-]{1,40}$/.test(e.id) && !/\d{4,}/.test(e.id) && document.querySelectorAll('#' + CSS.escape(e.id)).length === 1) {
        parts.unshift('#' + CSS.escape(e.id));
        break;
      }
      let p = piece(e);
      const par = e.parentElement;
      if (par) {
        const same = [...par.children].filter((c) => c.matches(p));
        if (same.length > 1) {
          const n = [...par.children].filter((c) => c.localName === e.localName).indexOf(e) + 1;
          p += `:nth-of-type(${n})`;
        }
      }
      parts.unshift(p);
      const sel = parts.join(' > ');
      try { if (document.querySelectorAll(sel).length === 1) return sel; } catch { /* keep climbing */ }
      e = par;
    }
    return parts.join(' > ');
  }

  function mount() {
    if (host) return;
    host = document.createElement('hush-picker');
    shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = css;
    box = document.createElement('div'); box.className = 'box';
    tag = document.createElement('div'); tag.className = 'tag';
    bar = document.createElement('div'); bar.className = 'bar';
    shadow.append(style, box, tag, bar);
    document.documentElement.append(host);
  }
  function unmount() {
    if (host) host.remove();
    host = shadow = box = tag = bar = null;
  }

  function draw() {
    const el = stack[stack.length - 1];
    if (!el || !box) return;
    const r = el.getBoundingClientRect();
    box.style.transform = `translate(${r.left - 3}px, ${r.top - 3}px)`;
    box.style.width = `${r.width + 6}px`;
    box.style.height = `${r.height + 6}px`;
    const d = describe(el);
    tag.textContent = '';
    const b = document.createElement('b'); b.textContent = d.name;
    tag.append(b, document.createTextNode(`  ${d.size}`));
    const ty = r.top > 34 ? r.top - 30 : r.bottom + 8;
    tag.style.transform = `translate(${Math.max(8, r.left - 3)}px, ${ty}px)`;
  }

  function setBar(nodes) {
    bar.textContent = '';
    bar.append(...nodes);
  }
  function hint(keys, text) {
    const s = document.createElement('span');
    for (const k of keys) { const kb = document.createElement('kbd'); kb.textContent = k; s.append(kb); }
    s.append(document.createTextNode(text));
    return s;
  }

  function select(el) {
    if (!el || isRoot(el) || host && host.contains(el)) return;
    stack = [el];
    draw();
  }
  function grow() {
    const top = stack[stack.length - 1];
    const p = top && top.parentElement;
    if (p && !isRoot(p)) { stack.push(p); draw(); }
  }
  function shrink() {
    if (stack.length > 1) { stack.pop(); draw(); }
  }

  const onMove = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== stack[0] && !(host && el === host)) select(meaningful(el));
  };
  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) grow(); else shrink();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); stop(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); grow(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); shrink(); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); confirm(); }
  };
  const onClick = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    confirm();
  };
  const swallow = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };
  const onScroll = () => requestAnimationFrame(draw);

  function listen(on) {
    const m = on ? 'addEventListener' : 'removeEventListener';
    window[m]('pointermove', onMove, true);
    window[m]('wheel', onWheel, { capture: true, passive: false });
    window[m]('keydown', onKey, true);
    window[m]('click', onClick, true);
    window[m]('mousedown', swallow, true);
    window[m]('mouseup', swallow, true);
    window[m]('contextmenu', swallow, true);
    window[m]('scroll', onScroll, true);
    window[m]('resize', onScroll, true);
  }

  function start(target, onDone) {
    if (active) stop();
    clearTimeout(undoTimer);
    active = true;
    done = onDone;
    mount();
    setBar([
      Object.assign(document.createElement('strong'), { textContent: 'hush this' }),
      hint(['↑', '↓'], ' bigger / smaller'),
      hint(['click'], ' hide'),
      hint(['esc'], ' cancel'),
    ]);
    box.style.opacity = '1';
    select(target ? meaningful(target) : null);
    listen(true);
  }

  function stop() {
    if (!active) return;
    active = false;
    listen(false);
    unmount();
  }

  function confirm() {
    const el = stack[stack.length - 1];
    if (!el) return;
    const rule = { s: selectorFor(el), l: label(el), t: Date.now() };
    const cb = done;
    active = false;
    listen(false);
    // fade the thing out where it stands, then let the saved rule take over
    box.style.opacity = '0';
    tag.remove();
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
    if (cb) cb(rule);
    const undo = document.createElement('button');
    undo.textContent = 'undo';
    undo.addEventListener('click', (e) => {
      e.stopPropagation();
      el.getAnimations().forEach((a) => a.cancel());
      if (cb && cb.undo) cb.undo(rule);
      clearTimeout(undoTimer);
      unmount();
    });
    const dot = document.createElement('span'); dot.className = 'dot';
    setBar([dot, Object.assign(document.createElement('strong'), { textContent: 'hidden on this site' }), undo]);
    undoTimer = setTimeout(unmount, 5000);
  }

  H.picker = { start, stop, isOpen: () => active, selectorFor };
})();
