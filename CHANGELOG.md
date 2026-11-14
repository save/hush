# Changelog

## Unreleased

- **Brave:** the homepage recognises Brave (and Edge, Opera): the button says "Add to Brave" and the install steps give `brave://extensions`. The README notes that hush and Shields work side by side.

## 0.6.0

- **Easy install:** each release ships one `hush.zip`; the homepage walks you through the three steps (download, open extensions, load), with the right extensions address for your browser. `npm run pack` builds the zip.
- **GitHub, tighter:** the Copilot button in the header and the Agents tab go with "hide Copilot"; the languages bar, contribution activity bar and selected year turn grey.
- **Homepage:** GitHub joins the before / after demo.
- **GitHub (new):** Primer's tokens remapped to hush's palette in light and dark, following GitHub's own theme; no Copilot nudges or app banner; a quiet repo sidebar (about, releases, languages); grey contribution graph and language colours; no achievement badges; a calmer dashboard; READMEs at a readable width; pages and file rows fade in. `Ctrl K` gets GitHub pages, repo sections and search.
- **Reddit (new, untested live):** ads and promoted posts gone; no app, Premium or advertise links; no awards; a quiet menu without games or Reddit Answers; no "recent posts" column on home; votes in greys; outlined flairs; calm titles; mute words; posts settle in. `Ctrl K` gets Reddit pages, community sorts and search.
- **Calm every site (universal mode, on by default):** on sites without an adapter, display ads and link farms, chat bubbles and notification nags go; empty ad boxes collapse; "subscribe / membership / newsletter" pop-ups are hidden in the first minute of a visit and the page can scroll again.
- **Arriving:** every site fades in when it loads.
- **YouTube:** Subscriptions fold to seven with Show all / Show fewer; a grey logo; like, dislike, share and save as ghost buttons; cinema dim (the page darkens around a playing video, anything you point at comes back). hush's own animations now run with still motion on, as they were meant to.
- **X:** fixed the bookmarks link flickering in and out.
- **YouTube, sleeker:** lighter type in a single quiet font, a frosted header with one seamless search pill (the bell and Create stay, a count becomes a dot), slim sidebar rows, outlined chips, a centred column of rounded thumbnails that zoom gently on hover, titles on two lines with views and dates kept, a slim channel banner, and motion throughout: pages fade up on navigation, cards settle in, menus and chips ease.
- **YouTube, rebuilt from scratch** to match Roblox and X: a sidebar that works expanded (icon + word rows, a soft pill for the current page) and collapsed (a tight rail), pill chips, Home with a quiet greeting, three videos to a row, search as one calm list, a calmer watch page (small up-next thumbnails, a soft description card, no New badges, no doodle logo), quieter channel pages and soft menus. The old 1,400-line stylesheet of layered overrides is now one 700-line file.
- **Mute words:** hide posts (X), videos (YouTube) and games (Roblox) that mention words or phrases you choose. Type `mute …` in `Ctrl K`, or add them in settings.
- **Calm titles:** YouTube and Roblox titles lose ALL CAPS, leading [TAGS], emoji and "!!!". The original is in the tooltip. On by default, per site.
- **Time nudges:** optional quiet toasts after 20, 45 or 90 minutes on a site each day; time per site in the weekly report.
- **Roblox:** a plainer layout. Normal-case menu and header with a soft pill for the current page, a wide pill search, Home with a quiet greeting under it, sentence-case section titles, bigger tiles. The Robux balance and app download button go; the plain Robux link stays.
- **YouTube:** three big videos to a row, a 76px rail (home, subscriptions, history), one pill search, pill chips and duration badges, the colour logo back. Each video shows its title and channel only. Create, notifications and voice search go.

## 0.5.0

- **Hush this:** right-click any element and hide it for good, with undo and a list in the popup to bring things back.
- **Weekly quiet report:** a Week tab in the popup with this week's total, a seven-day chart and the top sites. Counted on your device only.
- New app icon.
- Pages can opt out of still motion with `<meta name="hush" content="allow-motion">`.

## 0.4.0

- The popup rebuilt with React, shadcn/ui and Tailwind v4.
- Menu style (words, icons or both) for every sidebar, with **both** as the default.
- Image colour slider for soft thumbnails and soft media.
- Roblox: two-pane communities and portrait profiles.
- Support page.

## 0.3.0

- Roblox adapter.

## 0.2.0

- X and YouTube adapters, the `Ctrl K` palette, toasts and still motion.
