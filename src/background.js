// hush — background worker: keyboard shortcut to toggle the current site.
importScripts('core/registry.js');

chrome.commands.onCommand.addListener(async (command, tab) => {
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
