// hush — background worker: keyboard shortcut to toggle the current site.
importScripts('core/registry.js');

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-island') {
    const s = await Hush.load();
    await Hush.save({ island: s.island === false });
    return;
  }
  if (command !== 'toggle-site' || !tab || !tab.url) return;
  let host;
  try {
    host = Hush.hostKey(new URL(tab.url).hostname);
  } catch {
    return;
  }
  if (!host) return;
  const s = await Hush.load();
  const off = new Set(s.disabledSites);
  if (off.has(host)) off.delete(host);
  else off.add(host);
  await Hush.save({ disabledSites: [...off] });
});

// The toolbar button opens the palette on the page. Pages hush can't run on
// (chrome://, the Web Store, tabs opened before install) get the settings popup.
const POPUP = 'build/popup/index.html';
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'hush:palette' }, { frameId: 0 });
  } catch {
    await chrome.action.setPopup({ tabId: tab.id, popup: POPUP });
    try { await chrome.action.openPopup(); } catch { /* the next click opens it */ }
  }
});
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading') chrome.action.setPopup({ tabId, popup: '' }).catch(() => {});
});
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg) return;
  if (msg.type === 'hush:options') openSettings(sender.tab, msg.view);
  if (msg.type === 'hush:support') chrome.tabs.create({ url: chrome.runtime.getURL('build/popup/support.html') });
});

async function openSettings(tab, view) {
  const q = new URLSearchParams();
  if (view) q.set('view', view);
  if (tab && tab.id != null) {
    const popup = POPUP + (view ? '?' + q : '');
    try {
      await chrome.action.setPopup({ tabId: tab.id, popup });
      await chrome.action.openPopup({ windowId: tab.windowId });
      setTimeout(() => chrome.action.setPopup({ tabId: tab.id, popup: '' }).catch(() => {}), 1500);
      return;
    } catch {
      chrome.action.setPopup({ tabId: tab.id, popup: '' }).catch(() => {});
      q.set('tab', String(tab.id));
    }
  }
  chrome.tabs.create({ url: chrome.runtime.getURL(POPUP + '?' + q) });
}

// "hush this" in the right-click menu: the page's content script opens the picker
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'hush-this',
    title: 'hush this',
    contexts: ['page', 'selection', 'link', 'image', 'video'],
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'hush-this' || !tab || tab.id == null) return;
  chrome.tabs.sendMessage(tab.id, { type: 'hush:pick' }, { frameId: 0 }).catch(() => {});
});

// ---- the top island: what's playing in other tabs ------------------------------------
// Each tab's content script reports its media (src/core/live.js); the active tab is told
// about the best one playing elsewhere, and can send play / pause / skip back to it.
// Kept in memory only: nothing about what you play is stored or sent anywhere.
const media = new Map(); // tabId → { state, at, windowId }

function bestMedia(exceptTabId) {
  let best = null;
  // the tab you're on is playing: only something else that's also playing is worth showing
  const own = media.get(exceptTabId);
  const ownPlaying = !!(own && own.state.playing);
  for (const [tabId, m] of media) {
    if (tabId === exceptTabId) continue;
    const s = m.state;
    if (ownPlaying && !s.playing) continue;
    // playing beats paused; among equals, the most recently changed
    const score = (s.playing ? 2e13 : 0) + (s.changedAt || m.at);
    if (!best || score > best.score) best = { score, tabId, ...s };
  }
  if (!best) return null;
  // a paused player fades from the island after 15 minutes
  if (!best.playing && Date.now() - (best.changedAt || 0) > 15 * 60 * 1000) return null;
  delete best.score;
  return best;
}

async function pushLive(target) {
  const tabs = target ? [target] : await chrome.tabs.query({ active: true });
  for (const t of tabs) {
    if (!t || t.id == null) continue;
    chrome.tabs.sendMessage(t.id, { type: 'hush:live', media: bestMedia(t.id) }, { frameId: 0 }).catch(() => {});
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !sender.tab) return;
  const tabId = sender.tab.id;
  if (msg.type === 'hush:media') {
    if (msg.state && msg.state.title) media.set(tabId, { state: { ...msg.state, site: sender.tab.url ? new URL(sender.tab.url).hostname : '', favicon: sender.tab.favIconUrl || '' }, at: Date.now(), windowId: sender.tab.windowId });
    else media.delete(tabId);
    pushLive();
  }
  if (msg.type === 'hush:live?') pushLive(sender.tab);
  if (msg.type === 'hush:media-cmd' && typeof msg.tabId === 'number') {
    if (msg.action === 'focus') {
      const m = media.get(msg.tabId);
      chrome.tabs.update(msg.tabId, { active: true }).catch(() => {});
      if (m) chrome.windows.update(m.windowId, { focused: true }).catch(() => {});
    } else {
      chrome.tabs.sendMessage(msg.tabId, { type: 'hush:media-do', action: msg.action }, { frameId: 0 }).catch(() => {});
    }
  }
});
chrome.tabs.onRemoved.addListener((tabId) => { if (media.delete(tabId)) pushLive(); });

// ---- notifications: a count went up in some tab (src/core/notices.js) ------------------
// Shown in the island of the tab you're looking at; two tabs of one site say it once.
const recentNotices = new Map(); // host|key|body → time
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !sender.tab) return;
  if (msg.type === 'hush:notice' && msg.notice) {
    const n = msg.notice;
    const sig = `${n.host}|${n.key}|${n.body}`;
    const now = Date.now();
    for (const [k, t] of recentNotices) if (now - t > 20000) recentNotices.delete(k);
    if (recentNotices.has(sig)) return;
    recentNotices.set(sig, now);
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([t]) => {
      if (!t || t.id == null) return;
      chrome.tabs.sendMessage(t.id, { type: 'hush:notice-show', notice: { ...n, tabId: sender.tab.id, windowId: sender.tab.windowId } }, { frameId: 0 }).catch(() => {});
    }).catch(() => {});
  }
  if (msg.type === 'hush:notice-open' && typeof msg.tabId === 'number') {
    chrome.tabs.update(msg.tabId, { active: true }).then((t) => chrome.windows.update(t.windowId, { focused: true })).catch(() => {});
  }
});
chrome.tabs.onActivated.addListener(({ tabId }) => chrome.tabs.get(tabId).then((t) => pushLive(t)).catch(() => {}));
chrome.windows.onFocusChanged.addListener(() => pushLive());
