// hush — Reddit adapter (the current "shreddit" Reddit; old.reddit.com is left alone).
// Reddit is built from web components themed with --color-* tokens, which reach
// inside their shadow roots, so most of the calm is a token remap (reddit.css).
// This JS layer adds page and theme awareness, tags left-menu sections by their
// heading, and palette commands. Reddit's own keyboard shortcuts are untouched.
Hush.register({
  id: 'rd',
  name: 'Reddit',
  match: (host) => /^(www\.|new\.|sh\.)?reddit\.com$/.test(host),
  // mute words: a post is its feed card; calm titles: post titles
  mute: {
    items: 'shreddit-post',
    target: (el) => el.closest('article') || el
  },
  titles: 'shreddit-post [slot="title"], shreddit-post a[id^="post-title-"]',
  options: [
    { key: 'quietnav', label: 'quiet menu', group: 'layout', desc: 'No games, resources or Reddit Answers in the menu', keywords: 'sidebar left nav games answers ai resources', default: true },
    { key: 'quietright', label: 'quiet home sidebar', group: 'feed', desc: 'No “recent posts” column on home, popular and all', keywords: 'right sidebar recent', default: true },
    { key: 'noawards', label: 'hide awards', group: 'feed', desc: 'No award buttons or badges on posts', keywords: 'gold awards give', default: true },
    { key: 'neutralvotes', label: 'neutral votes', group: 'look', desc: 'Votes in greys instead of orange and blue', keywords: 'upvote downvote colour karma', default: true },
    { key: 'calmtitles', label: 'calm titles', group: 'look', desc: 'No ALL CAPS, emoji or “!!!” in post titles', keywords: 'caps emoji clickbait', default: true },
    { key: 'softmedia', label: 'soft media', group: 'look', desc: 'Images and video quieter until you point at them', keywords: 'images thumbnails colour saturation', default: false }
  ],

  setup(ctx) {
    const { root } = ctx;

    function go(path) {
      const link = [...document.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === path);
      if (link) link.click();
      else location.href = path;
    }

    const sub = () => {
      const m = location.pathname.match(/^\/r\/([^/]+)/i);
      return m && !/^(popular|all)$/i.test(m[1]) ? m[1] : '';
    };

    // ---- page flags --------------------------------------------------------------
    function pageKind() {
      const p = location.pathname.toLowerCase();
      if (p === '/' || /^\/(best|hot|new|top|rising)\/?$/.test(p) || p.startsWith('/home')) return 'home';
      if (/^\/r\/(popular|all)\b/.test(p)) return 'popular';
      if (/^\/r\/[^/]+\/comments\//.test(p)) return 'post';
      if (p.startsWith('/r/')) return 'sub';
      if (/^\/(user|u)\//.test(p)) return 'user';
      if (p.startsWith('/search')) return 'search';
      return 'other';
    }
    function syncRoute() {
      const kind = pageKind();
      if (root.getAttribute('data-hush-path') !== kind) root.setAttribute('data-hush-path', kind);
    }

    // Reddit marks the theme with a class on <html>; fall back to the system
    const darkMq = matchMedia('(prefers-color-scheme: dark)');
    function detectTheme() {
      const cl = document.documentElement.classList;
      const theme = cl.contains('theme-dark') ? 'dark' : cl.contains('theme-light') ? 'light' : darkMq.matches ? 'dark' : 'light';
      if (root.getAttribute('data-hush-theme') !== theme) root.setAttribute('data-hush-theme', theme);
    }

    // ---- left menu: tag sections by their heading -----------------------------------
    function tagNav() {
      const nav = document.querySelector('#left-sidebar-container, reddit-sidebar-nav, flex-left-nav-container');
      if (!nav) return;
      for (const s of nav.querySelectorAll('faceplate-expandable-section-helper, details, games-section-badge-controller, nav[aria-label], section[aria-label]')) {
        if (s.hasAttribute('data-hush-section')) continue;
        const head = s.matches('nav, section')
          ? s.getAttribute('aria-label')
          : (s.querySelector('summary, [slot="summary"], h2, h3') || {}).textContent;
        const name = String(head || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (name) s.setAttribute('data-hush-section', name);
      }
    }

    // ---- palette commands -------------------------------------------------------------
    this.commands = (c, query) => {
      const q = (query || '').trim();
      const r = sub();
      const cmds = [
        { group: 'go to', label: 'home', keywords: 'feed front page', run: () => go('/') },
        { group: 'go to', label: 'popular', keywords: 'trending', run: () => go('/r/popular/') },
        { group: 'go to', label: 'all', run: () => go('/r/all/') },
        { group: 'go to', label: 'saved', keywords: 'bookmarks later', run: () => go('/user/me/saved/') },
        { group: 'go to', label: 'notifications', keywords: 'inbox messages', run: () => go('/notifications') },
        { group: 'do', label: 'create a post', keywords: 'submit new write', run: () => go(r ? `/r/${r}/submit` : '/submit') }
      ];
      if (r) {
        cmds.push(
          { group: `r/${r}`, label: 'hot', run: () => go(`/r/${r}/hot/`) },
          { group: `r/${r}`, label: 'new', keywords: 'latest', run: () => go(`/r/${r}/new/`) },
          { group: `r/${r}`, label: 'top this week', keywords: 'best', run: () => go(`/r/${r}/top/?t=week`) }
        );
      }
      if (q) {
        if (r) cmds.push({ group: 'do', label: `search r/${r} for “${q}”`, always: true, run: () => go(`/r/${r}/search/?q=${encodeURIComponent(q)}&restrict_sr=1`) });
        cmds.push(
          { group: 'do', label: `search Reddit for “${q}”`, always: true, run: () => go(`/search/?q=${encodeURIComponent(q)}`) },
          { group: 'do', label: `go to r/${q.replace(/^r\//i, '').replace(/\s+/g, '')}`, always: true, run: () => go(`/r/${q.replace(/^r\//i, '').replace(/\s+/g, '')}/`) }
        );
      }
      return cmds;
    };

    // ---- loop ---------------------------------------------------------------------------
    const STEPS = [syncRoute, detectTheme, tagNav];
    function tick() {
      for (const step of STEPS) {
        try { step(); } catch (e) { console.warn('[hush] rd:', step.name, e); }
      }
    }
    const schedule = Hush.throttle(tick, 200);
    const observer = new MutationObserver(schedule);
    const start = () => {
      observer.observe(document.body, { childList: true, subtree: true });
      schedule();
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    const themeObs = new MutationObserver(detectTheme);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    darkMq.addEventListener('change', detectTheme);
    window.addEventListener('popstate', schedule);
    tick();

    return () => {
      observer.disconnect();
      themeObs.disconnect();
      darkMq.removeEventListener('change', detectTheme);
      window.removeEventListener('popstate', schedule);
      document.querySelectorAll('[data-hush-section]').forEach((el) => el.removeAttribute('data-hush-section'));
      for (const a of ['data-hush-path', 'data-hush-theme']) root.removeAttribute(a);
    };
  }
});
