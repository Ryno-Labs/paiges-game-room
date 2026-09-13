# Add another game later

Paige's Game Room is intentionally modular. Each game owns its own file under `js/games/`.

1. Create `js/games/mygame.js`.
2. Export `mount({ root, toast, celebrate, goHome, storage })`.
3. Render the game only inside `root`.
4. Return `{ cleanup, replay }` from `mount`.
5. Add one record to `GAME_REGISTRY` in `js/app.js`.
6. Add the module path to `CORE_SHELL` in `sw.js` and bump the cache name.

Example registry record:

```js
{
  id: 'word-game',
  title: 'Word Game',
  subtitle: 'A short description.',
  art: './assets/word-game.jpg',
  module: './games/word-game.js',
  enabled: true
}
```

Keep future games iPhone-first: large touch targets, portrait layout, no fake phone status bar, auto-save, offline behavior, and no interaction that depends on hover or a physical keyboard.
