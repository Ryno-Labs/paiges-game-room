# Paige's Game Room — Practical v8

Private, ad-free, iPhone-first PWA for Paige. Built for GitHub Pages with no backend, account, API, subscription, or recurring hosting cost.

## Games

### Solitaire

The old single-mode Klondike build has been replaced by a Solitaire hub with four experiences:

- **Classic** — Draw 1, unlimited stock passes, undo and hints.
- **Challenge** — Draw 3 with the same calm table and full recovery tools.
- **Vegas** — $52 fake-money buy-in, +$5 for each foundation card, one stock pass, persistent Paige's Bankroll.
- **Today's Deal** — a seeded Vegas deal that changes once per local calendar day.

Vegas bankroll changes happen when the hand happens: the buy-in is charged on the deal and foundation payouts are added immediately. Undo restores the bankroll with the card state. A Vegas hand can be ended before a full win and still finish profitably.

Solitaire also includes auto-save, responsive portrait layout, large ranks/suits, tap-to-logical-move, drag for alternate destinations, undo, hints, safe auto-finish when the exposed position is deterministic enough, three table themes, stats by mode, and the Ryan/Link/Sketch celebration on a full clear.

### Paige's Blocks

The falling-block game has been replaced by a calm, original 8×8 placement puzzle.

- **Journey** — Chapter 1, "First Clears," with 10 finite levels.
- **Endless** — no move limit; chase Paige's personal best until no piece fits.

Journey levels always show one primary goal, live progress, moves remaining, and combo. Each level can earn up to three medals: completion, efficient completion, and one bonus mastery goal. The tenth level is the chapter finale.

Controls are iPhone-first: tap a piece and tap the board, or drag the piece onto the board. Undo, hints, auto-save, instant retry, and an undo-last-move rescue on failed Journey levels are built in.

## Deploy to GitHub Pages

1. Upload the contents of this folder to the existing GitHub repository.
2. Keep the same GitHub Pages URL Paige already uses.
3. GitHub Pages redeploys automatically.
4. Paige's installed PWA checks for the update when opened or brought back to the foreground.
5. If she is inside a game, the new service worker waits until she returns to the Game Room home screen before taking control.

Do not rename paths unless you also update `sw.js` and the registry in `js/app.js`.

## iPhone notes

- Portrait-only product direction.
- Uses real iOS safe areas; no fake/stamped status bar artwork.
- Game boards are locked against page bounce while playing.
- Home/mode screens can scroll normally on smaller iPhones.
- Saved progress is local to Paige's iPhone/browser storage.
- Works offline after the app shell has been cached once.

## Main files

- `index.html` — PWA shell and celebration overlay.
- `styles.css` — all iPhone layouts and game styling.
- `js/app.js` — home screen, registry, navigation, safe updates.
- `js/games/solitaire.js` — all four Solitaire modes and bankroll.
- `js/games/blocks.js` — Journey and Endless block puzzle.
- `sw.js` — offline caching and game-safe update activation.
- `manifest.webmanifest` — install metadata and app icons.
