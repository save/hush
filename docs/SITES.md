# What hush does, site by site

> The short version is in the [README](../README.md). This is everything, for the curious.

## What hush does on X

- **Removes:** right sidebar (trends, who to follow, premium, news); Grok, Premium, Creator Studio, Follow, Calls, Ads, Spaces in menus; ads and "who to follow", "you might like", "today's news" modules; the endless "discover more" feed under posts; "You aren't verified yet" and other upsell cards; Explore event ads; view counts.
- **Rewrites:** the menu as lowercase words with unread counts, key caps and an active dot; post actions as words (`reply 1.4K · repost · • liked 31K · keep · share`); X's blue → neutral; separators → hairlines; the modal overlay → plain dark blur; the reply box → `> post your reply`.
- **Motion:** liking, reposting or keeping pops a small dot with a ring and settles the label; dialogs and menus ease in; menu labels nudge on hover.
- **Layout:** posts get more room; photos, video posters and link cards are softened until you point at them (option: soft media); big link previews are capped at 280px; quote posts sit in a quieter inset; profiles get a short faded banner and a smaller avatar.
- **Scroll check-ins (option):** every 50 posts scrolled on home, a quiet toast ("50 posts in · still worth it?"). A nudge, never a wall.
- **Inbox:** X's chat is a separate app inside a shadow root. hush remaps its design tokens (type, colors, bubbles) so it matches.
- Chat and settings keep X's two-pane layout and just get quieter.

## What hush does on YouTube

- **Removes:** ads in feeds, search and sidebars; home shelves (news, "explore more topics"); Shorts everywhere, and Shorts links open in the normal player; hover previews; end-screen walls, cards, watermarks, pause overlays; Shop / Clip / Thanks / Join; shopping and merch shelves; live chat (option); trending/music/gaming sections in the guide.
- **Rewrites:** YouTube's theme tokens to hush's palette; logo monochrome; the guide as lowercase words with an active dot; chips, tabs and badges quiet; progress bar neutral; subscribe outlined; channel banners faded until hovered.
- **Layout:** home greets you and becomes one centred column, four videos per row with air between them; it shows three rows, then a quiet **show more**, and stops the endless loader (option: calm home feed). Search results are a compact list with smaller thumbnails. Up next shows eight, the rest behind **more**. Comments fold behind **show comments** (option). Thumbnails are softened until you point at them (option).
- **Options:** hide recommendations, hide comments, fold comments, hide live chat, hide shorts, calm home feed, soft thumbnails, focus mode.
- The video you opened still autoplays with "still motion" on; previews never do.

## What hush does on Roblox

- **Removes:** Roblox Plus, Newsroom, Official Store and gift-card links in the menu; the "more fun for less Robux" card; "Buy Robux" buttons; "games you're missing" (age-check upsell), "standout" and sponsored rows on home; the avatar editor's marketplace upsell; the footer; the chat bar (option).
- **Calms the layout:**
  - one centred column (max 1180px) with real margins, and a slimmer 224px menu.
  - home greets you ("good evening") instead of shouting "Home".
  - repeated "recommended for you" titles merge into one.
  - the endless feed stops after three rows with a quiet **show more** (option: calm home feed).
  - game pages: events become a compact list instead of posters; the description folds to a few lines with **more**; stats are a quiet label-over-value grid; badges are compact rows, three until you ask for all.
  - soft thumbnails (option, on): images sit at lower saturation and come to full colour when you point at them.
  - communities: a two-pane, with your list in a sticky column beside the community (Roblox's fixed panel used to land on top of it); smaller avatar, quiet stat pills, tabs sized to their words, empty sections as a quiet box.
  - profiles: a portrait column (full-body avatar, name, actions, friends/followers, bio) beside the content, instead of a full-width banner.
  - tiles lose their hover card; the ⋯ menu only shows when needed.
  - "people also join" can go (option).
- **Rewrites:** Roblox's design tokens to hush's palette (light and dark); the blue Play button → neutral; menu and header links lowercase; section headers small; tabs as words with a thin underline; filter pills soft; tiles with soft corners and quiet stats.
- **Keyboard:** Roblox has no shortcuts of its own, so hush adds `g` chords, `/` search and `z` focus mode, with key caps on hover in the menu.

## Menu style

Every adapter with a sidebar has a **menu** setting: **words**, **icons**, or **both** (default). In icon mode the word slides out beside the icon on hover. Change it in the popup (segmented control) or the palette (`ctrl k` → "menu", enter cycles).

## Design system

- **Popup:** real **shadcn/ui** components (Radix primitives: Switch, Tabs, ToggleGroup, Tooltip, plus Badge, Kbd and Separator) on Tailwind v4 with shadcn's zinc theme and `tw-animate-css`, **Lucide** icons, and **Geist** / Geist Mono bundled locally. It runs only in hush's own page, so it costs the sites nothing.
- **In-page palette, toasts, key caps, buttons:** the same zinc tokens and component shapes in plain CSS, plus a generated Lucide icon subset (`src/core/icons.js`, from `ui/gen-icons.mjs`). No framework is injected into the sites, which keeps them fast. No gradients anywhere, including YouTube's glossy "light shape" button wash, which hush removes.

Motion uses one curve, `cubic-bezier(.32,.72,0,1)`, 150–400ms, transform and opacity only, with no blur animations and no full-screen backdrop blur. Everything respects `prefers-reduced-motion`.

- **Layout toggles** (focus mode, menu style, any option) use the browser's View Transitions, so the page cross-fades into its new layout instead of snapping.
- **Sliding indicators** like shadcn tabs: under X's timeline and profile tabs, behind YouTube's selected chip, and under Roblox's about / store / servers tabs.
- **Entrances:** X posts settle in as they appear; YouTube home and Roblox tiles rise in with a short stagger; Roblox pages fade up on load.
- YouTube's ambient-mode glow around the player is off.

## Performance

- Adapters re-check the page through `Hush.throttle`: DOM bursts coalesce into one pass per frame, at most every 150ms (X fires dozens of mutations a second while scrolling).
- Expensive checks run once and tag the element (`data-hush-*`), so later passes skip it. No page-wide `:has()` rules on hot elements.
- Feed caps hide the infinite-scroll loader, so capped feeds stop fetching instead of loading hundreds of hidden items.
- Long non-virtualised lists (YouTube search results, comments, up next; Roblox marketplace) use `content-visibility: auto`, so offscreen items aren't laid out or painted.
- Measured while scrolling (1440×900, Chromium): X home holds 160+ fps with no long tasks attributable to hush, the same as without it; Roblox charts 163–166 fps.

## How it works

```
manifest.json
src/
  core/
    registry.js   Hush global: settings, adapter registry, key caps (every context)
    icons.js      Lucide icon subset for the palette (generated)
    palette.js    tune palette + toasts, in a closed shadow root
    engine.js     content script: picks the adapter, sets data-hush-* flags on <html>
    generic.css   calm layer for every site (still motion, mute color) + shared key caps
  sites/
    x.js / x.css               X adapter
    youtube.js / youtube.css   YouTube adapter
    roblox.js / roblox.css     Roblox adapter
    picker.js     "hush this": the right-click element picker
  background.js   keyboard shortcut, right-click menu
ui/               the popup: React + shadcn/ui + Tailwind v4 (built to build/popup)
```

- **Calm layer** runs everywhere: stops page animations and autoplaying media, and can mute image color.
- **Adapters** give a site the full treatment. The engine sets `data-hush-site="<id>"` on `<html>`, and every adapter rule is scoped under it, so turning hush off is instant, no reload.
- **Theme remapping** beats hand-picking elements. X paints color through atomic CSS rules, so `x.js` scans for the rules that set X's separator, blue and text colors and overrides just those. YouTube and X chat use design tokens, so the CSS remaps the tokens.

## Adding a site

1. Create `src/sites/<site>.js`:

   ```js
   Hush.register({
     id: 'reddit',
     name: 'Reddit',
     match: (host) => /(^|\.)reddit\.com$/.test(host),
     options: [
       { key: 'nosidebar', label: 'hide sidebar', default: true },                       // → html[data-hush-nosidebar]
       { key: 'navstyle', label: 'menu', choices: ['words', 'icons', 'both'], default: 'both' } // → html[data-hush-navstyle="icons"]
     ],
     allowMedia: (video) => false,          // optional: media allowed to autoplay
     mute: { items: 'article', target: (el) => el.closest('li') }, // optional: what a muted word hides
     titles: 'h3.title',                    // optional: titles that "calm titles" rewrites
     setup(ctx) {
       // ctx: root, options, setOption(k, v), toast(text), openPalette(), isTyping(e),
       //      keys({ 'g h': fn, '/': fn }) for sites without their own shortcuts
       this.commands = (ctx, query) => [];  // optional: tune palette commands
       return () => { /* teardown */ };
     }
   });
   ```

2. Create `src/sites/<site>.css` with every rule scoped to `html[data-hush-site="reddit"]`. Options show up as flags: `html[data-hush-nosidebar]`.
3. In `manifest.json`, add the JS to the `<all_urls>` list (before `engine.js`) and a content-script entry for the CSS with the site's `matches`.
4. Import it in `ui/src/hush.ts` so the popup knows its options.

Rules of thumb:
- Select by `data-testid`, `aria-*`, `role`, `href` and custom element names. Generated class names change on deploy (atomic or token-based ones you discover at runtime are the exception).
- Whitelist, don't blacklist: hide a whole nav, bring back what matters.
- Hide noise, don't break function. Everything stays reachable through **more** or the palette.
- Motion is opt-in, small and quick: 150–350 ms, `cubic-bezier(.16,1,.3,1)`, and it respects `prefers-reduced-motion`. hush's own motion uses `!important` with higher specificity, so "still motion" only stops the site's.
