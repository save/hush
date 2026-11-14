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

  const NUDGES = [0, 20, 45, 90];
  const nudgeLabel = (n) => (n ? `${n} min` : 'off');

  // ---- mute words + calm titles: one throttled pass over the page --------
  let muteRe = null;
  let muteSig = null;
  function muteScan(force) {
    if (!adapter || !adapter.mute) return;
    const sig = JSON.stringify(settings.muted || []);
    if (force || sig !== muteSig) {
      muteSig = sig;
      muteRe = H.muteRegex(settings.muted);
      document.querySelectorAll('[data-hush-mchk]').forEach((el) => el.removeAttribute('data-hush-mchk'));
      document.querySelectorAll('[data-hush-muted]').forEach((el) => el.removeAttribute('data-hush-muted'));
    }
    if (!muteRe) return;
    for (const item of document.querySelectorAll(adapter.mute.items)) {
      // text node by text node, so "Steal An Egg" + "91% Rating" doesn't read as "Egg91"
      const parts = [];
      const walk = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.nodeValue.trim()) parts.push(n.nodeValue);
      const text = parts.join(' ');
      const key = String(text.length);
      if (item.dataset.hushMchk === key) continue;
      item.dataset.hushMchk = key;
      const target = (adapter.mute.target && adapter.mute.target(item)) || item;
      if (muteRe.test(text)) target.setAttribute('data-hush-muted', '');
      else if (target === item) target.removeAttribute('data-hush-muted');
    }
  }
  function leafOf(el) {
    if (!el.childElementCount) return el;
    for (const d of el.querySelectorAll('*')) if (!d.childElementCount && (d.textContent || '').trim()) return d;
    return el;
  }
  let calmWasOn = false;
  function calmScan() {
    if (!adapter || !adapter.titles) return;
    const want = on && !!H.siteOptions(settings, adapter).calmtitles;
    if (!want) {
      if (calmWasOn) {
        for (const el of document.querySelectorAll('[data-hush-orig]')) { el.textContent = el.dataset.hushOrig; delete el.dataset.hushOrig; delete el.dataset.hushCalm; }
        calmWasOn = false;
      }
      return;
    }
    calmWasOn = true;
    for (const t of document.querySelectorAll(adapter.titles)) {
      const leaf = leafOf(t);
      const cur = leaf.textContent || '';
      if (leaf.dataset.hushCalm === cur) continue;
      const calm = H.calmTitle(cur);
      if (calm !== cur) {
        leaf.dataset.hushOrig = cur;
        if (!t.getAttribute('title')) t.setAttribute('title', cur.trim());
        leaf.textContent = calm;
      }
      leaf.dataset.hushCalm = calm;
    }
  }
  // ---- universal: tidy up after hidden ads, and quiet "subscribe!" pop-ups ----
  const AD_SEL = 'ins.adsbygoogle, [id^="div-gpt-ad"], [id^="google_ads_iframe"], iframe[src*="doubleclick.net"], iframe[src*="googlesyndication.com"], [data-google-query-id], amp-ad, [id^="taboola-"], .OUTBRAIN';
  const NAG = /\b(subscribe|subscription|newsletter|membership|become a member|sign up|join (us|now|today)|unlock|special offer|limited time|don.?t miss|get the app|turn on notifications)\b/i;
  const nagSeenAt = Date.now();
  function universalScan() {
    if (adapter || settings.universal === false) return;
    // a box that only ever held an ad keeps its reserved height: fold it away
    for (const ad of document.querySelectorAll(AD_SEL)) {
      let el = ad.parentElement;
      for (let i = 0; i < 3 && el && el !== document.body; i++, el = el.parentElement) {
        if (el.hasAttribute('data-hush-hide')) break;
        const kids = [...el.children].filter((k) => !/^(SCRIPT|STYLE|NOSCRIPT)$/.test(k.tagName));
        const onlyAds = kids.length > 0 && kids.every((k) => k.matches(AD_SEL) || k.querySelector(AD_SEL) || !(k.textContent || '').trim());
        if (!onlyAds || (el.textContent || '').trim().length > 40) break;
        el.setAttribute('data-hush-hide', '');
      }
    }
    // pop-ups that cover the page to sell something, in the first minute of a visit
    if (Date.now() - nagSeenAt > 60000) return;
    for (const el of document.body ? document.body.querySelectorAll(':scope > *, [role="dialog"], [aria-modal="true"], [class*="modal" i], [class*="popup" i], [class*="overlay" i]') : []) {
      if (el.hasAttribute('data-hush-nag') || el.closest('hush-ui, hush-picker')) continue;
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' || cs.display === 'none' || +cs.zIndex < 10) continue;
      const r = el.getBoundingClientRect();
      if (r.width < innerWidth * 0.3 || r.height < innerHeight * 0.25) continue;
      const text = (el.innerText || '').slice(0, 600);
      if (!NAG.test(text) || el.querySelector('input[type="password"]')) continue;
      el.setAttribute('data-hush-nag', '');
      el.setAttribute('data-hush-hide', '');
    }
    // and if one of them froze the page, let it scroll again
    if (document.querySelector('[data-hush-nag]')) {
      for (const n of [document.documentElement, document.body]) {
        if (n && getComputedStyle(n).overflowY === 'hidden') n.style.setProperty('overflow', 'auto', 'important');
      }
    }
  }

  const pageScan = H.throttle(() => {
    if (!on) return;
    try { muteScan(false); } catch (e) { console.warn('[hush] mute', e); }
    try { calmScan(); } catch (e) { console.warn('[hush] titles', e); }
    try { universalScan(); } catch (e) { console.warn('[hush] universal', e); }
  }, 250);
  new MutationObserver(pageScan).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  // ---- time on site: counted while the tab is visible and focused --------
  let activeSecs = 0;
  setInterval(() => { if (on && !document.hidden && document.hasFocus()) activeSecs += 15; }, 15000);
  const fmtTime = (s) => { const m = Math.round(s / 60); return m < 60 ? `${m} minutes` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim(); };
  async function flushTime() {
    if (!activeSecs || !chrome.storage || !chrome.storage.local) return;
    const add = activeSecs;
    activeSecs = 0;
    try {
      const day = new Date().toLocaleDateString('en-CA');
      const { time = {} } = await chrome.storage.local.get('time');
      const d = (time[day] = time[day] || {});
      d[host] = (d[host] || 0) + add;
      const cutoff = new Date(Date.now() - 35 * 864e5).toLocaleDateString('en-CA');
      for (const k of Object.keys(time)) if (k !== '_nudged' && k < cutoff) delete time[k];
      // a quiet nudge each time you pass another interval on this site today
      const every = +settings.nudge || 0;
      if (every > 0 && on) {
        const step = Math.floor(d[host] / 60 / every);
        const nk = `${day}|${host}`;
        const nudged = (time._nudged = time._nudged || {});
        for (const k of Object.keys(nudged)) if (!k.startsWith(day)) delete nudged[k];
        if (step > (nudged[nk] || 0)) {
          nudged[nk] = step;
          if (H.toast) H.toast(`${fmtTime(d[host])} on ${host} today`, false);
        }
      }
      await chrome.storage.local.set({ time });
    } catch { activeSecs += add; }
  }
  setInterval(flushTime, 30000);
  window.addEventListener('pagehide', flushTime);

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
    // universal: the calm layer's declutter, only where no adapter takes care of the site
    setFlag('data-hush-universal', on && !adapter && settings.universal !== false);
    setVibrance(settings.vibrance);
    setRules(rulesHere());
    if (typeof pageScan === 'function') pageScan();

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
        { group: 'hush', label: 'calm every site', icon: 'globe', keywords: 'universal ads chat widgets popups declutter all sites', active: settings.universal !== false, run: () => H.save({ universal: settings.universal === false }) },
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
        { group: 'hush', label: 'hush everywhere', icon: 'globe', keywords: 'master all sites global off', active: !!settings.enabled, run: () => H.save({ enabled: !settings.enabled }) },
        {
          group: 'hush', label: 'time nudges', icon: 'clock', keywords: 'time limit reminder minutes break screen time',
          choices: NUDGES.map(nudgeLabel), value: nudgeLabel(+settings.nudge || 0), toast: false,
          run: () => {
            const i = NUDGES.indexOf(+settings.nudge || 0);
            const next = NUDGES[(i + 1) % NUDGES.length];
            settings = { ...settings, nudge: next };
            H.save({ nudge: next });
          }
        }
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
    // mute words: type "mute crypto", or anything, and mute it
    H.palette.addProvider((query) => {
      const q = (query || '').trim();
      if (!q) return [];
      const list = settings.muted || [];
      const cmds = list.map((w) => ({
        group: 'muted words', label: `unmute “${w}”`, icon: 'eye', toast: false, keywords: 'mute muted words filter unmute topic',
        run: () => { const muted = list.filter((x) => x !== w); settings = { ...settings, muted }; H.save({ muted }); H.toast(`unmuted “${w}”`, true); }
      }));
      const word = q.replace(/^mute\s+/i, '').trim();
      if (word.length >= 2 && !/^(un)?mute\b/i.test(word) && !/^unmute\b/i.test(q) && !list.some((w) => w.toLowerCase() === word.toLowerCase())) {
        cmds.push({
          group: 'mute', label: `mute “${word}”`, icon: 'message-square-off', always: true, toast: false,
          run: () => {
            const muted = [...list, word];
            settings = { ...settings, muted };
            H.save({ muted });
            muteScan(true);
            const n = document.querySelectorAll('[data-hush-muted]').length;
            H.toast(n ? `muted “${word}” · ${n} hidden here` : `muted “${word}”`, true);
          }
        });
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
    count(document.querySelectorAll('[data-hush-hide], [data-hush-muted]'));
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
  document.addEventListener('visibilitychange', () => { if (document.hidden) { tally(); flush(); flushTime(); } });
  window.addEventListener('pagehide', () => { tally(); flush(); });

  // Optimistic: apply defaults right away so pages don't flash loud, then real settings.
  apply(H.DEFAULTS, false);
  // <head> isn't parsed yet at document_start; check page opt-outs again once it is
  document.addEventListener('DOMContentLoaded', () => apply(settings, false), { once: true });
  H.load().then((s) => apply(s, true));
  chrome.storage.onChanged.addListener(() => H.load().then((s) => apply(s, true)));
})();
