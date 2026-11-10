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
