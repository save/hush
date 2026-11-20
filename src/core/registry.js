// hush — shared registry + settings. Loaded by content scripts, the popup and the background worker.
(() => {
  if (globalThis.Hush) return;

  const DEFAULTS = {
    enabled: true,        // master switch
    disabledSites: [],    // hostnames (without www.) where hush is off
    motion: true,         // still motion: no animations, no autoplay
    color: false,         // mute color: desaturate images & video
    universal: true,      // calm every site: ads, chat bubbles and nags go on sites without an adapter
    island: true,         // the top island: now playing in other tabs, timers and hush's notes
    notices: true,        // new messages and notifications from other tabs, shown in the island
    vibrance: 90,         // % of colour soft images keep (soft thumbnails / soft media)
    hidden: {},           // "hush this" rules: { [host]: [{ s: selector, l: label, t: time }] }
    muted: [],            // words and phrases: posts, videos and games that mention them are hidden
    nudge: 0,             // minutes per site per day between quiet time nudges (0 = off)
    sites: {}             // per-adapter options: { [adapterId]: { [optionKey]: boolean } }
  };

  const adapters = [];

  const Hush = {
    DEFAULTS,
    adapters,

    /**
     * Register a site adapter.
     * {
     *   id: 'x',                      // short id, used as data-hush-site value
     *   name: 'X',                    // display name
     *   match: (hostname) => bool,    // does this adapter own the page?
     *   options: [{ key, label, default }],
     *   setup(ctx) -> teardown fn     // optional JS layer (observers etc.)
     * }
     * The adapter's CSS ships via manifest content_scripts and must be scoped to
     * html[data-hush-site="<id>"] so it switches off instantly.
     */
    register(adapter) {
      adapters.push(adapter);
    },

    hostKey(hostname) {
      return String(hostname || '').replace(/^www\./, '');
    },

    adapterFor(hostname) {
      return adapters.find((a) => a.match(hostname)) || null;
    },

    // Settings live in chrome.storage.sync (follows you between computers) with a copy in
    // chrome.storage.local. Sync has hard limits (size, writes per minute and per hour); once
    // one is hit every sync save fails silently and hush could never be switched back on.
    // The local copy has no such limits and wins, so a change always sticks.
    async load() {
      const pick = (o) => { const out = {}; for (const k of Object.keys(DEFAULTS)) if (o && k in o) out[k] = o[k]; return out; };
      let synced = {}, local = {};
      try { synced = pick(await chrome.storage.sync.get(null)); } catch { /* sync unavailable */ }
      try { local = pick((await chrome.storage.local.get('hushSettings')).hushSettings); } catch { /* fine */ }
      return Hush.clean({ ...DEFAULTS, ...synced, ...local });
    },

    // repair anything malformed so one bad value can't leave hush stuck
    clean(s) {
      const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
      const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
      const out = { ...s };
      for (const k of ['enabled', 'motion', 'color', 'universal', 'island', 'notices']) if (typeof out[k] !== 'boolean') out[k] = DEFAULTS[k];
      out.disabledSites = arr(out.disabledSites);
      out.muted = arr(out.muted);
      out.hidden = obj(out.hidden);
      out.sites = { ...DEFAULTS.sites, ...obj(out.sites) };
      if (typeof out.vibrance !== 'number' || !isFinite(out.vibrance)) out.vibrance = DEFAULTS.vibrance;
      if (typeof out.nudge !== 'number' || !isFinite(out.nudge)) out.nudge = DEFAULTS.nudge;
      return out;
    },

    async save(patch) {
      // local first: it always works, and it's what load() trusts
      try {
        const cur = (await chrome.storage.local.get('hushSettings')).hushSettings || {};
        await chrome.storage.local.set({ hushSettings: { ...cur, ...patch } });
      } catch (e) { console.warn('[hush] local save', e); }
      try { await chrome.storage.sync.set(patch); } catch (e) { console.warn('[hush] sync save (kept locally)', e && e.message); }
    },

    // is this storage change about settings (not timers, time counts or the island's spot)?
    isSettingsChange(changes, area) {
      return area === 'sync' || (area === 'local' && 'hushSettings' in changes);
    },

    siteOptions(settings, adapter) {
      const saved = (settings.sites && settings.sites[adapter.id]) || {};
      const out = {};
      for (const opt of adapter.options || []) {
        if (opt.choices) {
          // choice options: { key, label, choices: ['words', 'icons', 'both'], default: 'words' }
          out[opt.key] = opt.choices.includes(saved[opt.key]) ? saved[opt.key] : opt.default;
        } else {
          out[opt.key] = opt.key in saved ? !!saved[opt.key] : !!opt.default;
        }
      }
      return out;
    },

    /** the value after `current` in a choice option, wrapping around */
    nextChoice(opt, current) {
      const i = opt.choices.indexOf(current);
      return opt.choices[(i + 1) % opt.choices.length];
    },

    /** "g h" / "ctrl k" / "⌘k" → <span class="hush-keys"><kbd>g</kbd><kbd>h</kbd></span> */
    keycaps(hint, doc = document) {
      const wrap = doc.createElement('span');
      wrap.className = 'hush-keys';
      const parts = String(hint || '').trim().split(/\s+/).flatMap((p) => (/^⌘./.test(p) ? ['⌘', p.slice(1)] : [p]));
      for (const p of parts) {
        if (!p) continue;
        const k = doc.createElement('kbd');
        k.className = 'hush-kbd';
        k.textContent = p === 'enter' ? '↵' : p === 'shift' ? '⇧' : p;
        wrap.append(k);
      }
      return wrap;
    },

    isMac: /Mac|iPhone|iPad/.test(globalThis.navigator ? navigator.platform : ''),

    /**
     * Take the shouting out of a title: leading [TAGS] and (TAGS), emoji,
     * "!!!" runs, and ALL CAPS. Mostly-caps titles become sentence case;
     * in normal titles only long all-caps words calm down (NASA, GPU stay).
     */
    calmTitle(text) {
      let s = String(text || '');
      const before = s;
      s = s.replace(/^\s*(?:(?:\[[^\]]{0,28}\]|\([^)]{0,16}\)|【[^】]{0,20}】)\s*)+/u, '');
      s = s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\u20E3]+/gu, ' ');
      s = s.replace(/([!?])[!?]+/g, '$1').replace(/\s{2,}/g, ' ').replace(/\s+([!?,.:])/g, '$1').trim();
      const letters = s.replace(/[^\p{L}]/gu, '');
      const caps = letters.replace(/[^\p{Lu}]/gu, '').length;
      if (letters.length >= 8 && caps / letters.length > 0.6) {
        s = s.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
        s = s.replace(/\bi\b/g, 'I');
      } else {
        s = s.replace(/\b(\p{Lu})(\p{Lu}{4,})\b/gu, (m, a, b) => a + b.toLowerCase());
      }
      return s || before;
    },

    /** muted words → one case-insensitive, whole-word RegExp (or null) */
    muteRegex(list) {
      const words = (list || []).map((w) => String(w).trim()).filter(Boolean);
      if (!words.length) return null;
      const alts = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, (c) => '\\' + c).replace(/\s+/g, '\\s+')).join('|');
      return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${alts})(?=$|[^\\p{L}\\p{N}])`, 'iu');
    },

    /**
     * Coalesce bursts of DOM changes into one pass: at most once per frame and
     * never more often than every `gap` ms. Sites like X mutate the DOM hundreds
     * of times a second while scrolling; this keeps hush off the hot path.
     */
    throttle(fn, gap = 150) {
      let queued = false;
      let last = 0;
      return function schedule() {
        if (queued) return;
        queued = true;
        const run = () => requestAnimationFrame(() => {
          queued = false;
          last = performance.now();
          fn();
        });
        const wait = gap - (performance.now() - last);
        if (wait > 0) setTimeout(run, wait); else run();
      };
    },

    isOn(settings, hostname) {
      return settings.enabled && !settings.disabledSites.includes(Hush.hostKey(hostname));
    }
  };

  globalThis.Hush = Hush;
})();
