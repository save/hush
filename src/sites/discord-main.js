// hush — Discord, page side (runs in the page's own world, before Discord's code).
//
// Discord tells you about a new message with the browser's Notification API. This stands in
// for it so hush can show the message in the top island instead, on whatever tab you're on:
//   - each notification Discord makes is handed to hush (notices.js) as { id, title, body };
//   - the object is kept, so clicking the island's banner fires Discord's own onclick, and
//     Discord opens that conversation;
//   - while hush's island notifications are on for Discord, Discord is told notifications
//     are allowed and the system pop-up is skipped, unless no tab could show the banner, in
//     which case the real one shows (only if you had allowed it).
// With hush off for Discord, everything passes straight through to the real API.
(() => {
  if (window.__hushDiscord) return;
  window.__hushDiscord = true;

  const Real = window.Notification;
  if (typeof Real !== 'function') return;
  const ORIGIN = location.origin;
  let on = false; // set by the isolated world (notices.js): hush + island + notifications on here
  const kept = new Map(); // id → stand-in, so a click can find it later
  const waiting = new Map(); // id → fallback for when no island showed it
  let seq = 0;

  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== ORIGIN || !e.data || typeof e.data.__hush !== 'string') return;
    const d = e.data;
    if (d.__hush === 'dc-on') on = !!d.on;
    if (d.__hush === 'dc-shown') {
      const fallback = waiting.get(d.id);
      waiting.delete(d.id);
      if (fallback && !d.shown) fallback();
    }
    if (d.__hush === 'dc-click') {
      const n = kept.get(d.id);
      if (n) n._fire('click');
    }
  });

  function realOne(title, opts, owner) {
    if (Real.permission !== 'granted') return null;
    try {
      const r = new Real(title, opts);
      r.onclick = () => owner._fire('click');
      r.onclose = () => owner._fire('close');
      return r;
    } catch { return null; }
  }

  class HushNotification extends EventTarget {
    constructor(title, opts = {}) {
      super();
      this.title = String(title == null ? '' : title);
      this.body = String(opts.body || '');
      this.icon = String(opts.icon || '');
      this.tag = String(opts.tag || '');
      this.data = opts.data;
      this.silent = !!opts.silent;
      this.onclick = this.onclose = this.onshow = this.onerror = null;
      this._real = null;
      if (!on) {
        // hush isn't taking these: behave exactly like the real thing
        this._real = realOne(this.title, opts, this);
        return;
      }
      const id = ++seq;
      kept.set(id, this);
      if (kept.size > 40) kept.delete(kept.keys().next().value);
      waiting.set(id, () => { this._real = realOne(this.title, opts, this); });
      // nobody answered in time: let the real one through
      setTimeout(() => { const f = waiting.get(id); if (f) { waiting.delete(id); f(); } }, 1500);
      window.postMessage({ __hush: 'dc-notice', id, title: this.title, body: this.body }, ORIGIN);
      setTimeout(() => this._fire('show'), 0);
    }
    _fire(type) {
      const ev = new Event(type);
      try { if (typeof this['on' + type] === 'function') this['on' + type](ev); } catch (err) { console.warn('[hush] discord', type, err); }
      this.dispatchEvent(ev);
    }
    close() { if (this._real) this._real.close(); this._fire('close'); }
    static get permission() { return on ? 'granted' : Real.permission; }
    static requestPermission(cb) {
      if (!on) return Real.requestPermission(cb);
      if (typeof cb === 'function') cb('granted');
      return Promise.resolve('granted');
    }
    static get maxActions() { return Real.maxActions || 0; }
  }
  window.Notification = HushNotification;
  // whichever side loads first, ask the other whether hush is taking notifications here
  window.postMessage({ __hush: 'dc-hello' }, ORIGIN);

  // some builds go through the service worker instead: hand those over too (clicks there
  // belong to the worker, so these only show, and open the tab when clicked)
  const SWR = window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype;
  if (SWR && SWR.showNotification) {
    const show = SWR.showNotification;
    SWR.showNotification = function (title, opts = {}) {
      if (!on) return show.call(this, title, opts);
      const id = ++seq;
      waiting.set(id, () => { if (Real.permission === 'granted') show.call(this, title, opts).catch(() => {}); });
      setTimeout(() => { const f = waiting.get(id); if (f) { waiting.delete(id); f(); } }, 1500);
      window.postMessage({ __hush: 'dc-notice', id, title: String(title || ''), body: String(opts.body || '') }, ORIGIN);
      return Promise.resolve();
    };
  }
})();
