# Paige's Game Room

A private, ad-free **iPhone-first PWA** built for Paige.

## Included

- Klondike Solitaire
  - tap-to-move and drag-to-move
  - double-tap exposed cards to move them to a foundation
  - automatic card reveal
  - undo, hints, saved game, timer, win stats
- Tetris
  - tap the board to rotate
  - swipe sideways to move
  - swipe down to drop
  - large touch controls as a fallback
  - 7-piece bag randomizer, landing ghost, lock delay, saved game and high score
- Custom Paige home art
- Ryan + Link + Sketch win/high-score screen
- Offline play after the first successful load
- No database, login, analytics, ads, API, or subscription

This build intentionally targets **iPhone use**, not desktop or tablet. It uses iPhone safe-area insets, standalone PWA mode, portrait-first layout, Retina canvas rendering, touch/pointer controls, local saves, and iOS Home Screen metadata.

## Publish on GitHub Pages

1. Create a GitHub repository, for example `paiges-game-room`.
2. Upload **everything in this folder to the repository root**.
3. Commit to `main`.
4. Open **Settings → Pages** in GitHub.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select `main` and `/ (root)`, then Save.
7. Open the GitHub Pages URL in **Safari on Paige's iPhone**.
8. Tap **Share → Add to Home Screen**.

All app URLs are relative, so GitHub Pages can host it inside a repository subfolder.

## Updating an installed copy

For meaningful code changes, change the cache name at the top of `sw.js`:

```js
const CACHE = 'paige-game-room-ios-v7-touch';
```

The app checks for a new service worker and reloads when an update takes control. Paige's game progress and high scores stay in local storage on her iPhone.

## Privacy note

If the GitHub repository/Pages site is public, the custom family artwork is publicly reachable at that URL. The game itself does not send gameplay data anywhere.

## Add another game later

See `ADD-A-GAME.md`. The shell is intentionally modular: add one game module, one registry entry, its artwork, and its cached file path.


## iPhone Tetris controls

Tetris is locked to one non-scrolling screen. Tap the board to rotate, drag left/right to move, drag down to soft-drop, and use a quick downward flick to hard-drop. The gesture locks to one axis to prevent diagonal thumb movement from making the piece jitter.

## Updates

The PWA checks GitHub Pages for updates when it opens and whenever it returns to the foreground. If a new version downloads while Solitaire or Tetris is active, it waits. The update is activated only after returning to the Game Room home screen, so gameplay is never interrupted.

## iPhone touch tuning in v7

- Solitaire ignores normal thumb wobble until the finger moves about 14 px.
- Dragging back onto the source pile counts as selecting the card instead of a failed move.
- Selection highlighting updates without rebuilding the full card board.
- Drag previews move on the compositor with requestAnimationFrame instead of layout-heavy left/top changes.
- Solitaire compresses card spacing to the actual remaining viewport height, so gameplay stays on one stable screen.
- Tetris caches gesture geometry once per touch and only hard-drops on a deliberate fast downward flick.
- Tetris canvas backing resolution now matches its actual rendered size and iPhone pixel density.
- Core CSS/JS uses stale-while-revalidate so weak signal does not stall launch.
- Offline install no longer fails because one optional artwork/icon file failed to cache.
