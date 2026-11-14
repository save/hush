// hush — GitHub adapter.
// GitHub is already fairly calm, so hush works mostly through Primer's design
// tokens (github.css): quieter colours, one neutral accent, no Copilot nudges.
// This JS layer adds page and theme awareness, tags sidebar sections by their
// heading (GitHub's class names are hashed), and palette commands.
// GitHub has its own keyboard shortcuts (g c, g i, g p, s, /…), so hush adds none.
Hush.register({
  id: 'gh',
  name: 'GitHub',
  match: (host) => host === 'github.com' || host === 'www.github.com',
  options: [
    { key: 'nocopilot', label: 'hide Copilot', group: 'look', desc: 'No Copilot buttons, chats or prompts', keywords: 'ai assistant chat upsell', default: true },
    { key: 'quietsidebar', label: 'quiet repo sidebar', group: 'layout', desc: 'About, releases and languages only', keywords: 'used by contributors deployments packages', default: true },
    { key: 'greygraph', label: 'grey graphs', group: 'look', desc: 'Contribution graph and language colours in greys', keywords: 'contributions calendar languages colour', default: true },
    { key: 'noachievements', label: 'hide achievements', group: 'feed', desc: 'No badges on profiles', keywords: 'badges profile trophies', default: true },
    { key: 'nodashrecs', label: 'quiet dashboard', group: 'feed', desc: 'No “explore” or changelog column on your home', keywords: 'dashboard explore recommended trending changelog', default: true },
    { key: 'readable', label: 'readable READMEs', group: 'layout', desc: 'A comfortable line length for long docs', keywords: 'readme markdown width measure', default: true }
  ],

  setup(ctx) {
    const { root } = ctx;

    const me = () => {
      const m = document.querySelector('meta[name="user-login"]');
      return (m && m.getAttribute('content')) || '';
    };
    // owner/repo when on a repository page
    const repo = () => {
      const m = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
      if (m && m.content) return m.content;
      const parts = location.pathname.split('/').filter(Boolean);
      return parts.length >= 2 && !RESERVED.has(parts[0]) ? `${parts[0]}/${parts[1]}` : '';
    };
    const RESERVED = new Set(['settings', 'notifications', 'pulls', 'issues', 'search', 'explore', 'topics', 'marketplace', 'orgs', 'organizations', 'sponsors', 'login', 'signup', 'features', 'pricing', 'collections', 'trending', 'codespaces', 'new', 'dashboard', 'enterprise', 'about', 'security', 'stars', 'watching', 'apps', 'copilot', 'models']);

    function go(path) {
      const link = [...document.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === path);
      if (link) link.click();          // Turbo / React routing: no full reload
      else location.href = path;
    }

    // ---- page flags --------------------------------------------------------------
    function pageKind() {
      const parts = location.pathname.split('/').filter(Boolean);
      if (!parts.length) return 'home';
      if (RESERVED.has(parts[0])) return parts[0];
      if (parts.length === 1) return 'profile';
      const sub = parts[2] || '';
      if (!sub) return 'repo';
      if (sub === 'issues' || sub === 'pull' || sub === 'pulls' || sub === 'discussions') return 'thread';
      if (sub === 'blob' || sub === 'tree') return 'code';
      return 'repo';
    }
    function syncRoute() {
      const kind = pageKind();
      if (root.getAttribute('data-hush-path') !== kind) root.setAttribute('data-hush-path', kind);
    }

    // GitHub picks light or dark from its own setting, which may follow the system
    const darkMq = matchMedia('(prefers-color-scheme: dark)');
    function detectTheme() {
      const html = document.documentElement;
      const mode = html.getAttribute('data-color-mode') || 'auto';
      const dark = mode === 'dark' || (mode === 'auto' && darkMq.matches);
      const name = dark ? html.getAttribute('data-dark-theme') || 'dark' : html.getAttribute('data-light-theme') || 'light';
      const theme = /^light/.test(name) ? 'light' : /^dark/.test(name) ? 'dark' : dark ? 'dark' : 'light';
      if (root.getAttribute('data-hush-theme') !== theme) root.setAttribute('data-hush-theme', theme);
    }

    // ---- sidebar sections: tag by heading text (classes are hashed) ----------------
    // repo sidebar: [class*=sidebarSection] or .BorderGrid-row; profile: .border-top blocks
    const SECTION_HOSTS = '[class*="sidebarSection"], .BorderGrid-row, .Layout-sidebar .border-top, .js-profile-editable-area ~ .border-top';
    function tagSections() {
      for (const h of document.querySelectorAll(`:is(${SECTION_HOSTS}) h2`)) {
        const host = h.closest(SECTION_HOSTS);
        if (!host || host.hasAttribute('data-hush-section')) continue;
        // "Releases137 (137)" → "releases"; "Used by30M" → "used by"
        const name = (h.textContent || '').trim().toLowerCase().replace(/[\d,.]+[kmb]?\s*(\(.*\))?$/i, '').trim();
        host.setAttribute('data-hush-section', name);
      }
    }

    // ---- palette commands -------------------------------------------------------------
    this.commands = (c, query) => {
      const q = (query || '').trim();
      const user = me();
      const nwo = repo();
      const cmds = [
        { group: 'go to', label: 'dashboard', keywords: 'home feed', run: () => go('/') },
        { group: 'go to', label: 'notifications', keywords: 'inbox', run: () => go('/notifications') },
        { group: 'go to', label: 'your pull requests', keywords: 'prs review', run: () => go('/pulls') },
        { group: 'go to', label: 'your issues', keywords: 'bugs', run: () => go('/issues') }
      ];
      if (user) {
        cmds.push(
          { group: 'go to', label: 'your repositories', keywords: 'repos projects', run: () => go(`/${user}?tab=repositories`) },
          { group: 'go to', label: 'your stars', keywords: 'starred saved', run: () => go(`/${user}?tab=stars`) },
          { group: 'go to', label: 'your profile', keywords: 'me', run: () => go(`/${user}`) },
          { group: 'go to', label: 'settings', keywords: 'account preferences', run: () => go('/settings/profile') }
        );
      }
      if (nwo) {
        cmds.push(
          { group: nwo, label: 'code', keywords: 'files repository', run: () => go(`/${nwo}`) },
          { group: nwo, label: 'issues', run: () => go(`/${nwo}/issues`) },
          { group: nwo, label: 'pull requests', keywords: 'prs', run: () => go(`/${nwo}/pulls`) },
          { group: nwo, label: 'actions', keywords: 'ci workflows builds', run: () => go(`/${nwo}/actions`) },
          { group: nwo, label: 'releases', keywords: 'tags versions', run: () => go(`/${nwo}/releases`) }
        );
      }
      if (q) {
        if (nwo) cmds.push({ group: 'do', label: `search ${nwo} for “${q}”`, always: true, run: () => go(`/search?q=${encodeURIComponent(`repo:${nwo} ${q}`)}&type=code`) });
        cmds.push(
          { group: 'do', label: `search GitHub for “${q}”`, always: true, run: () => go(`/search?q=${encodeURIComponent(q)}`) },
          { group: 'do', label: `find repositories for “${q}”`, always: true, run: () => go(`/search?q=${encodeURIComponent(q)}&type=repositories`) }
        );
      }
      return cmds;
    };

    // ---- loop ---------------------------------------------------------------------------
    const STEPS = [syncRoute, detectTheme, tagSections];
    function tick() {
      for (const step of STEPS) {
        try { step(); } catch (e) { console.warn('[hush] gh:', step.name, e); }
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
    // theme switches (settings page, system appearance)
    const themeObs = new MutationObserver(detectTheme);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme'] });
    darkMq.addEventListener('change', detectTheme);
    window.addEventListener('popstate', schedule);
    document.addEventListener('turbo:load', schedule);
    tick();

    return () => {
      observer.disconnect();
      themeObs.disconnect();
      darkMq.removeEventListener('change', detectTheme);
      window.removeEventListener('popstate', schedule);
      document.removeEventListener('turbo:load', schedule);
      document.querySelectorAll('[data-hush-section]').forEach((el) => el.removeAttribute('data-hush-section'));
      for (const a of ['data-hush-path', 'data-hush-theme']) root.removeAttribute(a);
    };
  }
});
