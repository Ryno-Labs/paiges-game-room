# Fastest way to add a game

The shell is already done. Each game is one JavaScript module.

## Contract

Every game module exports `mount()`:

```js
export async function mount({ root, toast, celebrate, storage }) {
  // Render your game into root.
  // toast('Message') shows a small message.
  // storage.get/set keeps data on Paige's phone.
  // celebrate({...}) shows Ryan + Link + Sketch.

  return {
    cleanup() {
      // Remove timers/listeners when Paige leaves the game.
    },
    replay() {
      // Start that game again after the victory screen.
    }
  };
}
```

Then add one object to `GAME_REGISTRY` in `js/app.js` and add its files to `sw.js`.
