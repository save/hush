// hush — notifications in the top island, like a phone's banners.
//
// Each supported site already shows its unread counts (X's bell and chats, YouTube's bell,
// Roblox's chat, friend requests and inbox, GitHub's bell, Reddit's inbox and chat). This
// watches them in every tab, and when one goes up while you're looking at a different tab,
// tells the background, which shows it in the island of the tab you're on. Discord is
// different: its own message notifications are caught as they're made (discord-main.js),
// so the banner says who wrote and what. Clicking a banner focuses the tab and goes to the
// place it's about (notice-go below). Nothing is fetched: it only reads what the page
// already shows, and nothing leaves the browser.
(() => {
  const H = globalThis.Hush;
  if (!H || H.notices || window.top !== window) return;
  const host = location.hostname.replace(/^www\./, '').replace(/^(ptb|canary)\.(?=discord\.com$)/, '');
  H.notices = true;

  // the app icons: the brand glyph on its colour (drawn inline, so no site's rules can block it)
  H.noticeApps = {"x.com":{"name":"X","color":"#3a3a3c","path":"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"},"youtube.com":{"name":"YouTube","color":"#ff0033","path":"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"},"roblox.com":{"name":"Roblox","color":"#3a3a3c","path":"M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z"},"github.com":{"name":"GitHub","color":"#3a3a3c","path":"M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"},"reddit.com":{"name":"Reddit","color":"#ff4500","path":"M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"},"discord.com":{"name":"Discord","color":"#5865f2","path":"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"}};
  const app = H.noticeApps[host];
  if (!app) return;

  const $ = (s, root = document) => root.querySelector(s);
  const num = (t) => { const m = String(t || '').replace(/[,\s]/g, '').match(/(\d+)(\+?)/); return m ? +m[1] : 0; };
  const many = (n, one, more) => (n === 1 ? one : `${n} ${more}`);
  // the light DOM first, then open shadow roots (Reddit is built from them)
  function deep(sel, root = document, depth = 0) {
    const hit = root.querySelector(sel);
    if (hit || depth > 4) return hit;
    for (const e of root.querySelectorAll('*')) if (e.shadowRoot) { const h = deep(sel, e.shadowRoot, depth + 1); if (h) return h; }
    return null;
  }
  const badge = (el) => (el ? num(el.getAttribute('aria-label')) || num((el.querySelector('[class*="badge" i], faceplate-number, [aria-live]') || {}).textContent) || num(el.getAttribute('number')) : 0);

  // going there: a site's own link if the page has one (single-page sites stay put), else load it
  function goTo(path) {
    const a = [...document.querySelectorAll('a[href]')].find((x) => { const h = x.getAttribute('href'); return h === path || h === location.origin + path; });
    if (a) a.click();
    else location.assign(path);
  }
  const press = (sel) => () => { const b = deep(sel); if (b) b.click(); };

  // counters: [key, () => count, (n) => [title, body], open it]
  const COUNTERS = {
    'x.com': [
      ['bell', () => num(($('a[data-testid="AppTabBar_Notifications_Link"]') || { getAttribute: () => '' }).getAttribute('aria-label')), (n) => ['Notifications', many(n, 'Something new for you', 'new notifications')], () => goTo('/notifications')],
      ['chat', () => num(($('a[data-testid="AppTabBar_DirectMessage_Link"]') || { getAttribute: () => '' }).getAttribute('aria-label')), (n) => ['New message', many(n, 'Someone sent you a message', 'unread chats')],
        () => { const a = $('a[data-testid="AppTabBar_DirectMessage_Link"]'); if (a) a.click(); else goTo('/i/chat'); }]
    ],
    'youtube.com': [
      ['bell', () => num(($('ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge, ytd-notification-topbar-button-renderer #notification-count') || {}).textContent), (n) => ['Notifications', many(n, 'A new video or reply', 'new notifications')],
        press('ytd-notification-topbar-button-renderer button, ytd-notification-topbar-button-renderer yt-icon-button, ytd-notification-topbar-button-renderer')]
    ],
    'roblox.com': [
      ['friends', () => num(($('#left-navigation-container a[data-hush-nav="friends"] :is(.foundation-web-status-indicator, .foundation-web-badge)') || {}).textContent), (n) => ['Friend request', many(n, 'Someone wants to be friends', 'friend requests')], () => goTo('/users/friends#!/friend-requests')],
      ['inbox', () => num(($('#left-navigation-container a[data-hush-nav="messages"] :is(.foundation-web-status-indicator, .foundation-web-badge)') || {}).textContent), (n) => ['Inbox', many(n, 'A new message in your inbox', 'messages in your inbox')], () => goTo('/my/messages/#!/inbox')],
      ['bell', () => num(($('.notification-stream-indicator') || {}).textContent), (n) => ['Notifications', many(n, 'Something new for you', 'new notifications')],
        press('#navbar-stream .notification-stream-icon, #nav-ns-icon, .notification-stream-icon, #navbar-stream')]
    ],
    'github.com': [
      ['bell', () => {
        const a = $('a[href="/notifications"]');
        if (!a) return 0;
        const label = ((a.getAttribute('aria-labelledby') && document.getElementById(a.getAttribute('aria-labelledby'))) || a).textContent + ' ' + (a.getAttribute('aria-label') || '');
        return /you have unread/i.test(label) || a.matches('.AppHeader-button--hasIndicator, [class*="hasIndicator"]') || !!$('notification-indicator [data-indicator-mode="global"]') ? 1 : 0;
      }, () => ['Notifications', 'You have unread notifications'], () => goTo('/notifications')]
    ],
    'reddit.com': [
      ['inbox', () => badge(deep('#notifications-inbox-button')), (n) => ['Notifications', many(n, 'Something new in your inbox', 'new notifications')], () => goTo('/notifications')],
      ['chat', () => badge(deep('#header-action-item-chat-button, [id*="chat-button"]')), (n) => ['New message', many(n, 'Someone sent you a chat', 'unread chats')], () => goTo('/chat')]
    ]
  }[host] || [];

  // on when hush is on here, the island is on, and notifications aren't switched off
  let on = false;
  const load = () => H.load().then((st) => { on = H.isOn(st, location.hostname) && st.island !== false && st.notices !== false; tellPage(); }).catch(() => {});
  load();
  chrome.storage.onChanged.addListener((c, area) => { if (H.isSettingsChange(c, area)) load(); });

  const last = {};
  let rows = null; // Roblox chat: name → last line
  const watching = () => !(document.visibilityState === 'visible' && document.hasFocus());

  function send(title, body, key, id, done) {
    const notice = { host, key, id, title: String(title).slice(0, 80), body: String(body || '').slice(0, 140) };
    try { chrome.runtime.sendMessage({ type: 'hush:notice', notice }, (r) => { void chrome.runtime.lastError; if (done) done(!!(r && r.shown)); }); } catch { clearInterval(timer); if (done) done(false); }
  }

  /* ---- Discord: its own notifications, handed over by discord-main.js ---------------- */
  function tellPage() { if (host === 'discord.com') window.postMessage({ __hush: 'dc-on', on }, location.origin); }
  if (host === 'discord.com') {
    window.addEventListener('message', (e) => {
      if (e.source !== window || e.origin !== location.origin || !e.data || typeof e.data.__hush !== 'string') return;
      const d = e.data;
      if (d.__hush === 'dc-hello') tellPage();
      if (d.__hush === 'dc-notice' && typeof d.id === 'number') {
        const answer = (shown) => window.postMessage({ __hush: 'dc-shown', id: d.id, shown }, location.origin);
        if (!on) { answer(false); return; }
        // the title is "name (#channel, server)", or just the name for a DM
        send(d.title || 'Discord', d.body, 'msg', d.id, answer);
      }
    });
  }

  /* ---- clicked in some island: go to the thing -------------------------------------- */
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== 'hush:notice-go') return;
    const key = String(msg.key || '');
    try {
      if (host === 'discord.com' && key === 'msg') { window.postMessage({ __hush: 'dc-click', id: msg.id }, location.origin); return; }
      if (key.startsWith('chat:')) {
        const name = key.slice(5);
        const row = [...document.querySelectorAll('#chat-container .react-chat-row')].find((r) => ((r.querySelector('.react-chat-row-title') || {}).textContent || '').trim() === name);
        if (row) row.click();
        return;
      }
      const c = COUNTERS.find((x) => x[0] === key);
      if (c && c[3]) c[3]();
    } catch (err) { console.warn('[hush] notice go', err); }
  });

  function check() {
    if (!on) return;
    const away = watching();
    for (const [key, count, words] of COUNTERS) {
      let n = 0;
      try { n = count() || 0; } catch { n = 0; }
      if (last[key] != null && n > last[key] && away) { const [t, b] = words(n); send(t, b, key); }
      last[key] = n;
    }
    // Roblox chat: who wrote, and what (the chat list keeps each friend's last line)
    if (host === 'roblox.com') {
      const now = new Map();
      for (const r of document.querySelectorAll('#chat-container .react-chat-row')) {
        const name = ($('.react-chat-row-title', r) || {}).textContent;
        const line = ($('.react-chat-row-preview', r) || {}).textContent;
        if (name) now.set(name.trim(), String(line || '').trim());
      }
      if (rows && now.size && away) {
        for (const [name, line] of now) {
          if (rows.has(name) ? rows.get(name) !== line && line : rows.size && [...now.keys()][0] === name && line) { send(name, line, 'chat:' + name); break; }
        }
      }
      if (now.size) rows = now;
    }
  }

  const timer = setInterval(check, 2000);
  // the tab's title changes the moment a count does (X and YouTube put it there), even in a background tab
  const watchTitle = () => { const t = document.querySelector('title'); if (t) new MutationObserver(() => setTimeout(check, 300)).observe(t, { childList: true, characterData: true, subtree: true }); else setTimeout(watchTitle, 1000); };
  watchTitle();
  document.addEventListener('visibilitychange', () => setTimeout(check, 500));
})();
