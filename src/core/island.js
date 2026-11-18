// hush — the "dynamic island": focus mode's menu, a small floating pill at the bottom of
// the screen. Used by X, YouTube and Roblox; each adapter describes its pages, this draws
// and runs the island. Styles live in generic.css (.hush-island).
//
//   const island = Hush.island({
//     items: [{ id, label, icon, path: () => '/home', active?: () => bool, count?: () => '3' }],
//     extra: [{ id, label, icon, run }],   // after the divider (e.g. post, search)
//     go: (path) => …,                     // the site's own navigation
//     onLeave: () => …                     // turns focus mode off
//   });
//   island.sync(wanted)  // call from the adapter's loop; false removes it
//   island.destroy()
(() => {
  const H = globalThis.Hush;
  if (!H || H.island) return;

  const NS = 'http://www.w3.org/2000/svg';
  function lucide(name) {
    const svg = document.createElementNS(NS, 'svg');
    for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(k, v);
    for (const [tag, attrs] of (H.icons && H.icons[name]) || []) {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      svg.append(el);
    }
    return svg;
  }

  function button(id, label, icon, run) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hush-island-item';
    b.dataset.id = id;
    b.setAttribute('aria-label', label);
    const l = document.createElement('span');
    l.className = 'hush-island-label';
    l.textContent = label;
    const dot = document.createElement('span');
    dot.className = 'hush-island-dot';
    b.append(lucide(icon), l, dot);
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); run(); });
    return b;
  }

  const isHere = (path) => {
    if (!path) return false;
    const url = new URL(path, location.origin);
    const p = location.pathname;
    if (url.pathname === '/') return p === '/';
    return p === url.pathname || p.startsWith(url.pathname.replace(/\/$/, '') + '/');
  };

  H.island = function island({ items, extra = [], go, onLeave }) {
    let el = null;
    let lastY = 0;
    let frame = 0;

    // scrolling down tucks it away to just where you are; scrolling up brings it back
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = scrollY;
        const dy = y - lastY;
        if (Math.abs(dy) < 6) return;
        lastY = y;
        if (!el || el.matches(':hover, :focus-within')) return;
        if (dy > 0 && y > 160) el.setAttribute('data-compact', '');
        else if (dy < 0) el.removeAttribute('data-compact');
      });
    };

    function build() {
      const nav = document.createElement('nav');
      nav.className = 'hush-island';
      nav.setAttribute('aria-label', 'menu');
      for (const it of items) nav.append(button(it.id, it.label, it.icon, () => go(it.path())));
      const sep = document.createElement('span');
      sep.className = 'hush-island-sep';
      nav.append(sep);
      for (const x of extra) nav.append(button(x.id, x.label, x.icon, x.run));
      nav.append(button('leave', 'leave focus', 'focus', onLeave));
      nav.addEventListener('pointerenter', () => nav.removeAttribute('data-compact'));
      return nav;
    }

    function remove() {
      if (!el) return;
      el.remove();
      el = null;
      removeEventListener('scroll', onScroll);
    }

    function sync(want) {
      // never over a fullscreen video
      if (!want || document.fullscreenElement) { remove(); return; }
      if (!el || !el.isConnected) {
        el = build();
        document.body.append(el);
        lastY = scrollY;
        addEventListener('scroll', onScroll, { passive: true });
      }
      for (const it of items) {
        const b = el.querySelector(`.hush-island-item[data-id="${it.id}"]`);
        if (!b) continue;
        const active = it.active ? !!it.active() : isHere(it.path());
        if (active !== b.hasAttribute('data-active')) b.toggleAttribute('data-active', active);
        const n = it.count ? String(it.count() || '') : '';
        if (b.dataset.count !== n) b.dataset.count = n;
      }
    }

    return { sync, destroy: remove };
  };
})();
