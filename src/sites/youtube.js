// hush — YouTube adapter.
// The look is CSS (youtube.css) driven by YouTube's own design tokens. This JS
// layer handles page awareness, Shorts → normal player, the text-only guide,
// keyboard focus mode and tune-palette commands.
Hush.register({
  id: 'yt',
  name: 'YouTube',
  match: (host) => /(^|\.)youtube\.com$/.test(host) && !/^(music|studio|tv)\./.test(host),
  options: [
    { key: 'navstyle', label: 'menu', group: 'layout', desc: 'How the sidebar shows its links', choices: ['words', 'icons', 'both'], default: 'both', keywords: 'sidebar guide nav style' },
    { key: 'noshorts', label: 'hide shorts', group: 'feed', desc: 'Shorts gone; links open in the player', keywords: 'reels', default: true },
    { key: 'nochat', label: 'hide live chat', group: 'feed', desc: 'No live chat beside streams', keywords: 'stream', default: true },
    { key: 'norelated', label: 'hide recommendations', group: 'feed', desc: 'No up next sidebar', keywords: 'up next related sidebar', default: false },
    { key: 'nocomments', label: 'hide comments', group: 'feed', desc: 'No comment section at all', default: false },
    { key: 'capfeed', label: 'calm home feed', group: 'feed', desc: 'Three rows, then a quiet “show more”', keywords: 'endless infinite limit up next', default: true },
    { key: 'softthumbs', label: 'soft thumbnails', group: 'look', desc: 'Thumbnails softened until hover', keywords: 'images color saturation quiet', default: true },
    { key: 'calmtitles', label: 'calm titles', group: 'look', desc: 'No ALL CAPS, tags or emoji spam in titles', keywords: 'clickbait caps capitals emoji title', default: true },
    { key: 'foldcomments', label: 'fold comments', group: 'feed', desc: 'Comments behind a button', keywords: 'collapse', default: true },
    { key: 'zen', label: 'focus mode', group: 'layout', desc: 'Hide the menu, keep only the content', hint: 'z', keywords: 'cinema theater zen', default: false }
  ],

  // the video you opened may autoplay even with "still motion" on; previews may not
  // mute words: a video is its whole card; calm titles: grid, search, up next, the watch page
  mute: {
    items: 'ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, yt-lockup-view-model',
    target: (el) => el.closest('ytd-rich-item-renderer') || el,
  },
  titles: '#video-title, .yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle, ytd-watch-metadata h1 yt-formatted-string',
  allowMedia(el) {
    return !!el.closest('#movie_player, ytd-player#ytd-player') && !el.closest('ytd-video-preview, #video-preview, #inline-preview-player');
  },

  setup(ctx) {
    const { root } = ctx;

    const PAGES = [
      { label: 'home', path: '/', keywords: 'feed' },
      { label: 'subscriptions', path: '/feed/subscriptions', keywords: 'subs channels' },
      { label: 'history', path: '/feed/history', keywords: 'watched' },
      { label: 'watch later', path: '/playlist?list=WL', keywords: 'saved queue' },
      { label: 'liked videos', path: '/playlist?list=LL', keywords: 'likes' },
      { label: 'playlists', path: '/feed/playlists', keywords: 'library' },
      { label: 'you', path: '/feed/you', keywords: 'library account' }
    ];

    function go(path) {
      const link = document.querySelector(`a[href="${CSS.escape(path)}"]`);
      if (link) { link.click(); return; }
      location.href = path;
    }

    function search(q) {
      go(`/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`);
    }

    function focusSearch() {
      const input = document.querySelector('ytd-masthead input#search, ytd-masthead input[name="search_query"], yt-searchbox input');
      if (input) { input.focus(); input.select && input.select(); }
    }

    // ---- page flags ------------------------------------------------------------
    function pageKind() {
      const p = location.pathname;
      if (p === '/') return 'home';
      if (p.startsWith('/watch')) return 'watch';
      if (p.startsWith('/results')) return 'results';
      if (p.startsWith('/shorts')) return 'shorts';
      if (p.startsWith('/feed/subscriptions')) return 'subs';
      if (p.startsWith('/feed') || p.startsWith('/playlist')) return 'feed';
      if (p.startsWith('/@') || p.startsWith('/channel') || p.startsWith('/c/') || p.startsWith('/user')) return 'channel';
      return 'other';
    }

    function syncRoute() {
      const kind = pageKind();
      if (root.getAttribute('data-hush-path') !== kind) root.setAttribute('data-hush-path', kind);
      // Shorts → the normal, calmer player
      if (kind === 'shorts' && ctx.options.noshorts) {
        const id = location.pathname.split('/')[2];
        if (id && /^[\w-]{6,}$/.test(id)) location.replace(`/watch?v=${id}`);
      }
    }

    function detectTheme() {
      const theme = root.hasAttribute('dark') ? 'dark' : 'light';
      if (root.getAttribute('data-hush-theme') !== theme) root.setAttribute('data-hush-theme', theme);
    }

    // guide entries get their label as a data attribute so CSS can show words only
    function syncGuide() {
      for (const a of document.querySelectorAll('ytd-guide-entry-renderer a#endpoint:not([data-hush-label]), ytd-mini-guide-entry-renderer a#endpoint:not([data-hush-label])')) {
        const t = (a.getAttribute('title') || a.textContent || '').trim().toLowerCase();
        if (t) a.setAttribute('data-hush-label', t);
      }
    }

    // the "Shorts" filter chip has no link to key off, only its text
    function markChips() {
      for (const chip of document.querySelectorAll('yt-chip-cloud-chip-renderer:not([data-hush-chip])')) {
        const t = chip.textContent.trim().toLowerCase();
        if (t) chip.setAttribute('data-hush-chip', t);
      }
    }

    // ---- layout: greeting, feed cap, up-next cap, folded comments -----------------

    function quietButton(cls, text, onClick) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `hush-yt-btn hush-btn ${cls === 'hush-yt-more' ? 'hush-btn--outline hush-btn--center' : 'hush-btn--ghost'} ${cls}`;
      b.textContent = text;
      b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); schedule(); });
      return b;
    }

    function greet() {
      const grid = document.querySelector('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer');
      if (!grid) return;
      let el = grid.querySelector(':scope > .hush-greet');
      const hr = new Date().getHours();
      const text = `good ${hr < 5 ? 'night' : hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}`;
      if (!el) {
        el = document.createElement('div');
        el.className = 'hush-greet';
        grid.prepend(el);
      }
      if (el.textContent !== text) el.textContent = text;
    }

    // home: three rows at a time, and no endless loading underneath
    function capHome() {
      const grid = document.querySelector('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer');
      if (!grid) return;
      const contents = grid.querySelector(':scope > #contents');
      if (!contents) return;
      const items = [...contents.querySelectorAll(':scope > ytd-rich-item-renderer:not([data-hush-hide])')].filter((i) => !i.matches(':has(ytd-ad-slot-renderer)'));
      const perRow = parseInt(getComputedStyle(grid).getPropertyValue('--ytd-rich-grid-items-per-row'), 10) || 4;
      const step = perRow * 3;
      const capped = ctx.options.capfeed && items.length > step;
      const limit = Math.max(+(grid.dataset.hushLimit || 0), step);
      items.forEach((it, i) => {
        const over = capped && i >= limit;
        if (over !== it.hasAttribute('data-hush-cap')) it.toggleAttribute('data-hush-cap', over);
      });
      // enough loaded for the current limit → stop the infinite loader; otherwise let it fetch
      grid.toggleAttribute('data-hush-capped', !!ctx.options.capfeed && items.length >= limit);
      let btn = contents.nextElementSibling && contents.nextElementSibling.classList.contains('hush-yt-more') ? contents.nextElementSibling : null;
      // the button only makes sense once a full limit's worth is on screen
      const wantBtn = !!ctx.options.capfeed && items.length >= limit;
      if (wantBtn && !btn) {
        btn = quietButton('hush-yt-more', 'Show more', () => {
          grid.dataset.hushLimit = String(limit + step);
          setTimeout(schedule, 1200); // the loader wakes up if more are needed
        });
        contents.after(btn);
      } else if (!wantBtn && btn) {
        btn.remove();
      }
    }

    // watch: up next shows eight; the rest behind "more"
    function capUpNext() {
      // the inner list first (#items wraps it and would match first in document order)
      const box = document.querySelector('ytd-watch-flexy #related ytd-item-section-renderer #contents') || document.querySelector('ytd-watch-flexy #related #items');
      if (!box) return;
      const items = [...box.children].filter((c) => c.matches('yt-lockup-view-model, ytd-compact-video-renderer, ytd-compact-radio-renderer, ytd-compact-playlist-renderer'));
      const STEP = 8;
      const host = box.closest('#related');
      const limit = Math.max(+(host.dataset.hushLimit || 0), STEP);
      const on = ctx.options.capfeed;
      items.forEach((it, i) => {
        const over = on && i >= limit;
        if (over !== it.hasAttribute('data-hush-cap')) it.toggleAttribute('data-hush-cap', over);
      });
      host.toggleAttribute('data-hush-capped', on && items.length > limit);
      let btn = host.querySelector(':scope > .hush-yt-upnext');
      if (on && items.length > limit && !btn) {
        btn = quietButton('hush-yt-upnext', 'More', () => { host.dataset.hushLimit = String(limit + STEP); });
        host.append(btn);
      } else if ((!on || items.length <= limit) && btn) {
        btn.remove();
      }
    }

    // watch: comments fold behind their count until you ask
    function foldComments() {
      const comments = document.querySelector('ytd-watch-flexy ytd-comments#comments');
      if (!comments) return;
      if (!ctx.options.foldcomments) { comments.removeAttribute('data-hush-fold'); comments.querySelector('.hush-yt-comments')?.remove(); return; }
      const header = comments.querySelector('ytd-comments-header-renderer');
      if (!header) return;
      if (!comments.hasAttribute('data-hush-fold')) comments.setAttribute('data-hush-fold', 'closed');
      // a new video resets the fold
      const vid = new URLSearchParams(location.search).get('v');
      if (comments.dataset.hushVid !== vid) { comments.dataset.hushVid = vid || ''; comments.setAttribute('data-hush-fold', 'closed'); }
      const open = comments.getAttribute('data-hush-fold') === 'open';
      let btn = comments.querySelector('.hush-yt-comments');
      if (!btn) {
        btn = quietButton('hush-yt-comments', '', () => {
          comments.setAttribute('data-hush-fold', comments.getAttribute('data-hush-fold') === 'open' ? 'closed' : 'open');
        });
        header.after(btn);
      }
      const label = open ? 'Hide comments' : 'Show comments';
      if (btn.textContent !== label) btn.textContent = label;
    }

    // chips: one pill slides to the selected chip (shadcn tabs). transform-only.
    function syncChipPill() {
      for (const bar of document.querySelectorAll('ytd-feed-filter-chip-bar-renderer #chips, yt-chip-cloud-renderer #chips')) {
        const sel = bar.querySelector('yt-chip-cloud-chip-renderer[selected], yt-chip-cloud-chip-renderer:has([aria-selected="true"])');
        let pill = bar.querySelector(':scope > .hush-chip-pill');
        if (!sel) { if (pill) pill.style.opacity = '0'; continue; }
        if (!pill) {
          pill = document.createElement('span');
          pill.className = 'hush-chip-pill';
          bar.prepend(pill);
          bar.setAttribute('data-hush-chips', '');
        }
        const key = `${sel.offsetLeft}:${sel.offsetWidth}`;
        if (pill.dataset.pos === key) continue;
        const first = !pill.dataset.pos;
        pill.dataset.pos = key;
        if (first) pill.style.transition = 'none';
        pill.style.width = `${sel.offsetWidth}px`;
        pill.style.transform = `translateX(${sel.offsetLeft}px)`;
        pill.style.opacity = '1';
        if (first) { void pill.offsetWidth; pill.style.transition = ''; }
      }
    }

    // home: the first screenful settles in with a short stagger (index set once)
    function staggerHome() {
      const items = document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer:not([data-hush-i])');
      let i = 0;
      for (const it of items) it.setAttribute('data-hush-i', String(Math.min(i++, 12)));
    }

    // ---- shorts links → normal player --------------------------------------------
    function onClick(e) {
      if (!ctx.options.noshorts || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const a = e.target.closest && e.target.closest('a[href^="/shorts/"]');
      if (!a) return;
      const id = a.getAttribute('href').split('/')[2];
      if (!id) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href = `/watch?v=${id.split('?')[0]}`;
    }
    document.addEventListener('click', onClick, true);

    // ---- keyboard ------------------------------------------------------------------
    // YouTube's own keys stay (k / space play, j / l seek, f, m, t, c, / search, shift+n).
    // hush adds: z focus mode, ctrl/⌘ k tune (engine).
    function onKey(e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (ctx.isTyping(e) || (Hush.palette && Hush.palette.isOpen())) return;
      if (e.key === 'z') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const next = !ctx.options.zen;
        ctx.setOption('zen', next);
        ctx.toast(next ? 'focus mode on' : 'focus mode off', next);
      }
    }
    window.addEventListener('keydown', onKey, true);

    // ---- tune palette -------------------------------------------------------------------
    this.commands = (c, query) => {
      const q = (query || '').trim();
      const cmds = PAGES.map((p) => ({ group: 'go to', label: p.label, keywords: p.keywords, run: () => go(p.path) }));
      cmds.push(
        { group: 'do', label: 'search', hint: '/', keywords: 'find', run: focusSearch },
        { group: 'do', label: 'keyboard shortcuts', hint: '?', keywords: 'keys help', run: () => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }));
        } }
      );
      if (q) cmds.push({ group: 'do', label: `search youtube for “${q}”`, always: true, run: () => search(q) });
      return cmds;
    };

    this.countHidden = () => document.querySelectorAll(
      'ytd-ad-slot-renderer, ytd-search-pyv-renderer, ytd-rich-section-renderer, grid-shelf-view-model, ytd-reel-shelf-renderer'
    ).length;

    // ---- loop ------------------------------------------------------------------------------
    const STEPS = [syncRoute, detectTheme, syncGuide, markChips, greet, capHome, capUpNext, foldComments, staggerHome];
    let queued = false;
    function tick() {
      queued = false;
      for (const step of STEPS) {
        try { step(); } catch (e) { console.warn('[hush] yt:', step.name, e); }
      }
    }
    const throttled = Hush.throttle(tick, 150);
    function schedule() { throttled(); }
    const observer = new MutationObserver(schedule);
    const start = () => {
      observer.observe(document.body, { childList: true, subtree: true });
      schedule();
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    // YouTube is a SPA with its own navigation events
    window.addEventListener('yt-navigate-finish', schedule);
    window.addEventListener('popstate', schedule);
    // themes flip via an attribute on <html>
    const themeObs = new MutationObserver(detectTheme);
    themeObs.observe(root, { attributes: true, attributeFilter: ['dark'] });
    // YouTube sizes the player in JS; when hush changes the layout, ask it to re-measure
    const layoutObs = new MutationObserver(() => requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))));
    layoutObs.observe(root, { attributes: true, attributeFilter: ['data-hush-zen', 'data-hush-norelated', 'data-hush-nochat', 'data-hush-site'] });

    return () => {
      observer.disconnect();
      themeObs.disconnect();
      layoutObs.disconnect();
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('yt-navigate-finish', schedule);
      window.removeEventListener('popstate', schedule);
      for (const a of document.querySelectorAll('[data-hush-label]')) a.removeAttribute('data-hush-label');
      for (const a of document.querySelectorAll('[data-hush-chip]')) a.removeAttribute('data-hush-chip');
      document.querySelectorAll('.hush-greet, .hush-yt-btn, .hush-chip-pill').forEach((el) => el.remove());
      for (const a of ['data-hush-cap', 'data-hush-capped', 'data-hush-fold', 'data-hush-chips', 'data-hush-i']) document.querySelectorAll(`[${a}]`).forEach((el) => el.removeAttribute(a));
      for (const a of ['data-hush-path', 'data-hush-theme']) root.removeAttribute(a);
    };
  }
});
