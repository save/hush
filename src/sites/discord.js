// hush — Discord adapter (discord.com, ptb and canary; the 2026 "refresh" layout).
// Discord's class names are hashed ("sidebar_a4d4d9"), so the CSS matches them by prefix
// ([class^="sidebar_"]) and by Discord's own links, list ids and labels; a miss leaves
// Discord as it was. Discord paints with --background-* / --text-* tokens on .theme-dark /
// .theme-light, so most of the calm is a token remap (discord.css).
// Message pop-ups for the top island come from discord-main.js + core/notices.js.
// Discord's keys stay: plain letters go to the message box, so focus mode is Alt+Z.
Hush.register({
  id: 'dc',
  name: 'Discord',
  match: (host) => /^((ptb|canary)\.)?discord\.com$/.test(host),
  options: [
    { key: 'quietupsells', label: 'quiet upsells', group: 'layout', desc: 'No Nitro, Shop, Quests, gift or app buttons', keywords: 'nitro shop quests gift boost apps discover download promo', default: true },
    { key: 'noflair', label: 'plain profiles', group: 'look', desc: 'No avatar decorations, nameplates or profile effects', keywords: 'decoration nameplate effect cosmetics', default: true },
    { key: 'noactivenow', label: 'hide active now', group: 'layout', desc: 'No “Active Now” column on the friends page', keywords: 'activity playing right column', default: true },
    { key: 'nomembers', label: 'hide member list', group: 'layout', desc: 'Just the conversation; the member list stays closed', keywords: 'members users right sidebar', default: false },
    { key: 'calmbadges', label: 'calm badges', group: 'look', desc: 'Unread counts as quiet grey pills; mentions on the server rail stay red', keywords: 'unread badge ping mention red', default: true },
    { key: 'zen', label: 'focus mode', group: 'layout', desc: 'Just the conversation; servers and channels become a small island at the bottom', hint: 'alt z', keywords: 'zen hide sidebar servers channels', default: false }
  ],

  setup(ctx) {
    const { root } = ctx;

    // single-page navigation: Discord's own link if there is one, else its router via history
    function go(path) {
      const link = [...document.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === path);
      if (link) { link.click(); return; }
      history.pushState({}, '', path);
      dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }
    const press = (label) => { const b = document.querySelector(`[aria-label="${label}"]`); if (b) b.click(); };

    // ---- page flags -------------------------------------------------------------------
    function pageKind() {
      const p = location.pathname;
      if (p === '/channels/@me' || p === '/channels/@me/') return 'friends';
      if (p.startsWith('/channels/@me/')) return 'dm';
      if (p.startsWith('/channels/')) return 'channel';
      if (p.startsWith('/discovery') || p.startsWith('/guild-discovery')) return 'discover';
      return 'other';
    }
    function syncRoute() {
      const kind = pageKind();
      if (root.getAttribute('data-hush-path') !== kind) root.setAttribute('data-hush-path', kind);
    }

    // Discord puts .theme-dark / .theme-light on <html> and on its app root
    function detectTheme() {
      const el = document.querySelector('[class*="theme-dark"], [class*="theme-light"]') || document.documentElement;
      const theme = el.classList.contains('theme-light') || document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
      if (root.getAttribute('data-hush-theme') !== theme) root.setAttribute('data-hush-theme', theme);
    }

    // ---- focus mode: the island -----------------------------------------------------------
    const island = Hush.island({
      items: [
        { id: 'home', label: 'messages', icon: 'message-circle', path: () => '/channels/@me', active: () => /^(friends|dm)$/.test(pageKind()) },
        { id: 'discover', label: 'discover', icon: 'compass', path: () => '/discovery', active: () => pageKind() === 'discover' }
      ],
      extra: [
        { id: 'inbox', label: 'inbox', icon: 'bell', run: () => press('Inbox') },
        { id: 'settings', label: 'settings', icon: 'settings', run: () => press('User Settings') }
      ],
      go,
      onLeave: () => { ctx.setOption('zen', false); ctx.toast('focus mode off', false); }
    });
    function syncIsland() { island.sync(!!ctx.options.zen); }

    // Alt+Z: typing a plain letter anywhere on Discord goes to the message box, so no bare z
    function onKey(e) {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.code !== 'KeyZ') return;
      if (Hush.palette && Hush.palette.isOpen()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const next = !ctx.options.zen;
      ctx.setOption('zen', next);
      ctx.toast(next ? 'focus mode on' : 'focus mode off', next);
    }
    window.addEventListener('keydown', onKey, true);

    // ---- tune palette ---------------------------------------------------------------------
    this.commands = () => [
      { group: 'go to', label: 'messages', keywords: 'home friends dms direct', run: () => go('/channels/@me') },
      { group: 'go to', label: 'discover servers', keywords: 'explore discovery', run: () => go('/discovery') },
      { group: 'do', label: 'open inbox', keywords: 'mentions notifications unreads', run: () => press('Inbox') },
      { group: 'do', label: 'open settings', keywords: 'user settings account', run: () => press('User Settings') },
      { group: 'do', label: ctx.options.zen ? 'leave focus mode' : 'focus mode', hint: 'alt z', keywords: 'zen hide sidebar', run: () => { const next = !ctx.options.zen; ctx.setOption('zen', next); ctx.toast(next ? 'focus mode on' : 'focus mode off', next); } }
    ];

    // ---- loop -------------------------------------------------------------------------------
    const STEPS = [syncRoute, detectTheme, syncIsland];
    function tick() {
      for (const step of STEPS) {
        try { step(); } catch (e) { console.warn('[hush] dc:', step.name, e); }
      }
    }
    const schedule = Hush.throttle(tick, 250);
    const observer = new MutationObserver(schedule);
    const start = () => { observer.observe(document.body, { childList: true, subtree: true }); schedule(); };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    const optObs = new MutationObserver(schedule);
    optObs.observe(root, { attributes: true, attributeFilter: ['data-hush-zen', 'data-hush-site'] });
    window.addEventListener('popstate', schedule);
    tick();

    return () => {
      observer.disconnect();
      optObs.disconnect();
      island.destroy();
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('popstate', schedule);
      for (const a of ['data-hush-path', 'data-hush-theme']) root.removeAttribute(a);
    };
  }
});
