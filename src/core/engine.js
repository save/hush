// hush — content-script engine. Picks the adapter for this page, applies the
// generic calm layer everywhere, wires the tune palette and live-updates when
// settings change.
(() => {
  const H = globalThis.Hush;
  if (!H || window.top !== window) return;

  const root = document.documentElement;
  const host = H.hostKey(location.hostname);
  const adapter = H.adapterFor(location.hostname);
  let settings = H.DEFAULTS;
  let teardown = null;
  let lastInteraction = 0;
  let on = false;

  function setFlag(name, value) {
    if (value) root.setAttribute(name, '');
    else root.removeAttribute(name);
  }

  // the colour slider: one custom property every soft-image filter reads
  let vibranceEl = null;
  function setVibrance(v) {
    const n = Math.max(0, Math.min(100, Number.isFinite(+v) ? +v : 90)) / 100;
    if (!vibranceEl) {
      vibranceEl = document.createElement('style');
      vibranceEl.id = 'hush-vibrance';
      (document.head || root).append(vibranceEl);
    }
    const css = `:root{--hush-sat:${n}}`;
    if (vibranceEl.textContent !== css) vibranceEl.textContent = css;
    if (!vibranceEl.isConnected) (document.head || root).append(vibranceEl);
  }

  // "hush this": elements you picked, as one stylesheet for this site
  let rulesEl = null;
  let userSel = [];
  function setRules(list) {
    userSel = (list || []).map((r) => r.s).filter((s) => { try { document.querySelector(s); return true; } catch { return false; } });
    if (!rulesEl) { rulesEl = document.createElement('style'); rulesEl.id = 'hush-rules'; }
    const css = on ? userSel.map((s) => `${s}{display:none!important}`).join('\n') : '';
    if (rulesEl.textContent !== css) rulesEl.textContent = css;
    if (!rulesEl.isConnected) (document.head || root).append(rulesEl);
  }
  const rulesHere = () => ((settings.hidden || {})[host] || []);
  function addRule(rule) {
    const list = [...rulesHere().filter((r) => r.s !== rule.s), rule];
    const hidden = { ...(settings.hidden || {}), [host]: list };
    settings = { ...settings, hidden };
    setRules(list);
    return H.save({ hidden });
  }
  function removeRule(rule) {
    const list = rulesHere().filter((r) => r.s !== rule.s);
    const hidden = { ...(settings.hidden || {}) };
    if (list.length) hidden[host] = list; else delete hidden[host];
    settings = { ...settings, hidden };
    setRules(list);
    return H.save({ hidden });
  }
  const pickDone = Object.assign((rule) => addRule(rule), { undo: removeRule });
  let lastContext = null;
  let lastContextAt = 0;
  document.addEventListener('contextmenu', (e) => {
    lastContext = (e.composedPath && e.composedPath()[0]) || e.target;
    lastContextAt = Date.now();
  }, true);
  function pick(fromMenu) {
    if (!on || !H.picker) return;
    const t = fromMenu && Date.now() - lastContextAt < 15000 && lastContext instanceof Element ? lastContext : null;
    H.picker.start(t, pickDone);
  }

  const VIBRANCE = [50, 70, 90, 100];
  const nearestVibrance = () => {
    const v = Number.isFinite(+settings.vibrance) ? +settings.vibrance : 90;
    return VIBRANCE.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  };
  const send = (type, view) => { try { chrome.runtime.sendMessage({ type, view }); } catch { /* extension reloaded */ } };

  let applied = false;
  let lastSig = '';

  // Animate a layout change with the browser's View Transitions: it snapshots the
  // page, applies the change, and cross-fades (GPU-composited, no layout thrash).
  function transition(fn) {
    const ok = document.startViewTransition && document.visibilityState === 'visible'
      && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ok) { fn(); return; }
    try { document.startViewTransition(fn); } catch { fn(); }
  }

  function apply(next, fromStorage) {
    settings = next;
    const was = on;
    on = H.isOn(settings, location.hostname);
    if (fromStorage && applied && was !== on && H.toast) {
      H.toast(on ? `hush on for ${host}` : `hush paused on ${host}`, on);
    }
    applied = applied || fromStorage;

    setFlag('data-hush', on);
    // pages can opt out of still motion: <meta name="hush" content="allow-motion">
    const allowMotion = !!document.querySelector('meta[name="hush"][content~="allow-motion"]');
    setFlag('data-hush-motion', on && settings.motion && !allowMotion);
    setFlag('data-hush-color', on && settings.color);
    setVibrance(settings.vibrance);
    setRules(rulesHere());

    if (!adapter) return;

    if (on) root.setAttribute('data-hush-site', adapter.id);
    else root.removeAttribute('data-hush-site');

    const opts = H.siteOptions(settings, adapter);
    // layout options changed → let the site re-measure (JS-sized grids, players)
    const sig = on + JSON.stringify(opts);
    if (lastSig && sig !== lastSig) requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    lastSig = sig;
    for (const [key, val] of Object.entries(opts)) {
      // choice options become valued attributes: data-hush-navstyle="icons"
      if (typeof val === 'string') {
        if (on) root.setAttribute(`data-hush-${key}`, val);
        else root.removeAttribute(`data-hush-${key}`);
      } else {
        setFlag(`data-hush-${key}`, on && val);
      }
    }

    if (on && !teardown && adapter.setup) {
      teardown = adapter.setup(ctx) || (() => {});
    } else if (!on && teardown) {
      teardown();
      teardown = null;
    }
  }

  // ---- helpers handed to adapters -------------------------------------
  const ctx = {
    root,
    get settings() { return settings; },
    get options() { return adapter ? H.siteOptions(settings, adapter) : {}; },
    setOption(key, value) {
      const opts = { ...H.siteOptions(settings, adapter), [key]: value };
      const sites = { ...settings.sites, [adapter.id]: opts };
      // apply right away (instant, animated feedback), then persist; storage echoes back harmlessly
      transition(() => apply({ ...settings, sites }, false));
      return H.save({ sites });
    },
    openPalette: () => H.palette && H.palette.open(),
    toast: (text, active) => H.toast && H.toast(text, active),
    /**
     * Single keys and two-key chords for sites without their own shortcuts.
     * ctx.keys({ 'g h': () => go('/home'), '/': focusSearch, z: toggleZen }) -> unbind fn
     * Ignored while typing, with modifiers held, or while the palette is open.
     */
    keys(map) {
      let pending = null;
      let timer = null;
      const starts = new Set(Object.keys(map).filter((c) => c.includes(' ')).map((c) => c.split(' ')[0]));
      const handler = (e) => {
        if (!on || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
        if (ctx.isTyping(e) || (H.palette && H.palette.isOpen())) return;
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const fire = (combo) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          try { map[combo](e); } catch (err) { console.warn('[hush] key', combo, err); }
        };
        if (pending) {
          const combo = `${pending} ${k}`;
          pending = null;
          clearTimeout(timer);
          if (map[combo]) fire(combo);
          return;
        }
        if (starts.has(k)) {
          pending = k;
          timer = setTimeout(() => { pending = null; }, 1200);
          e.preventDefault();
          return;
        }
        if (map[k]) fire(k);
      };
      window.addEventListener('keydown', handler, true);
      return () => window.removeEventListener('keydown', handler, true);
    },
    /** true when the user is typing somewhere and shortcuts should stay out of the way */
    isTyping(e) {
      const t = (e && e.composedPath ? e.composedPath()[0] : null) || document.activeElement;
      if (!t || !(t instanceof Element)) return false;
      return !!t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]');
    }
  };

  // an icon for each kind of setting (Lucide names, see core/icons.js)
  function optionIcon(key) {
    if (key === 'navstyle') return 'panel-left';
    if (key === 'zen') return 'focus';
    if (key === 'capfeed') return 'list';
    if (key === 'checkin') return 'clock';
    if (key === 'foldcomments') return 'message-square-off';
    if (/soft|banner/.test(key)) return 'image';
    if (/^no/.test(key)) return 'eye-off';
    return 'sliders-horizontal';
  }

  // ---- tune palette -----------------------------------------------------
  if (H.palette) {
    H.palette.addProvider(() => {
      const cmds = [
        {
          group: 'hush', label: `hush on ${host}`, keywords: 'disable pause off', hint: 'alt shift h', active: on, toast: false, icon: 'power',
          run: () => {
            const off = new Set(settings.disabledSites);
            if (on) off.add(host); else off.delete(host);
            H.save({ disabledSites: [...off] });
          }
        },
        { group: 'hush', label: 'still motion', icon: 'wind', keywords: 'animation autoplay video', active: !!settings.motion, run: () => H.save({ motion: !settings.motion }) },
        { group: 'hush', label: 'mute color', icon: 'droplet', keywords: 'grayscale saturation images', active: !!settings.color, run: () => H.save({ color: !settings.color }) },
        { group: 'hush', label: 'hush something on this page', icon: 'mouse-pointer-click', keywords: 'hide element remove picker block this', toast: false, run: () => setTimeout(() => pick(false), 180) },
        {
          group: 'hush', label: 'image colour', icon: 'palette', keywords: 'saturation vibrance color slider soft thumbnails',
          choices: VIBRANCE.map((v) => v + '%'), value: nearestVibrance() + '%', toast: false,
          run: () => {
            const next = VIBRANCE[(VIBRANCE.indexOf(nearestVibrance()) + 1) % VIBRANCE.length];
            settings = { ...settings, vibrance: next };
            setVibrance(next);
            H.save({ vibrance: next });
          }
        },
        { group: 'hush', label: 'hush everywhere', icon: 'globe', keywords: 'master all sites global off', active: !!settings.enabled, run: () => H.save({ enabled: !settings.enabled }) }
      ];
      if (adapter) {
        const opts = H.siteOptions(settings, adapter);
        for (const opt of adapter.options || []) {
          const group = `${adapter.name.toLowerCase()} settings`;
          const icon = optionIcon(opt.key);
          if (opt.choices) {
            // choice: shows all values with the current one lit; running it cycles
            const next = H.nextChoice(opt, opts[opt.key]);
            cmds.push({
              group, icon, label: opt.label, hint: opt.hint, keywords: `${opt.keywords || ''} ${opt.choices.join(' ')}`,
              choices: opt.choices, value: opts[opt.key], toast: false,
              run: () => { ctx.setOption(opt.key, next); ctx.toast(`${opt.label}: ${next}`, true); }
            });
          } else {
            cmds.push({
              group, icon, label: opt.label, hint: opt.hint, keywords: opt.keywords,
              active: opts[opt.key], run: () => ctx.setOption(opt.key, !opts[opt.key])
            });
          }
        }
      }
      return cmds;
    });
    // what you've hushed here, each one a click from coming back
    H.palette.addProvider(() => {
      const list = rulesHere();
      const cmds = list.map((r) => ({
        group: 'hidden on this site', label: `show “${r.l}” again`, icon: 'eye', toast: false,
        keywords: 'unhide restore bring back hidden undo', run: () => { removeRule(r); H.toast('back on the page', true); }
      }));
      if (list.length > 1) {
        cmds.push({
          group: 'hidden on this site', label: `show everything I hid here (${list.length})`, icon: 'undo-2', toast: false,
          keywords: 'unhide restore all reset', run: () => { for (const r of [...list]) removeRule(r); H.toast('all back on the page', true); }
        });
      }
      return cmds;
    });
    // the quiet report, and the way out to full settings
    H.palette.addProvider(async () => {
      const cmds = [];
      try {
        const { quiet = {} } = await chrome.storage.local.get('quiet');
        const days = Array.from({ length: 7 }, (_, i) => {
          const k = new Date(Date.now() - (6 - i) * 864e5).toLocaleDateString('en-CA');
          return Object.values(quiet[k] || {}).reduce((a, b) => a + b, 0);
        });
        const total = days.reduce((a, b) => a + b, 0);
        const max = Math.max(1, ...days);
        const spark = days.map((n) => '▁▂▃▄▅▆▇█'[Math.min(7, Math.round((n / max) * 7))]).join('');
        cmds.push({
          group: 'this week', label: `${total.toLocaleString()} kept off your screen  ${spark}`, icon: 'chart-column', toast: false,
          keywords: 'week report quiet stats hidden count', run: () => send('hush:options', 'week')
        });
      } catch { /* no storage: skip the report */ }
      cmds.push(
        { group: 'this week', label: 'all settings', icon: 'settings', toast: false, keywords: 'options preferences popup more', run: () => send('hush:options') },
        { group: 'this week', label: 'support hush', icon: 'heart', toast: false, keywords: 'donate tip sponsor', run: () => send('hush:support') }
      );
      return cmds;
    });
    // adapters may define commands up front or attach them during setup()
    H.palette.addProvider((query) => (on && adapter && adapter.commands ? adapter.commands(ctx, query) : []));
  }

  window.addEventListener('keydown', (e) => {
    if (!on || !H.palette) return;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopImmediatePropagation();
      H.palette.toggle();
    }
  }, true);

  // ---- still motion: stop media that starts without the user asking ----
  const markInteraction = () => { lastInteraction = Date.now(); };
  for (const type of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(type, markInteraction, { capture: true, passive: true });
  }
  document.addEventListener('play', (e) => {
    if (!on || !settings.motion) return;
    const el = e.target;
    if (!(el instanceof HTMLMediaElement)) return;
    // adapters can whitelist the media you came for (e.g. YouTube's main player)
    if (adapter && adapter.allowMedia && adapter.allowMedia(el)) return;
    const userAsked =
      (navigator.userActivation && navigator.userActivation.isActive) ||
      Date.now() - lastInteraction < 1500;
    if (userAsked) {
      el.dataset.hushAllowed = '1';
      return;
    }
    if (el.dataset.hushAllowed) return; // user started it earlier; let it keep going
    el.pause();
  }, true);

  // ---- popup asks "how much did you hush here?" ----------------------------
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
      if (msg && msg.type === 'hush:pick') { pick(true); return; }
      if (msg && msg.type === 'hush:palette') { if (H.palette) H.palette.toggle(); return; }
      if (!msg || msg.type !== 'hush:stats') return;
      reply({
        on,
        adapter: adapter ? adapter.id : null,
        hidden: on ? document.querySelectorAll('[data-hush-hide]').length + (adapter && adapter.countHidden ? adapter.countHidden() : 0) : 0
      });
    });
  }

  // ---- the weekly quiet report: count what hush keeps off your screen ------
  // Each element is counted once per page view. Totals live in
  // chrome.storage.local by day and site, and never leave the browser.
  const seen = new WeakSet();
  let pending = 0;
  let adapterSeen = 0;
  function tally() {
    if (!on || document.hidden) return;
    const count = (list) => { for (const el of list) if (!seen.has(el)) { seen.add(el); pending++; } };
    count(document.querySelectorAll('[data-hush-hide]'));
    for (const s of userSel) { try { count(document.querySelectorAll(s)); } catch { /* skip */ } }
    if (adapter && adapter.countHidden) {
      const n = adapter.countHidden() || 0;
      if (n > adapterSeen) { pending += n - adapterSeen; adapterSeen = n; }
    }
  }
  let flushing = false;
  async function flush() {
    if (!pending || flushing || !chrome.storage || !chrome.storage.local) return;
    flushing = true;
    const n = pending;
    pending = 0;
    try {
      const day = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
      const { quiet = {} } = await chrome.storage.local.get('quiet');
      const d = (quiet[day] = quiet[day] || {});
      d[host] = (d[host] || 0) + n;
      const cutoff = new Date(Date.now() - 35 * 864e5).toLocaleDateString('en-CA');
      for (const k of Object.keys(quiet)) if (k < cutoff) delete quiet[k];
      await chrome.storage.local.set({ quiet });
    } catch { pending += n; }
    flushing = false;
  }
  setInterval(tally, 4000);
  setInterval(flush, 30000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { tally(); flush(); } });
  window.addEventListener('pagehide', () => { tally(); flush(); });

  // Optimistic: apply defaults right away so pages don't flash loud, then real settings.
  apply(H.DEFAULTS, false);
  // <head> isn't parsed yet at document_start; check page opt-outs again once it is
  document.addEventListener('DOMContentLoaded', () => apply(settings, false), { once: true });
  H.load().then((s) => apply(s, true));
  chrome.storage.onChanged.addListener(() => H.load().then((s) => apply(s, true)));
})();
