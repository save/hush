// Where people can support hush. Fill these in once the accounts exist —
// an empty string shows the card as "coming soon".
export const SUPPORT = {
  kofi: '', // e.g. 'https://ko-fi.com/yourname'
  githubSponsors: '', // e.g. 'https://github.com/sponsors/yourname'
  buyMeACoffee: '', // e.g. 'https://buymeacoffee.com/yourname'
  github: 'https://github.com/save/hush', // the repo, for stars and issues
  chromeWebStore: '', // the store listing, for reviews
  download: 'https://github.com/save/hush/releases/latest/download/hush.zip', // the newest packed release
  website: 'https://save.github.io/hush/', // the homepage (GitHub Pages)
};

// Crypto tips. Each address only takes the coin on the network named beside it.
export const WALLETS: { coin: string; network: string; address: string }[] = [
  { coin: 'SOL', network: 'Solana', address: '8CGqyrJJn4c9bFf3wk5GHWFtaDkgDwaJx5pMqZxp7Hna' },
  { coin: 'BTC', network: 'Bitcoin', address: '3AobPaHQMsqNL2xQNaV9cjtouqu1hhCZCL' },
  { coin: 'ETH', network: 'Ethereum', address: '0x3D6D93F27AAF5267Cc5C8a1524fbf3eF27EA839a' },
  { coin: 'USDT', network: 'Ethereum (ERC-20)', address: '0x5d07376efA43b873A9E34cCD612c5E97B826854b' },
];
