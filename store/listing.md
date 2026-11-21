# Chrome Web Store listing: hush

## Package
Upload `release/hush-store.zip` (manifest.json at the zip root). Build it with `npm run pack`.

## Store listing

**Name:** hush (from the manifest)

**Summary** (from the manifest, 87 characters):
Turn the volume down on the web. Calm, minimal versions of the sites you use every day.

**Category:** Productivity → Tools (or Workflow & Planning)

**Language:** English

**Description:**

The web is loud. hush turns it down.

hush is a free, open-source extension that strips the promos, upsells, badges and noise from the sites you use most, and rebuilds them in one calm, consistent design. No ads, no tracking, no account.

TAILORED FOR
• X: no promoted posts, Premium nags or "Who to follow"; one quiet column and a word menu.
• YouTube: no Shorts or clutter; a calm 3×3 grid, softer thumbnails, sentence-case titles.
• Roblox: Roblox's own layout made quieter; a cleaner chat, calmer profiles, no Robux upsells.
• GitHub: Copilot nudges and upsells gone; a calmer palette in light and dark.
• Reddit: no ads, promoted posts, awards or games; votes in greys.
• Discord: Nitro, Shop and Quests out of the way; a calm palette.
• Every other site: ads, chat bubbles and "subscribe!" pop-ups go.

FOCUS MODE
Press Z and the page becomes just the content. The site's menu turns into a small floating island at the bottom of the screen.

A DYNAMIC ISLAND FOR YOUR BROWSER
A little black pill at the top of the page that only shows up when something's happening:
• Now playing from any tab (Spotify, YouTube, SoundCloud and more), with play, pause and skip.
• New messages and notifications from your other tabs, from Roblox, X, YouTube, GitHub, Reddit and Discord. Click to jump straight there.
• Timers: type "timer 25 study" in Ctrl K.
It finds a gap in each site's header so it never sits on a search box, and you can drag it anywhere.

CTRL K FOR EVERYTHING
Mute a word everywhere, hide anything on a page, flip any setting, start a timer, or jump to a page.

ALSO
• Calm titles: no ALL CAPS, emoji or "!!!".
• Still motion: nothing autoplays or animates until you ask.
• Soft colour: images sit back until you point at them.
• Quiet time nudges, if you want them.

PRIVATE BY DESIGN
hush has no servers and never sends anything anywhere. Your settings stay in your browser. Open source: https://github.com/save/hush

**Homepage URL:** https://save.github.io/hush/
**Support URL:** https://github.com/save/hush/issues

**Graphics** (all in `store/`):
- Store icon: `icons/icon-128.png` (128×128)
- Screenshots (1280×800): `screenshot-1-x.png`, `screenshot-2-island.png`, `screenshot-3-yt.png`, `screenshot-4-rbx.png`, `screenshot-5-gh.png`
- Small promo tile (440×280): `promo-small-440x280.png`
- Marquee promo tile (1400×560): `promo-marquee-1400x560.png`

## Privacy practices

**Single purpose:**
hush makes the websites you use calmer: it removes promotions, upsells and clutter, gives supported sites a quieter design, and shows what's happening in your other tabs (music, messages, timers) in one small on-page island.

**Permission justifications:**
- storage: Saves the user's hush settings (which sites it's on, options, muted words, hidden elements) and on-device weekly counts.
- activeTab: Lets the toolbar button open hush's command palette on, and act on, the page the user is looking at.
- favicon: Shows each site's icon next to it in hush's settings popup.
- contextMenus: Adds the right-click "hush this" item that hides the element the user clicked.
- Host permission (all sites, via content scripts): hush's purpose is to calm the pages the user visits. It needs to run on those pages to hide clutter, apply muted words and the user's hidden elements, and draw its on-page island. It never sends page content anywhere.

**Remote code:** No, I am not using remote code. All code ships in the package.

**Data usage:** collects none of the listed data types. (Settings stay in the user's own browser storage; page content is read on the device only and never stored or transmitted.)

Certify all three:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/save/hush/blob/main/PRIVACY.md

## Distribution
Free · Public · All regions
