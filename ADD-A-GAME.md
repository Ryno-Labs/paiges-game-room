# Add another game

Each game lives in its own JavaScript module. The home screen does not need to be rebuilt.

## 1. Create the game module

Example: `js/games/freecell.js`

```js
export async function mount({ root, toast, celebrate, storage }) {
  root.innerHTML = `<section class="game-screen">Your game UI</section>`;

  // toast('Message') shows a temporary native-feeling message.
  // storage.get/set/remove keeps data locally on Paige's iPhone.
  // celebrate({...}) opens the Ryan + Link + Sketch celebration screen.

  return {
    cleanup() {
      // Stop timers and remove document/window listeners here.
    },
    replay() {
      // Start a fresh game after a win screen.
    }
  };
}
```

## 2. Register it

Add one item to `GAME_REGISTRY` in `js/app.js`:

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

## 3. Cache it for offline play

Add these paths to `APP_SHELL` in `sw.js`:

```js
'./js/games/freecell.js',
'./assets/freecell-card.jpg',
```

Then bump the cache version in `sw.js`, for example from `v3` to `v4`.

## iPhone rules for future games

Keep primary touch targets at least about 44px, use `env(safe-area-inset-*)` where controls reach screen edges, avoid hover-only interactions, pause gameplay when the app goes into the background, and save enough state to recover if iOS removes the PWA from memory.
