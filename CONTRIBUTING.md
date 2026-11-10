# Contributing to hush

Thanks for helping turn the web down.

## Asking for a site

Open a **Site request** issue with the site, the pages you use most, and what feels loud. Screenshots help a lot.

## Reporting a bug

Open a **Bug report** issue with the site and page, what you expected, what happened, and your browser version. If a site changed its layout, a screenshot of the page with hush off is the most useful thing you can add.

## Working on hush

```bash
npm install
npm run dev   # rebuilds the popup on save
```

Load the folder unpacked from `chrome://extensions`, then press reload on the hush card after changing anything in `src/`.

Guidelines that keep hush calm and fast:

- **Scope everything.** Every rule for a site sits under `html[data-hush-site="<id>"]`, so switching off is instant.
- **Select by meaning.** Prefer `data-testid`, `aria-*`, `role`, `href` and custom element names over generated class names, which change on deploy.
- **Hide noise, keep function.** Anything hidden should still be reachable from the palette or a **more**.
- **Motion is small.** 150–400 ms, transform and opacity only, one easing curve, and respect `prefers-reduced-motion`.
- **Mind the frame.** Batch DOM work through `Hush.throttle`, tag elements once, avoid page-wide `:has()` on hot elements.

How adapters work and how to add one: [docs/SITES.md](docs/SITES.md).

## Pull requests

Keep each pull request to one change, describe what it calms down, and include before/after screenshots for visual changes.
