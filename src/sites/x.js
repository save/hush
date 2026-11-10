// hush — X (x.com / twitter.com) adapter.
// Most of the look is CSS (x.css). This JS layer handles what CSS can't:
// page awareness, nav badges, ads / promo / suggestion removal, separator
// colors, keyboard shortcuts and tune-palette commands.
Hush.register({
  id: 'x',
  name: 'X',
  match: (host) => /(^|\.)(x|twitter)\.com$/.test(host),
  options: [
    { key: 'navstyle', label: 'menu', group: 'layout', desc: 'How the sidebar shows its links', choices: ['words', 'icons', 'both'], default: 'both', keywords: 'sidebar nav style' },
    { key: 'nocompose', label: 'hide composer on home', group: 'feed', desc: 'No post box at the top of home', default: true },
    { key: 'nocounts', label: 'hide like & repost numbers', group: 'look', desc: 'Hide like and repost counts', keywords: 'metrics', default: false },
    { key: 'banners', label: 'quiet profile banners', group: 'look', desc: 'Short, faded profile headers', keywords: 'header photo', default: true },
    { key: 'softmedia', label: 'soft media', group: 'look', desc: 'Images sit back until you point at them', keywords: 'images video color saturation thumbnails', default: true },
    { key: 'checkin', label: 'scroll check-ins', group: 'feed', desc: 'A quiet nudge every 50 posts', keywords: 'endless feed nudge break', default: true },
    { key: 'zen', label: 'focus mode', group: 'layout', desc: 'Hide the menu, keep only the content', hint: 'z', keywords: 'zen hide menu nav', default: false }
  ],

  setup(ctx) {
    const { root } = ctx;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

    // ---- what to throw away ---------------------------------------------
    // Timeline modules that are pure noise. Hidden from the heading down to
    // the next post / separator / unrelated heading.
    const NOISE_HEADINGS = [
      'who to follow', 'relevant people', 'you might like', 'subscribe to premium',
      'trending now', "today's news", 'today’s news', 'discover more', 'creators for you',
      'what’s happening', "what's happening", 'live on x', 'get verified', 'premium'
    ];
    // Endless recommendation feeds: hide the heading and everything after it.
    const STICKY_HEADINGS = ['discover more'];
    const AD_LABELS = new Set(['ad', 'promoted']);
    // links that only exist to sell you something
    const PROMO_LINKS = [
      'a[href*="premium_sign_up"]', 'a[href^="/i/premium"]', 'a[href^="/i/verified"]',
      'a[href^="/i/jf/creators"]', 'a[href^="/i/monetization"]', 'a[href^="/i/grok"]'
    ].join(',');

    // ---- pages -------------------------------------------------------------
    const PAGES = [
      { label: 'home', path: '/home', keys: 'g h' },
      { label: 'explore', path: '/explore', keys: 'g e', keywords: 'search trends' },
      { label: 'notifications', path: '/notifications', keys: 'g n', keywords: 'alerts mentions' },
      { label: 'chat', path: '/i/chat', keys: 'g m', keywords: 'messages dm inbox' },
      { label: 'bookmarks', path: '/i/history', keys: 'g b', keywords: 'saved keep history' },
      { label: 'likes', path: '/i/history/likes', keys: '', keywords: 'liked' },
      { label: 'profile', path: null, keys: 'g p', keywords: 'me' },
      { label: 'lists', path: '/i/lists', keys: 'g i', keywords: '' },
      { label: 'settings', path: '/settings', keys: 'g s', keywords: 'preferences account' }
    ];

    function profilePath() {
      const a = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
      return a ? a.getAttribute('href') : null;
    }

    function go(path) {
      if (!path) return;
      const link = document.querySelector(`a[href="${CSS.escape(path)}"]`);
      if (link) { link.click(); return; }
      history.pushState({}, '', path);
      dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }

    function waitFor(selector, timeout = 3000) {
      return new Promise((resolve) => {
        const t0 = Date.now();
        (function poll() {
          const el = document.querySelector(selector);
          if (el || Date.now() - t0 > timeout) return resolve(el);
          setTimeout(poll, 60);
        })();
      });
    }

    async function focusSearch(query) {
      if (query) {
        go(`/search?q=${encodeURIComponent(query)}&src=typed_query`);
        return;
      }
      const SEL = '[data-testid="primaryColumn"] input[data-testid="SearchBox_Search_Input"]';
      if (!document.querySelector(SEL)) go('/explore');
      const input = await waitFor(SEL);
      if (input) { input.focus(); input.select && input.select(); }
    }

    function write() {
      const btn = document.querySelector('a[data-testid="SideNav_NewTweet_Button"]');
      if (btn) btn.click(); else go('/compose/post');
    }

    // ---- page flags --------------------------------------------------------
    function pageKind(p) {
      if (p === '/home') return 'home';
      if (p.startsWith('/i/chat') || p.startsWith('/messages')) return 'chat';
      if (p.startsWith('/settings')) return 'settings';
      if (p.startsWith('/notifications')) return 'notifications';
      if (p.startsWith('/explore') || p.startsWith('/search')) return 'explore';
      if (p.startsWith('/i/history') || p.startsWith('/i/bookmarks')) return 'history';
      if (p.includes('/status/')) return 'status';
      if (p.startsWith('/i/')) return 'i';
      return 'profile';
    }

    function syncRoute() {
      const kind = pageKind(location.pathname);
      if (root.getAttribute('data-hush-path') !== kind) root.setAttribute('data-hush-path', kind);
      // chat + settings are full-width two-pane apps; leave their layout alone
      const wide = kind === 'chat' || kind === 'settings';
      if (wide !== root.hasAttribute('data-hush-wide')) {
        if (wide) root.setAttribute('data-hush-wide', ''); else root.removeAttribute('data-hush-wide');
      }
    }

    function detectTheme() {
      const bg = getComputedStyle(document.body || root).backgroundColor;
      const m = bg.match(/\d+(\.\d+)?/g);
      if (!m) return;
      const [r, g, b] = m.map(Number);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const theme = lum > 0.5 ? 'light' : 'dark';
      if (root.getAttribute('data-hush-theme') !== theme) root.setAttribute('data-hush-theme', theme);
    }

    // ---- nav ---------------------------------------------------------------
    const NAV_KEYS = {
      AppTabBar_Home_Link: 'g h', AppTabBar_Explore_Link: 'g e', AppTabBar_Notifications_Link: 'g n',
      AppTabBar_DirectMessage_Link: 'g m', AppTabBar_Profile_Link: 'g p'
    };

    function syncNav() {
      const nav = document.querySelector('header[role="banner"] nav[role="navigation"]');
      if (!nav) return;
      for (const a of nav.querySelectorAll('a[href]')) {
        const label = a.getAttribute('aria-label') || '';
        const m = label.match(/\((\d+\+?)/) || (a.textContent || '').match(/(\d+\+?)\s*$/);
        const count = m ? m[1] : '';
        if (a.dataset.hushTail !== count) a.dataset.hushTail = count;

        const keys = NAV_KEYS[a.dataset.testid] || (a.getAttribute('href').startsWith('/i/history') ? 'g b' : '');
        if (keys) ensureCaps(a, keys);

        const href = a.getAttribute('href');
        const p = location.pathname;
        const active = p === href || p.startsWith(href + '/');
        if (active !== a.hasAttribute('data-hush-active')) {
          if (active) a.setAttribute('data-hush-active', ''); else a.removeAttribute('data-hush-active');
        }
      }
      ensureBookmarks(nav);
      ensureRows();
    }

    // key caps live as a real child of X's link (re-added if React drops it)
    function ensureCaps(el, keys) {
      const have = el.querySelector(':scope > .hush-keys');
      if (have && have.dataset.keys === keys) return;
      if (have) have.remove();
      const caps = Hush.keycaps(keys);
      caps.dataset.keys = keys;
      el.append(caps);
    }

    // outline icons for hush's own rows, drawn to sit beside X's (only shown in icon modes)
    const GLYPHS = {
      search: [['circle', { cx: '11', cy: '11', r: '6.5' }], ['path', { d: 'm16 16 4.5 4.5' }]],
      tune: [['path', { d: 'M4 7h9M17 7h3M4 17h3M11 17h9' }], ['circle', { cx: '15', cy: '7', r: '2' }], ['circle', { cx: '9', cy: '17', r: '2' }]],
      write: [['path', { d: 'M15.2 5.3l3.5 3.5M4.5 19.5l.9-4.1L16.3 4.5a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.6 18.6l-4.1.9Z' }]],
      bookmark: [['path', { d: 'M6.5 3.75h11a.75.75 0 0 1 .75.75v15.6l-6.25-4.2-6.25 4.2V4.5a.75.75 0 0 1 .75-.75Z' }]]
    };
    function icon(name) {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.75');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      for (const [tag, attrs] of GLYPHS[name]) {
        const el = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        svg.append(el);
      }
      const wrap = document.createElement('span');
      wrap.className = 'hush-icon';
      wrap.append(svg);
      return wrap;
    }

    // extra rows under "write": search / and tune ⌘K, like the rest of the menu
    function ensureRows() {
      const btn = document.querySelector('header[role="banner"] a[data-testid="SideNav_NewTweet_Button"]');
      if (btn) {
        ensureCaps(btn, 'n');
        if (!btn.querySelector(':scope > .hush-icon')) btn.prepend(icon('write'));
      }
      if (!btn || (btn.nextElementSibling && btn.nextElementSibling.classList.contains('hush-x-rows'))) return;
      document.querySelectorAll('.hush-x-rows').forEach((el) => el.remove());
      const rows = document.createElement('div');
      rows.className = 'hush-x-rows';
      const make = (label, key, glyph, run) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hush-x-row';
        b.setAttribute('aria-label', label);
        const l = document.createElement('span'); l.className = 'hush-x-label'; l.textContent = label;
        b.append(icon(glyph), l, Hush.keycaps(key));
        b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); run(); });
        return b;
      };
      rows.append(
        make('search', '/', 'search', () => focusSearch()),
        make('tune', isMac ? '⌘ k' : 'ctrl k', 'tune', () => ctx.openPalette())
      );
      btn.after(rows);
    }

    // X drops "History" (bookmarks) from the menu on narrower windows; keep it
    function ensureBookmarks(nav) {
      const xLink = nav.querySelector(':scope > a[href^="/i/history"], :scope > a[href="/i/bookmarks"]');
      let ours = nav.querySelector(':scope > .hush-x-navlink');
      if (xLink) { if (ours) ours.remove(); return; }
      if (!ours) ours = createBookmarks(nav);
      const active = location.pathname.startsWith('/i/history') || location.pathname.startsWith('/i/bookmarks');
      if (active !== ours.hasAttribute('data-hush-active')) ours.toggleAttribute('data-hush-active', active);
    }
    function createBookmarks(nav) {
      const a = document.createElement('a');
      a.className = 'hush-x-navlink';
      a.href = '/i/history';
      a.setAttribute('aria-label', 'Bookmarks');
      a.dataset.hushTail = '';
      a.append(icon('bookmark'), Hush.keycaps('g b'));
      a.addEventListener('click', (e) => { e.preventDefault(); go('/i/history'); });
      const anchor = nav.querySelector(':scope > a[data-testid="AppTabBar_Profile_Link"]');
      if (anchor) nav.insertBefore(a, anchor); else nav.append(a);
      return a;
    }

    // composers (inline reply, home, modal): mark X's bordered box so CSS can flatten it
    function markComposers() {
      const areas = [...document.querySelectorAll('[data-testid^="tweetTextarea_"]')].filter((el) => /^tweetTextarea_\d+$/.test(el.dataset.testid));
      for (const ta of areas) {
        if (ta.closest('[data-hush-composer]')) continue; // already done
        let el = ta.parentElement;
        for (let i = 0; el && i < 26; i++, el = el.parentElement) {
          if (el.hasAttribute('data-hush-composer')) break;
          if (el.matches('[data-testid="cellInnerDiv"], [data-testid="primaryColumn"], [role="dialog"], main')) break;
          const cs = getComputedStyle(el);
          if (parseFloat(cs.borderTopWidth) >= 1 && parseFloat(cs.borderTopLeftRadius) > 0 && el.getBoundingClientRect().width > 200) {
            el.setAttribute('data-hush-composer', '');
            break;
          }
        }
      }
    }

    // some blue is set inline (style="color: rgb(29, 155, 240)"), out of reach of the rule scan
    function markInlineBlue() {
      for (const el of document.querySelectorAll('[style*="29, 155, 240"]:not([data-hush-blue])')) {
        const st = el.getAttribute('style') || '';
        el.setAttribute('data-hush-blue', /background-color:\s*rgb\(29, 155, 240\)/.test(st) ? 'bg' : /border[^:]*color:\s*rgb\(29, 155, 240\)/.test(st) ? 'line' : 'text');
      }
    }

    // tab bars (for you / following, profile tabs…): one indicator that slides
    // to the selected tab. Positioned with transform only, so it's composited.
    function syncTabIndicators() {
      for (const list of document.querySelectorAll('[data-testid="primaryColumn"] [role="tablist"]')) {
        const sel = list.querySelector('[role="tab"][aria-selected="true"]');
        let ind = list.querySelector(':scope > .hush-tab-ind');
        if (!sel) { if (ind) ind.style.opacity = '0'; continue; }
        if (!ind) {
          ind = document.createElement('span');
          ind.className = 'hush-tab-ind';
          list.append(ind);
          list.setAttribute('data-hush-tabs', '');
        }
        const label = sel.querySelector('span') || sel;
        const lr = list.getBoundingClientRect();
        const r = label.getBoundingClientRect();
        if (!r.width) continue;
        const x = Math.round(r.left - lr.left + list.scrollLeft);
        const key = `${x}:${Math.round(r.width)}`;
        if (ind.dataset.pos === key) continue;
        const first = !ind.dataset.pos;
        ind.dataset.pos = key;
        if (first) ind.style.transition = 'none';
        ind.style.width = `${Math.round(r.width)}px`;
        ind.style.transform = `translateX(${x}px)`;
        ind.style.opacity = '1';
        if (first) { void ind.offsetWidth; ind.style.transition = ''; }
      }
    }

    // home composer: tag its outermost box once (replaces a costly :has() rule)
    // The tag must only ever wrap the composer. X renders the composer before the
    // timeline, so: wait for posts to exist, never tag anything that holds posts,
    // tabs or headings, and drop the tag if that ever stops being true.
    // (the composer toolbar's own icon strip is a tablist too — that one doesn't count)
    const NOT_COMPOSER = '[data-testid="cellInnerDiv"], [role="tablist"]:not([data-testid="toolBar"] *), [role="region"], section, h1, h2, [data-testid="primaryColumn"]';
    function markHomeComposer() {
      const home = root.getAttribute('data-hush-path') === 'home';
      for (const m of document.querySelectorAll('[data-hush-homecompose]')) {
        if (!home || m.querySelector(NOT_COMPOSER)) m.removeAttribute('data-hush-homecompose');
      }
      if (!home) return;
      const col = document.querySelector('[data-testid="primaryColumn"]');
      if (!col || !col.querySelector('[data-testid="cellInnerDiv"] article')) return; // timeline not here yet
      // the text box and its toolbar row live in separate branches; tag each
      for (const start of col.querySelectorAll('[data-testid="tweetTextarea_0_label"], [data-testid="toolBar"]')) {
        if (start.closest('[data-testid="cellInnerDiv"], [role="dialog"], [data-hush-homecompose]')) continue;
        let el = start;
        while (el.parentElement && el.parentElement !== col && !el.parentElement.querySelector(NOT_COMPOSER)) {
          el = el.parentElement;
        }
        if (el !== start && !el.querySelector(NOT_COMPOSER)) el.setAttribute('data-hush-homecompose', '');
      }
    }

    // search fields: tag X's wrapper boxes once (cheaper than a page-wide :has() rule)
    function markSearch() {
      for (const label of document.querySelectorAll('[data-testid="SearchBox_Search_Input_label"]:not([data-hush-search])')) {
        label.setAttribute('data-hush-search', '');
        let el = label.parentElement;
        for (let i = 0; el && i < 3; i++, el = el.parentElement) el.setAttribute('data-hush-searchwrap', '');
      }
    }

    // sticky column headers ("Post", "Notifications", the tab bar): solid, not see-through
    function markSticky() {
      const col = document.querySelector('[data-testid="primaryColumn"]');
      if (!col || col.querySelector('[data-hush-sticky]')) return; // one per page is enough
      const divs = col.querySelectorAll('div');
      for (let i = 0; i < Math.min(divs.length, 80); i++) {
        const d = divs[i];
        if (d.hasAttribute('data-hush-sticky')) continue;
        const cs = getComputedStyle(d);
        if (cs.position === 'sticky' && parseFloat(cs.top) <= 1 && d.getBoundingClientRect().height > 30) d.setAttribute('data-hush-sticky', '');
      }
    }

    // ---- timeline cleanup ----------------------------------------------------
    function isAd(article) {
      for (const span of article.querySelectorAll('span')) {
        if (span.children.length || span.closest('[data-testid="tweetText"]')) continue;
        if (AD_LABELS.has(span.textContent.trim().toLowerCase())) return true;
      }
      return false;
    }

    function headingKind(cell) {
      let any = false;
      for (const h of cell.querySelectorAll('h2, [role="heading"]')) {
        const t = h.textContent.trim().toLowerCase();
        if (!t) continue;
        any = true;
        if (STICKY_HEADINGS.some((n) => t.startsWith(n))) return 'sticky';
        if (NOISE_HEADINGS.some((n) => t === n || t.startsWith(n))) return 'noise';
      }
      return any ? 'other' : null;
    }

    function setHidden(el, hide) {
      if (hide === el.hasAttribute('data-hush-hide')) return;
      if (hide) el.setAttribute('data-hush-hide', ''); else el.removeAttribute('data-hush-hide');
    }

    function cleanTimeline() {
      let hiding = false;
      let sticky = false;
      for (const cell of document.querySelectorAll('[data-testid="cellInnerDiv"]')) {
        const article = cell.querySelector('article[data-testid="tweet"]');
        const kind = headingKind(cell);
        const empty = !article && !kind && !cell.textContent.trim();

        if (article || empty || kind === 'other') hiding = false;
        if (kind === 'noise') hiding = true;
        if (kind === 'sticky') sticky = true;

        const hide = hiding || sticky
          || (article && isAd(article))
          || !!cell.querySelector('[data-testid="eventHero"]');
        setHidden(cell, hide);
      }
    }

    // Upsell cards ("You aren't verified yet", "Subscribe to Premium", …):
    // find the card around a promo link and hide the whole card.
    function huntPromos() {
      for (const link of document.querySelectorAll(PROMO_LINKS)) {
        if (link.closest('header[role="banner"], article, [data-hush-hide], [role="tablist"]')) continue;
        const cell = link.closest('[data-testid="cellInnerDiv"]');
        if (cell) { setHidden(cell, true); continue; }
        const card = promoCard(link);
        if (card) setHidden(card, true);
      }
    }

    function promoCard(link) {
      const lh = link.getBoundingClientRect().height;
      let el = link.parentElement;
      let card = null;
      for (let i = 0; el && i < 7; i++, el = el.parentElement) {
        if (el.matches('main, [data-testid="primaryColumn"], [role="region"], body')) return null;
        const cs = getComputedStyle(el);
        const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
        const rounded = parseFloat(cs.borderTopLeftRadius) > 4;
        const h = el.getBoundingClientRect().height;
        if ((filled || rounded) && h > lh + 20 && h < 450) { card = el; break; }
      }
      if (!card) return null;
      // grow to the outermost wrapper that is the same box
      const h = card.getBoundingClientRect().height;
      while (card.parentElement && !card.parentElement.matches('main, [data-testid="primaryColumn"], [role="region"]')) {
        const ph = card.parentElement.getBoundingClientRect().height;
        if (Math.abs(ph - h) > 3 || card.parentElement.children.length > 1) break;
        card = card.parentElement;
      }
      return card;
    }

    // ---- separators ------------------------------------------------------------
    // X sets separator colors through atomic CSS classes. Rather than recolor
    // every border (which also reveals X's invisible ones), find the exact
    // rules that paint the separator color and soften only those.
    const lineSheet = document.createElement('style');
    lineSheet.id = 'hush-x-lines';
    let lastRuleCount = -1;
    let lastColor = '';
    const SIDES = ['top', 'right', 'bottom', 'left'];
    const rgbKey = (v) => (v.match(/[\d.]+/g) || []).slice(0, 3).map((n) => Math.round(+n)).join(',');

    // X paints its brand blue and modal overlay through atomic rules too, so the
    // same scan remaps them: blue text/icons → foreground, blue fills → neutral,
    // blue focus rings → a soft ring, the blue-gray overlay → plain dark.
    const BLUE = '29,155,240';
    const MASK = '91,112,131';
    // X's primary / secondary text colors across lights-out, dim and light themes
    const TEXT_FG = new Set(['231,233,234', '247,249,249', '15,20,25']);
    const TEXT_DIM = new Set(['113,118,123', '139,152,165', '83,100,113', '83,100,114']);
    const alphaOf = (v) => { const m = v.match(/[\d.]+/g) || []; return m.length > 3 ? +m[3] : 1; };
    const COLOR_PROPS = ['color', 'fill', 'stroke', 'text-decoration-color', 'caret-color'];

    function recolorLines() {
      const ref = document.querySelector('[data-testid="primaryColumn"]');
      if (!ref) return;
      const cs = getComputedStyle(ref);
      const color = rgbKey(cs.borderRightColor !== 'rgba(0, 0, 0, 0)' ? cs.borderRightColor : cs.borderLeftColor);
      if (!color) return;
      root.style.setProperty('--h-bg', getComputedStyle(document.body).backgroundColor);
      let count = 0;
      const sheets = [];
      for (const sh of document.styleSheets) {
        if (sh.ownerNode === lineSheet || (sh.ownerNode && sh.ownerNode.id === 'hush-dev-css')) continue;
        try { count += sh.cssRules.length; sheets.push(sh); } catch { /* cross-origin */ }
      }
      const themeKey = color + (root.getAttribute('data-hush-theme') || '');
      if (count === lastRuleCount && themeKey === lastColor) return;
      lastRuleCount = count;
      lastColor = themeKey;

      // only remap the text color that *is* the body text in this theme, so
      // dark-on-white button labels (and vice versa) stay readable
      const light = root.getAttribute('data-hush-theme') === 'light';
      const fgKeys = new Set([...TEXT_FG].filter((k) => (light ? k === '15,20,25' : k !== '15,20,25')));
      const out = new Map(); // "prop: value" -> Set(selectors)
      const add = (decl, sel) => { if (!out.has(decl)) out.set(decl, new Set()); out.get(decl).add(sel); };
      for (const sh of sheets) {
        for (const rule of sh.cssRules) {
          const sel = rule.selectorText;
          if (!sel || !rule.style || sel.includes('::')) continue;
          for (const side of SIDES) {
            const v = rule.style.getPropertyValue(`border-${side}-color`);
            if (!v) continue;
            const k = rgbKey(v);
            if (k === color) add(`border-${side}-color: var(--h-line)`, sel);
            else if (k === BLUE) add(`border-${side}-color: var(--h-ring)`, sel);
          }
          for (const p of COLOR_PROPS) {
            const v = rule.style.getPropertyValue(p);
            if (!v) continue;
            const k = rgbKey(v);
            if (k === BLUE || (p === 'color' && fgKeys.has(k))) add(`${p}: var(--h-fg)`, sel);
            else if (p === 'color' && TEXT_DIM.has(k)) add(`${p}: var(--h-dim)`, sel);
          }
          const bg = rule.style.getPropertyValue('background-color');
          if (bg) {
            const k = rgbKey(bg);
            if (k === BLUE) {
              const a = alphaOf(bg);
              add(a >= 0.99 ? 'background-color: var(--h-solid)' : `background-color: rgba(127,127,127,${(a * 0.6).toFixed(3)})`, sel);
            } else if (k === MASK) {
              add('background-color: rgba(0,0,0,.62)', sel);
              add('backdrop-filter: blur(6px)', sel);
            }
          }
        }
      }
      const S = 'html[data-hush-site="x"]';
      let css = '';
      for (const [decl, sels] of out) css += `${S} :is(${[...sels].join(',')}) { ${decl} !important; }\n`;
      css += `${S} [data-testid="primaryColumn"] { border-left-color: transparent !important; border-right-color: transparent !important; }\n`;
      lineSheet.textContent = css;
      if (!lineSheet.isConnected) (document.head || root).append(lineSheet);
    }

    // ---- keyboard ----------------------------------------------------------------
    // X already has great native keys (j/k, l, r, t, b, n, g h…). hush adds:
    //   /       search            ctrl/⌘ k   tune palette (engine)
    //   z       focus mode        ?          X's shortcut list
    function onKey(e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (ctx.isTyping(e) || (Hush.palette && Hush.palette.isOpen())) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (e.key === '/') {
        e.preventDefault();
        e.stopImmediatePropagation();
        focusSearch();
      } else if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const next = !ctx.options.zen;
        ctx.setOption('zen', next);
        ctx.toast(next ? 'focus mode on' : 'focus mode off', next);
      }
    }
    window.addEventListener('keydown', onKey, true);

    // ---- micro-interactions -------------------------------------------------
    // Mark the post that was just acted on, so CSS can animate the change
    // (and only that one, not every liked post on screen).
    const POP = { like: 'like', unlike: 'like', retweet: 'repost', unretweet: 'repost', bookmark: 'keep', removeBookmark: 'keep' };
    function markPop(target) {
      const btn = target.closest && target.closest('article [role="group"] button[data-testid]');
      if (!btn) return;
      const kind = POP[btn.dataset.testid];
      const article = btn.closest('article');
      if (!kind || !article) return;
      article.setAttribute('data-hush-pop', kind);
      clearTimeout(article.__hushPop);
      article.__hushPop = setTimeout(() => article.removeAttribute('data-hush-pop'), 900);
    }
    const onPointer = (e) => markPop(e.target);
    // X's own keys: l like, t repost (then confirm), b bookmark — on the focused post
    const onActionKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || ctx.isTyping(e)) return;
      const kind = { l: 'like', b: 'keep' }[e.key];
      const article = document.activeElement && document.activeElement.closest && document.activeElement.closest('article');
      if (!kind || !article) return;
      article.setAttribute('data-hush-pop', kind);
      clearTimeout(article.__hushPop);
      article.__hushPop = setTimeout(() => article.removeAttribute('data-hush-pop'), 900);
    };
    document.addEventListener('click', onPointer, true);
    window.addEventListener('keydown', onActionKey, true);
    // repost goes through a menu ("Repost" / "Quote"); mark on the confirm too
    let lastRepostArticle = null;
    const onRepostMenu = (e) => {
      const rt = e.target.closest && e.target.closest('article [role="group"] button[data-testid="retweet"], article [role="group"] button[data-testid="unretweet"]');
      if (rt) lastRepostArticle = rt.closest('article');
      const confirm = e.target.closest && e.target.closest('[data-testid="retweetConfirm"], [data-testid="unretweetConfirm"]');
      if (confirm && lastRepostArticle) {
        const a = lastRepostArticle;
        a.setAttribute('data-hush-pop', 'repost');
        clearTimeout(a.__hushPop);
        a.__hushPop = setTimeout(() => a.removeAttribute('data-hush-pop'), 900);
      }
    };
    document.addEventListener('click', onRepostMenu, true);

    // ---- chat / inbox ----------------------------------------------------------
    // X's chat is a separate app rendered inside an open shadow root, so page CSS
    // can't reach it. It's themed with design tokens, so hush remaps the tokens.
    const CHAT_CSS = `
      [data-xchat-root], [data-xchat-root][data-theme] {
        --x-font-sans: ${'"Inter","Geist","SF Pro Text",-apple-system,"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif'} !important;
        --radius-chat-bubble: 14px !important;
        --leading-chat-bubble: 19px !important;
      }
      [data-xchat-root][data-theme="dark"] {
        --x-fg-primary: #e4e4e4 !important;
        --x-fg-secondary: #8b8b8b !important;
        --x-fg-tertiary: #555 !important;
        --x-fg-brand: #e4e4e4 !important;
        --x-bg-secondary: #0a0a0a !important;
        --x-bg-tertiary: #141414 !important;
        --x-bg-quaternary: rgba(255,255,255,.035) !important;
        --x-bg-inputs: rgba(255,255,255,.045) !important;
        --x-bg-modal: #0d0d0d !important;
        --x-bg-sheets: #0d0d0d !important;
        --x-border-normal: rgba(255,255,255,.08) !important;
        --x-border-divider: rgba(255,255,255,.06) !important;
        --x-border-hover: rgba(255,255,255,.12) !important;
        --x-hover-subtle: rgba(255,255,255,.04) !important;
        --x-hover-faint: rgba(255,255,255,.025) !important;
        --chat-accent: 0 0% 17% !important;
        --chat-accent-foreground: 0 0% 92% !important;
        --chat-creator-bubble: 0 0% 17% !important;
        --color-brand: 0 0% 90% !important;
        --color-badge: 0 100% 65% !important;
        --accent: 0 0% 20% !important;
        --accent-foreground: 0 0% 92% !important;
        --ring: 0 0% 40% !important;
        --border: 0 0% 12% !important;
        --input: 0 0% 12% !important;
        --muted: 0 0% 11% !important;
        --muted-foreground: 0 0% 55% !important;
        --secondary: 0 0% 11% !important;
        --color-modal-background: 0 0% 5% !important;
      }
      [data-xchat-root][data-theme="light"] {
        --x-fg-primary: #1b1b1b !important;
        --x-fg-secondary: #7c7c7c !important;
        --x-fg-tertiary: #b3b3b3 !important;
        --x-fg-brand: #1b1b1b !important;
        --x-border-normal: rgba(0,0,0,.08) !important;
        --x-border-divider: rgba(0,0,0,.06) !important;
        --chat-accent: 0 0% 93% !important;
        --chat-accent-foreground: 0 0% 10% !important;
        --chat-creator-bubble: 0 0% 93% !important;
        --color-brand: 0 0% 10% !important;
        --color-badge: 0 85% 60% !important;
        --accent: 0 0% 92% !important;
        --accent-foreground: 0 0% 10% !important;
        --ring: 0 0% 60% !important;
      }
      [data-xchat-root] .font-chirp, [data-xchat-root].font-chirp { font-family: var(--x-font-sans) !important; letter-spacing: -.003em; }
      [data-xchat-root] :is(button, a, [role="button"], [role="option"], li) { transition: background-color .15s ease, color .15s ease, opacity .15s ease !important; }
      [data-xchat-root] .bg-brand { background-color: var(--x-fg-primary) !important; color: var(--x-fg-inverted) !important; }
      [data-xchat-root] .text-brand { color: var(--x-fg-primary) !important; }
      [data-xchat-root] .text-body { font-size: 14px !important; }
      [data-xchat-root] .text-subtext1 { font-size: 13px !important; }
      [data-xchat-root] .text-subtext2 { font-size: 12px !important; }
      [data-xchat-root] [data-icon] { opacity: .75; }
      /* new messages ease in instead of popping */
      [data-xchat-root] .rounded-chat-bubble { animation: hushBubble .32s cubic-bezier(.16,1,.3,1) both !important; }
      @keyframes hushBubble { from { opacity: 0; transform: translateY(4px) scale(.985); } }
      @media (prefers-reduced-motion: reduce) { [data-xchat-root] .rounded-chat-bubble { animation: none !important; } }
    `;
    function styleChat() {
      for (const hostEl of document.querySelectorAll('[data-testid^="xchat"]')) {
        const sr = hostEl.shadowRoot;
        if (!sr || sr.querySelector(':scope > style[data-hush]')) continue;
        const st = document.createElement('style');
        st.setAttribute('data-hush', '');
        st.textContent = CHAT_CSS;
        sr.append(st);
      }
    }

    // ---- scroll check-ins ------------------------------------------------------------
    // The home timeline never ends. Every 50 posts you scroll past, a quiet toast
    // says how far you've come — a nudge, never a wall.
    const seenPosts = new Set();
    let nextCheckin = 50;
    function checkIn() {
      if (!ctx.options.checkin || root.getAttribute('data-hush-path') !== 'home') return;
      for (const a of document.querySelectorAll('article[data-testid="tweet"] a[href*="/status/"] time')) {
        const href = a.parentElement && a.parentElement.getAttribute('href');
        if (!href) continue;
        const r = a.getBoundingClientRect();
        if (r.bottom < 0) seenPosts.add(href); // scrolled past it
      }
      if (seenPosts.size >= nextCheckin) {
        ctx.toast(`${nextCheckin} posts in · still worth it?`, false);
        nextCheckin += 50;
      }
    }
    let scrollTimer = null;
    const onScroll = () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(checkIn, 250); };
    window.addEventListener('scroll', onScroll, { passive: true });

    // ---- tune palette commands ---------------------------------------------------
    this.commands = (c, query) => {
      const q = (query || '').trim();
      const cmds = PAGES.map((p) => ({
        group: 'go to', label: p.label, hint: p.keys, keywords: p.keywords,
        run: () => go(p.path || profilePath())
      }));
      cmds.push(
        { group: 'do', label: 'write a post', hint: 'n', keywords: 'compose tweet new', run: write },
        { group: 'do', label: 'search', hint: '/', keywords: 'find', run: () => focusSearch() },
        { group: 'do', label: 'load new posts', hint: '.', keywords: 'refresh', run: () => { scrollTo(0, 0); go('/home'); } },
        { group: 'do', label: 'keyboard shortcuts', hint: '?', keywords: 'keys help', run: () => go('/i/keyboard_shortcuts') }
      );
      if (q.startsWith('@') && q.length > 1) {
        cmds.push({ group: 'do', label: `open ${q}`, always: true, run: () => go('/' + q.slice(1)) });
      }
      if (q) {
        cmds.push({ group: 'do', label: `search x for “${q}”`, always: true, run: () => focusSearch(q) });
      }
      return cmds;
    };

    // ---- loop --------------------------------------------------------------------
    let queued = false;
    const STEPS = [syncRoute, detectTheme, syncNav, cleanTimeline, huntPromos, recolorLines, styleChat, markComposers, markSticky, markInlineBlue, markSearch, syncTabIndicators, markHomeComposer];
    const warned = new Set();
    function tick() {
      queued = false;
      // each step is independent: one breaking (X changed something) mustn't stop the rest
      for (const step of STEPS) {
        try { step(); } catch (e) {
          if (!warned.has(step.name)) { warned.add(step.name); console.warn('[hush] x:', step.name, e); }
        }
      }
    }
    const throttled = Hush.throttle(tick, 150);
    function schedule() { throttled(); }

    const observer = new MutationObserver(schedule);
    const start = () => {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
      schedule();
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });

    window.addEventListener('popstate', schedule);
    window.addEventListener('resize', schedule, { passive: true });
    let lastPath = '';
    const routeTimer = setInterval(() => {
      if (lastPath !== location.pathname) { lastPath = location.pathname; schedule(); }
      recolorLines(); // X adds CSS rules lazily as new components appear
    }, 1000);

    return () => {
      observer.disconnect();
      clearInterval(routeTimer);
      window.removeEventListener('popstate', schedule);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keydown', onActionKey, true);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onPointer, true);
      document.removeEventListener('click', onRepostMenu, true);
      lineSheet.remove();
      root.style.removeProperty('--h-bg');
      document.querySelectorAll('.hush-x-rows, .hush-x-navlink, .hush-tab-ind, header[role="banner"] .hush-keys, header[role="banner"] .hush-icon').forEach((el) => el.remove());
      for (const a of ['data-hush-composer', 'data-hush-sticky', 'data-hush-blue', 'data-hush-search', 'data-hush-searchwrap', 'data-hush-tabs', 'data-hush-homecompose']) document.querySelectorAll(`[${a}]`).forEach((el) => el.removeAttribute(a));
      for (const h of document.querySelectorAll('[data-testid^="xchat"]')) {
        const st = h.shadowRoot && h.shadowRoot.querySelector(':scope > style[data-hush]');
        if (st) st.remove();
      }
      for (const el of document.querySelectorAll('[data-hush-hide]')) el.removeAttribute('data-hush-hide');
      for (const a of ['data-hush-theme', 'data-hush-path', 'data-hush-wide']) root.removeAttribute(a);
    };
  }
});
