# Privacy

hush is built to be the quietest thing in your browser, and that includes data. Nothing you do leaves your browser: hush has no servers, no accounts and no analytics, and it never sends anything anywhere.

_Last updated: 21 November 2026 (hush 0.6.7)._

## What hush stores, and where

Everything stays in your own browser's extension storage.

- **Your settings:** which sites hush is on for, your options, words you mute and elements you chose to hide. They're saved in `chrome.storage.sync`, so they follow you between your own signed-in Chrome browsers (Google syncs this as part of your Chrome profile), with a copy in `chrome.storage.local` on this device.
- **Weekly counts** for the quiet report: how many things were hidden, and how long you spent on each site while hush was on, per day. These stay in `chrome.storage.local` on this device; anything older than five weeks is deleted.
- **The dynamic island's state:** a timer you started and where you dragged the island, in `chrome.storage.local`.
- **Your Roblox theme** (light or dark), in that site's own local storage, so pages don't flash the wrong colour while they load.

## What hush reads on pages, and why

To calm a page, hush has to look at it. All of this happens on your device, in the moment, and is never stored or sent anywhere:

- **Page layout and text** on the sites you visit, to hide promotions and clutter, apply muted words, and rewrite shouty titles.
- **What's playing** in your tabs (title, artist, artwork and position, from the page or from the browser's media controls), so the dynamic island can show it and let you pause or skip. It's passed between your own tabs inside the browser and kept only in memory.
- **Unread counts and new-message previews** that sites already show you (X, YouTube, Roblox, GitHub, Reddit and Discord), so the island can show a notification and take you there when you click it. On Discord, hush listens for the desktop notifications Discord itself creates. Nothing is fetched: hush only reads what the page already displays, and keeps it only in memory.

## What hush does not do

- No analytics, telemetry or crash reporting.
- No servers. hush never makes a network request of its own.
- No selling, sharing or transferring of any data, to anyone.
- No logging of what you browse, type, watch or read.
- No ads, sponsored content or affiliate links, injected or otherwise.
- No remote code: everything hush runs ships inside the extension.

## Permissions

| Permission | Why |
| :-- | :-- |
| `storage` | Save your settings, the weekly counts and the island's timer. |
| `activeTab` | Let the toolbar button and popup act on the site you're looking at. |
| `favicon` | Show site icons in the popup. |
| `contextMenus` | The right-click **hush this** item for hiding an element. |
| Access to all sites | Apply the calm layer, your hidden elements and muted words, and the dynamic island on the sites you visit. |

## Questions

Open an issue at https://github.com/save/hush/issues.
