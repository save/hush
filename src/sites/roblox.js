// hush — Roblox adapter.
// The look is CSS (roblox.css) driven by Roblox's foundation design tokens.
// This JS layer adds page awareness, a tagged left nav (for words / icons /
// both), keyboard chords, a cap on the endless home feed, and palette commands.
// first frame: the theme Roblox had last time, so a dark Roblox doesn't flash white while
// the next page loads (Roblox only marks its theme on <body> a second or two in)
try {
  if (/(^|\.)roblox\.com$/.test(location.hostname)) {
    const t = localStorage.getItem('hush-rbx-theme');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-hush-theme', t);
  }
} catch { /* storage off: Roblox's own theme decides as before */ }

Hush.register({
  id: 'rbx',
  name: 'Roblox',
  match: (host) => /(^|\.)roblox\.com$/.test(host) && !/^(create|devforum|en\.help|help|corp|blog|ro)\./.test(host),
  // mute words: a game is its tile; calm titles: tile names
  mute: {
    items: '[data-testid="wide-game-tile"], [data-testid="game-tile"], li.list-item.game-card, .game-card-container',
    target: (el) => el.closest('li') || el,
  },
  titles: '[data-testid="game-tile-game-title"], .game-card-name',
  options: [
    { key: 'navstyle', label: 'menu', group: 'layout', desc: 'How the sidebar shows its links', choices: ['words', 'icons', 'both'], default: 'both', keywords: 'sidebar nav style' },
    { key: 'capfeed', label: 'calm home feed', group: 'feed', desc: 'Three rows, then a quiet “show more”', keywords: 'endless infinite recommended limit', default: true },
    { key: 'softthumbs', label: 'soft thumbnails', group: 'look', desc: 'Thumbnails softened until hover', keywords: 'images color saturation quiet', default: true },
    { key: 'calmtitles', label: 'calm titles', group: 'look', desc: 'No [🔥UPDATE] tags, ALL CAPS or emoji in game names', keywords: 'caps emoji tags names clickbait', default: true },
    { key: 'norecs', label: 'hide recommendations', group: 'feed', desc: 'No “people also join”', keywords: 'people also join similar', default: false },
    { key: 'nochat', label: 'hide chat list', group: 'feed', desc: 'No chats list in the corner; a chat you open still shows', keywords: 'friends dock messages', default: false },
    { key: 'zen', label: 'focus mode', group: 'layout', desc: 'Just the page; the menu becomes a small island at the bottom', hint: 'z', keywords: 'zen hide menu nav', default: false }
  ],

  setup(ctx) {
    const { root } = ctx;
    const FEED_STEP = 18; // tiles shown per "show more" on the endless home grid

    // left-nav items we know, keyed by where they go
    const NAV = [
      { id: 'home', test: (h) => /\/home\/?$/.test(h), label: 'home', keys: 'g h', path: '/home' },
      { id: 'profile', test: (h) => /\/users\/(profile|\d+\/profile)/.test(h), label: 'profile', keys: 'g p', path: '/users/profile' },
      { id: 'messages', test: (h) => h.includes('/my/messages'), label: 'messages', keys: 'g m', path: '/my/messages/#!/inbox' },
      { id: 'friends', test: (h) => h.includes('/users/friends'), label: 'friends', keys: 'g f', path: '/users/friends' },
      { id: 'avatar', test: (h) => h.includes('/my/avatar'), label: 'avatar', keys: 'g a', path: '/my/avatar' },
      { id: 'inventory', test: (h) => h.includes('/users/inventory') || /\/inventory/.test(h), label: 'inventory', keys: 'g i', path: '/users/inventory' },
      { id: 'trade', test: (h) => h.includes('/trades'), label: 'trade', keys: 'g t', path: '/trades' },
      { id: 'communities', test: (h) => h.includes('/communities') || h.includes('/groups'), label: 'communities', keys: 'g c', path: '/communities' },
      // upsells and off-site links: tagged so CSS can drop them
      { id: 'plus', test: (h) => /\/plus\/?$/.test(h) || h.includes('/premium'), hide: true },
      { id: 'newsroom', test: (h) => h.includes('blog.roblox.com') || h.includes('/newsroom'), hide: true },
      { id: 'store', test: (h) => h.includes('amazon.') || h.includes('roblox.com/store') || h.includes('/officialstore'), hide: true },
      { id: 'giftcards', test: (h) => h.includes('giftcard'), hide: true }
    ];
    const PAGES = [
      ...NAV.filter((n) => n.path),
      { label: 'charts', keys: 'g r', path: '/charts', keywords: 'top games discover' },
      { label: 'marketplace', keys: 'g s', path: '/catalog', keywords: 'catalog shop items avatar store' },
      { label: 'settings', path: '/my/account', keywords: 'account privacy' }
    ];

    function go(path) {
      const link = [...document.querySelectorAll('a[href]')].find((a) => {
        const h = a.getAttribute('href');
        return h === path || h === location.origin + path;
      });
      if (link) link.click();
      else location.href = path;
    }

    function focusSearch() {
      const input = document.querySelector('[data-testid="navigation-search-input-field"], #navbar-search-input, input[type="search"]');
      if (input) { input.focus(); input.select && input.select(); }
    }

    // ---- page flags ----------------------------------------------------------------
    function pageKind() {
      const p = location.pathname.toLowerCase();
      if (p === '/' || p.startsWith('/home')) return 'home';
      if (p.startsWith('/games/')) return 'game';
      if (p.startsWith('/charts') || p.startsWith('/discover')) return 'charts';
      if (p.startsWith('/catalog') || p.startsWith('/bundles') || p.startsWith('/marketplace')) return 'catalog';
      if (p.startsWith('/my/messages')) return 'messages';
      if (p.startsWith('/my/avatar')) return 'avatar';
      if (p.includes('/friends')) return 'friends';
      if (p.includes('/profile')) return 'profile';
      if (p.startsWith('/communities') || p.startsWith('/groups')) return 'communities';
      if (p.startsWith('/my/account')) return 'settings';
      return 'other';
    }

    function syncRoute() {
      const kind = pageKind();
      if (root.getAttribute('data-hush-path') !== kind) root.setAttribute('data-hush-path', kind);
    }

    function detectTheme() {
      const cl = document.body && document.body.classList;
      if (!cl) return;
      const theme = cl.contains('dark-theme') ? 'dark' : cl.contains('light-theme') ? 'light' : '';
      if (!theme) return; // Roblox hasn't decided yet: keep the remembered one
      if (root.getAttribute('data-hush-theme') !== theme) root.setAttribute('data-hush-theme', theme);
      try { if (localStorage.getItem('hush-rbx-theme') !== theme) localStorage.setItem('hush-rbx-theme', theme); } catch { /* storage off */ }
    }

    // ---- left nav: tag items, key caps, active dot -------------------------------------
    function syncNav() {
      const nav = document.querySelector('#left-navigation-container');
      if (!nav) return;
      const here = location.pathname + location.hash;
      for (const a of nav.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href') || '';
        if (!a.hasAttribute('data-hush-nav')) {
          // the account row (has your avatar) and the upsell card are their own things
          const isUpsell = a.classList.contains('flex-col');
          const isMe = !isUpsell && !!a.querySelector('img, .thumbnail-2d-container, [class*="avatar"]');
          const hit = isUpsell || isMe ? null : NAV.find((n) => n.test(href));
          const kind = isUpsell ? 'upsell' : isMe ? 'me' : hit ? hit.id : 'other';
          a.setAttribute('data-hush-nav', kind);
          if (hit && hit.hide) a.setAttribute('data-hush-navhide', '');
          if (kind === 'upsell') a.setAttribute('data-hush-navhide', '');
          if (hit && hit.keys) {
            const caps = Hush.keycaps(hit.keys);
            caps.dataset.keys = hit.keys;
            a.append(caps);
          }
        }
        const id = a.getAttribute('data-hush-nav');
        const item = NAV.find((n) => n.id === id);
        const active = !!item && !!item.path && (here.startsWith(item.path) || (id === 'home' && location.pathname === '/'));
        if (active !== a.hasAttribute('data-hush-active')) a.toggleAttribute('data-hush-active', active);
      }
      // some upsells are buttons (Official Store opens a picker), matched by their words
      for (const b of nav.querySelectorAll('button:not([data-hush-navhide])')) {
        if (/^(official store|buy gift cards?|roblox plus|get premium|premium)$/i.test(b.textContent.trim())) b.setAttribute('data-hush-navhide', '');
      }
      // the list item around a hidden link goes too (keeps spacing even)
      for (const a of nav.querySelectorAll('[data-hush-navhide]')) {
        const li = a.closest('li');
        if (li && !li.hasAttribute('data-hush-hide')) li.setAttribute('data-hush-hide', '');
      }
    }

    // header links: tag the robux upsell so it can go
    function syncHeader() {
      for (const a of document.querySelectorAll('#navigation-container a[href*="/upgrades/robux"]:not([data-hush-hide]), #navigation-container a[href*="/plus"]:not([data-hush-hide])')) {
        if (a.closest('#navigation-robux-container')) continue; // the plain "Robux" link in the header stays
        a.setAttribute('data-hush-hide', '');
      }
      // "Buy Robux" buttons that don't link anywhere useful (href="#"), matched by their words
      for (const el of document.querySelectorAll('a:not([data-hush-seen]), button:not([data-hush-seen])')) {
        el.setAttribute('data-hush-seen', '');
        if (el.childElementCount < 3 && /^(buy robux|get robux|get premium|get roblox plus)$/i.test(el.textContent.trim())) el.setAttribute('data-hush-hide', '');
      }
      // catalog / elsewhere: "Buy Robux" buttons
      for (const el of document.querySelectorAll('a[href*="/upgrades/robux"]:not([data-hush-hide]), a[href*="/upgrades/paymentmethods"]:not([data-hush-hide])')) {
        if (el.closest('#navigation-container .popover, [role="menu"], #navigation-robux-container')) continue; // the balance popover keeps its own link
        el.setAttribute('data-hush-hide', '');
      }
    }

    // ---- home: drop upsell sorts, cap the endless grid -------------------------------------
    const NOISE_SORTS = ["games you're missing", 'games you’re missing', 'sponsored', 'standout games', 'roblox plus', 'premium', 'today’s picks', "today's picks", 'recommended creators'];
    function cleanSorts() {
      for (const h of document.querySelectorAll('[data-testid="section-header"]')) {
        const title = (h.querySelector('[data-testid="section-header-title-subtitle-container"]') || h).textContent.trim().toLowerCase();
        const box = h.closest('.game-sort-carousel-wrapper, [data-testid="home-page-game-grid"]') || h.parentElement;
        const noise = NOISE_SORTS.some((n) => title.startsWith(n));
        if (box && noise !== box.hasAttribute('data-hush-hide')) box.toggleAttribute('data-hush-hide', noise);
      }
      // individual sponsored tiles
      for (const t of document.querySelectorAll('[data-testid="game-tile"]:not([data-hush-checked]), [data-testid="wide-game-tile"]:not([data-hush-checked])')) {
        t.setAttribute('data-hush-checked', '');
        if (/\bsponsored\b/i.test(t.textContent) || t.querySelector('[class*="sponsor"], [class*="native-ad"]')) t.setAttribute('data-hush-hide', '');
      }
    }

    // three full rows at whatever column count the grid has right now
    function feedStep(grid, measure = false) {
      if (measure || !grid.dataset.hushCols) {
        const inner = grid.querySelector('[data-testid="game-grid"]') || grid;
        grid.dataset.hushCols = String((getComputedStyle(inner).gridTemplateColumns || '').split(' ').filter(Boolean).length);
      }
      const cols = +grid.dataset.hushCols;
      return cols > 1 ? cols * 3 : FEED_STEP;
    }

    // Three rows, then "show more". Roblox's endless feed loads the next batch whenever its
    // sentinel tile scrolls into view; with the rest of the feed hidden the page is short, so
    // it used to load batch after batch (hundreds of games behind three rows) and drag the
    // page down. The sentinel stays hidden (roblox.css) unless you've asked for more than
    // has loaded, so Roblox only fetches what you're about to see.
    function capFeed() {
      const capped = ctx.options.capfeed;
      for (const grid of document.querySelectorAll('[data-testid="home-page-game-grid"]')) {
        const tiles = [...grid.querySelectorAll('[data-testid="wide-game-tile"], [data-testid="game-tile"]')];
        let btn = grid.nextElementSibling && grid.nextElementSibling.classList.contains('hush-more') ? grid.nextElementSibling : null;
        if (!capped) {
          tiles.forEach((t) => t.removeAttribute('data-hush-cap'));
          grid.removeAttribute('data-hush-capped');
          grid.removeAttribute('data-hush-loadmore');
          if (btn) btn.remove();
          continue;
        }
        const step = feedStep(grid);
        const limit = Math.max(+(grid.dataset.hushLimit || 0), step);
        const canLoad = !!grid.querySelector('[data-testid="sentinel-tile"]');
        tiles.forEach((t, i) => {
          const over = i >= limit;
          if (over !== t.hasAttribute('data-hush-cap')) t.toggleAttribute('data-hush-cap', over);
        });
        if ((tiles.length > limit) !== grid.hasAttribute('data-hush-capped')) grid.toggleAttribute('data-hush-capped', tiles.length > limit);
        const fetch = tiles.length < limit && canLoad;
        if (fetch !== grid.hasAttribute('data-hush-loadmore')) grid.toggleAttribute('data-hush-loadmore', fetch);
        const more = tiles.length > limit || canLoad;
        if (more && !btn) {
          btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'hush-more hush-btn hush-btn--outline hush-btn--center';
          btn.append('show more');
          btn.addEventListener('click', () => {
            const s = feedStep(grid, true);
            grid.dataset.hushLimit = String(Math.max(+(grid.dataset.hushLimit || 0), s) + s);
            schedule();
          });
          grid.after(btn);
        } else if (!more && btn) {
          btn.remove();
        }
      }
    }

    // ---- motion helpers ------------------------------------------------------------------------

    // legacy tab bars (about / store / servers, messages, friends): a sliding underline
    function syncTabUnderline() {
      for (const ul of document.querySelectorAll('.rbx-tabs-horizontal ul.nav-tabs')) {
        const act = ul.querySelector(':scope > li.active');
        let bar = ul.querySelector(':scope > .hush-tab-ind');
        if (!act) { if (bar) bar.style.opacity = '0'; continue; }
        if (!bar) {
          bar = document.createElement('span');
          bar.className = 'hush-tab-ind';
          ul.append(bar);
          ul.setAttribute('data-hush-tabs', '');
        }
        const label = act.querySelector('span, .rbx-tab-heading') || act;
        const lr = ul.getBoundingClientRect();
        // measure the words, not the (full-width) tab box
        const range = document.createRange();
        range.selectNodeContents(label);
        const r = range.getBoundingClientRect();
        if (!r.width) continue;
        const key = `${Math.round(r.left - lr.left)}:${Math.round(r.width)}`;
        if (bar.dataset.pos === key) continue;
        const first = !bar.dataset.pos;
        bar.dataset.pos = key;
        if (first) bar.style.transition = 'none';
        bar.style.width = `${Math.round(r.width)}px`;
        bar.style.transform = `translateX(${Math.round(r.left - lr.left)}px)`;
        bar.style.opacity = '1';
        if (first) { void bar.offsetWidth; bar.style.transition = ''; }
      }
    }

    // tiles settle in with a short stagger (index within their row/grid, set once)
    function staggerTiles() {
      for (const list of document.querySelectorAll('[data-testid="game-grid"], [data-testid="game-carousel"], ul.item-cards-stackable')) {
        const n = String(list.childElementCount);
        if (list.dataset.hushN === n) continue;
        list.dataset.hushN = n;
        let i = 0;
        for (const t of list.querySelectorAll(':scope > li, :scope > div, :scope [data-testid="game-tile"], :scope [data-testid="wide-game-tile"]')) {
          if (!t.hasAttribute('data-hush-i')) t.setAttribute('data-hush-i', String(Math.min(i, 10)));
          i++;
        }
      }
    }

    // ---- layout helpers ------------------------------------------------------------------------

    // home: a quiet greeting instead of a shouted "Home"
    function greet() {
      if (pageKind() !== 'home') return;
      const h1 = document.querySelector('#HomeContainer h1, .game-home-page-container h1');
      if (!h1) return;
      const hr = new Date().getHours();
      const part = hr < 5 ? 'night' : hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening';
      const text = `good ${part}`;
      if (h1.getAttribute('data-hush-greet') !== text) h1.setAttribute('data-hush-greet', text);
    }

    // consecutive sections with the same title read as one ("recommended for you" ×3)
    function dedupeHeaders() {
      let last = '';
      for (const h of document.querySelectorAll('[data-testid="section-header"]')) {
        const box = h.closest('.game-sort-carousel-wrapper, [data-testid="home-page-game-grid"]');
        if (box && box.hasAttribute('data-hush-hide')) continue;
        const title = h.textContent.trim().toLowerCase();
        const dupe = title && title === last;
        if (dupe !== h.hasAttribute('data-hush-dupe')) h.toggleAttribute('data-hush-dupe', dupe);
        last = title;
      }
    }

    // a small text toggle placed after `target`
    function toggleAfter(target, cls, labels, isOpen, onToggle) {
      let btn = target.nextElementSibling && target.nextElementSibling.classList.contains(cls) ? target.nextElementSibling : null;
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `hush-toggle hush-btn hush-btn--ghost ${cls}`;
        btn.addEventListener('click', () => { onToggle(); schedule(); });
        target.after(btn);
      }
      const label = isOpen ? labels[1] : labels[0];
      if (btn.textContent !== label) btn.textContent = label;
      return btn;
    }

    // game page: long descriptions fold to a few lines
    function foldDescription() {
      const pre = document.querySelector('.game-description-container pre.game-description');
      if (!pre) return;
      const long = pre.scrollHeight > 170;
      if (!long) { pre.removeAttribute('data-hush-fold'); return; }
      if (!pre.hasAttribute('data-hush-fold')) pre.setAttribute('data-hush-fold', 'closed');
      const open = pre.getAttribute('data-hush-fold') === 'open';
      toggleAfter(pre, 'hush-desc-toggle', ['more', 'less'], open, () => {
        pre.setAttribute('data-hush-fold', pre.getAttribute('data-hush-fold') === 'open' ? 'closed' : 'open');
      });
    }

    // game page: badges show three, the rest behind "all badges"
    function foldBadges() {
      const list = document.querySelector('.game-badges-list ul.stack-list');
      if (!list) return;
      const rows = list.querySelectorAll(':scope > li');
      if (rows.length <= 3) return;
      if (!list.hasAttribute('data-hush-fold')) list.setAttribute('data-hush-fold', 'closed');
      const open = list.getAttribute('data-hush-fold') === 'open';
      toggleAfter(list, 'hush-badge-toggle', [`all badges · ${rows.length}`, 'fewer badges'], open, () => {
        list.setAttribute('data-hush-fold', list.getAttribute('data-hush-fold') === 'open' ? 'closed' : 'open');
      });
    }

    // ---- keyboard -----------------------------------------------------------------------------
    const keyMap = { '/': focusSearch };
    for (const p of PAGES) if (p.keys) keyMap[p.keys] = () => go(p.path);
    keyMap.z = () => {
      const next = !ctx.options.zen;
      ctx.setOption('zen', next);
      ctx.toast(next ? 'focus mode on' : 'focus mode off', next);
    };
    const unbindKeys = ctx.keys(keyMap);

    // ---- tune palette ------------------------------------------------------------------------
    this.commands = (c, query) => {
      const q = (query || '').trim();
      const cmds = PAGES.map((p) => ({ group: 'go to', label: p.label, hint: p.keys, keywords: p.keywords, run: () => go(p.path) }));
      cmds.push({ group: 'do', label: 'search', hint: '/', keywords: 'find', run: focusSearch });
      if (q) {
        cmds.push(
          { group: 'do', label: `search games for “${q}”`, always: true, run: () => go(`/discover/?keyword=${encodeURIComponent(q)}`) },
          { group: 'do', label: `search marketplace for “${q}”`, always: true, run: () => go(`/catalog?CatalogContext=1&keyword=${encodeURIComponent(q)}`) },
          { group: 'do', label: `search people for “${q}”`, always: true, run: () => go(`/search/users?keyword=${encodeURIComponent(q)}`) }
        );
      }
      return cmds;
    };

    this.countHidden = () => document.querySelectorAll('[data-hush-cap]').length;

    // ---- loop -----------------------------------------------------------------------------------
    // ---- focus mode: the menu becomes a "dynamic island" at the bottom (src/core/island.js) ----
    const navCount = (id) => () => {
      const n = document.querySelector(`#left-navigation-container a[data-hush-nav="${id}"] :is(.foundation-web-status-indicator, .foundation-web-badge)`);
      return n ? (n.textContent || '').trim() : '';
    };
    const island = Hush.island({
      items: [
        { id: 'home', label: 'home', icon: 'house', path: () => '/home', active: () => pageKind() === 'home' },
        { id: 'charts', label: 'charts', icon: 'chart-column', path: () => '/charts' },
        { id: 'marketplace', label: 'marketplace', icon: 'shopping-bag', path: () => '/catalog' },
        { id: 'avatar', label: 'avatar', icon: 'shirt', path: () => '/my/avatar' },
        { id: 'friends', label: 'friends', icon: 'users', path: () => '/users/friends', count: navCount('friends') },
        { id: 'communities', label: 'communities', icon: 'users-round', path: () => '/communities', active: () => pageKind() === 'communities' },
        { id: 'messages', label: 'messages', icon: 'message-circle', path: () => '/my/messages/#!/inbox', active: () => location.pathname.startsWith('/my/messages'), count: navCount('messages') },
        { id: 'profile', label: 'profile', icon: 'user', path: () => '/users/profile', active: () => pageKind() === 'profile' }
      ],
      // no search button: both sites keep their own search bar in focus mode
      go,
      onLeave: () => { ctx.setOption('zen', false); ctx.toast('focus mode off', false); }
    });
    function syncIsland() { island.sync(!!ctx.options.zen); }

    // ---- profile: badges show as small round icons, so their names go in a tooltip --------
    function titleBadges() {
      if (root.getAttribute('data-hush-path') !== 'profile') return;
      for (const tile of document.querySelectorAll('.profile-content > .profile-carousel .base-tile')) {
        const link = tile.querySelector('a');
        const name = (tile.querySelector('.base-tile-title') || {}).textContent;
        if (link && name && link.title !== name.trim()) link.title = name.trim();
      }
    }

    // ---- chat: mark the row the message box sits in, so CSS can lay it out --------
    function syncChat() {
      for (const input of document.querySelectorAll('#chat-container .react-chat-message-input')) {
        const bar = input.parentElement;
        if (bar && !bar.hasAttribute('data-hush-chatbar')) bar.setAttribute('data-hush-chatbar', '');
      }
    }

    // Signed-in Roblox changes all the time (presence, chat, live player counts), so the
    // loop stays cheap: plain DOM work every pass; anything that reads layout (and makes
    // Chrome lay the page out again) only on a new page, a resize, or once a second.
    const STEPS = [syncRoute, detectTheme, syncNav, syncHeader, cleanSorts, capFeed, greet, dedupeHeaders, foldBadges, staggerTiles, syncChat, titleBadges, syncIsland];
    const MEASURE = [syncTabUnderline, foldDescription, () => { for (const g of document.querySelectorAll('[data-testid="home-page-game-grid"]')) feedStep(g, true); }];
    let measuredAt = 0, measuredKey = '';
    function tick() {
      const key = location.href + '|' + innerWidth;
      const now = performance.now();
      const steps = key !== measuredKey || now - measuredAt > 1000 ? (measuredKey = key, measuredAt = now, [...MEASURE, ...STEPS]) : STEPS;
      for (const step of steps) {
        try { step(); } catch (e) { console.warn('[hush] rbx:', step.name, e); }
      }
    }
    const throttled = Hush.throttle(tick, 250);
    function schedule() { throttled(); }
    const observer = new MutationObserver(schedule);
    const start = () => {
      observer.observe(document.body, { childList: true, subtree: true });
      schedule();
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    window.addEventListener('popstate', schedule);
    window.addEventListener('hashchange', schedule);
    window.addEventListener('resize', () => { measuredKey = ''; schedule(); }, { passive: true });
    // option changes (capfeed) re-run the loop
    const optObs = new MutationObserver(schedule);
    optObs.observe(root, { attributes: true, attributeFilter: ['data-hush-capfeed', 'data-hush-zen'] });

    return () => {
      observer.disconnect();
      optObs.disconnect();
      island.destroy();
      unbindKeys();
      window.removeEventListener('popstate', schedule);
      window.removeEventListener('hashchange', schedule);
      document.querySelectorAll('.hush-more, .hush-toggle, .hush-tab-ind, #left-navigation-container .hush-keys').forEach((el) => el.remove());
      document.querySelectorAll('[data-hush-chatbar]').forEach((el) => el.removeAttribute('data-hush-chatbar'));
      for (const a of ['data-hush-hide', 'data-hush-cap', 'data-hush-capped', 'data-hush-loadmore', 'data-hush-nav', 'data-hush-navhide', 'data-hush-active', 'data-hush-checked', 'data-hush-seen', 'data-hush-greet', 'data-hush-dupe', 'data-hush-fold', 'data-hush-tabs', 'data-hush-i']) {
        document.querySelectorAll(`[${a}]`).forEach((el) => el.removeAttribute(a));
      }
      for (const a of ['data-hush-path', 'data-hush-theme']) root.removeAttribute(a);
    };
  }
});
