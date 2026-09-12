# Paige's Game Room

A zero-backend, ad-free PWA with:

- Klondike Solitaire
- Tetris-style falling blocks
- Offline play after the first visit
- Local high scores / Solitaire progress
- Custom Paige home art
- Ryan + Link + Sketch celebration screen
- No database, login, analytics, ads, API, or subscription

## Publish on GitHub Pages

1. Create a new GitHub repository, for example `paiges-game-room`.
2. Upload **everything in this folder to the repository root**.
3. Commit to `main`.
4. In GitHub open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select `main` and `/ (root)`, then Save.
7. GitHub will give you a URL similar to:
   `https://YOUR-USERNAME.github.io/paiges-game-room/`
8. Open that URL in Safari on Paige's iPhone.
9. Tap **Share → Add to Home Screen**.

All URLs in the app are relative, so it works correctly when GitHub Pages hosts it inside a repository subfolder.

## Privacy note

If the GitHub repository is public, the custom artwork is also publicly accessible at the Pages URL. Use a private repo with a GitHub plan that supports private Pages, or use a private-repo-compatible static host, if that matters.

## Add another game later

The app is deliberately modular.

1. Add a file such as `js/games/freecell.js` that exports:

```js
export async function mount({ root, toast, celebrate, storage }) {
  root.innerHTML = `<h1>FreeCell</h1>`;
  return {
    cleanup() {},
    replay() {}
  };
}
```

2. In `js/app.js`, add an item to `GAME_REGISTRY`:

```js
{
  id: 'freecell',
  title: 'FreeCell',
  subtitle: 'Every card is visible.',
  art: './assets/freecell-card.jpg',
  module: './games/freecell.js',
  enabled: true
}
```

3. Add the new module/image path to `ASSETS` in `sw.js`.
4. Commit and push. GitHub Pages redeploys automatically.

## Updating after install

When you make a meaningful update, change the cache name in `sw.js`, for example:

```js
const CACHE = 'paige-game-room-v2';
```

That forces the installed PWA to refresh its offline files.
