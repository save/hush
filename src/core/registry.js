// hush — shared registry + settings. Loaded by content scripts, the popup and the background worker.
(() => {
  if (globalThis.Hush) return;

  const DEFAULTS = {
    enabled: true,        // master switch
    disabledSites: [],    // hostnames (without www.) where hush is off
    motion: true,         // still motion: no animations, no autoplay
    color: false,         // mute color: desaturate images & video
    vibrance: 90,         // % of colour soft images keep (soft thumbnails / soft media)
    hidden: {},           // "hush this" rules: { [host]: [{ s: selector, l: label, t: time }] }
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

    async load() {
      try {
        const stored = await chrome.storage.sync.get(null);
        return { ...DEFAULTS, ...stored, sites: { ...DEFAULTS.sites, ...(stored.sites || {}) } };
      } catch {
        return { ...DEFAULTS };
      }
    },

    save(patch) {
      return chrome.storage.sync.set(patch);
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
