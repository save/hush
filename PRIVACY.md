# Privacy

hush is built to be the quietest thing in your browser, and that includes data.

## What hush stores

- **Your settings** (which sites are on, your options, elements you chose to hide) in `chrome.storage.sync`, so they follow you between your own browsers. Google syncs this as part of your Chrome profile; hush has no access to it beyond your browser.
- **Weekly counts** for the quiet report: a number per site per day, in `chrome.storage.local`, on your device only. Anything older than five weeks is deleted.

## What hush does not do

- No analytics, telemetry or crash reporting.
- No servers. hush never makes a network request of its own.
- No reading, logging or sending of what you browse, type or watch.
- No ads, sponsored content or affiliate links, injected or otherwise.

## Permissions

| Permission | Why |
| :-- | :-- |
| `storage` | Save your settings and weekly counts. |
| `activeTab` | Let the popup show the site you're on. |
| `favicon` | Show site icons in the popup. |
| `contextMenus` | The right-click **hush this** item. |
| Access to all sites | Apply the calm layer and your hidden elements on the sites you visit. |

## Questions

Open an issue on GitHub.
