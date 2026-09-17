# Paige's Game Room — Six-Month Journey v9

Private, ad-free, iPhone-first PWA for Paige. Built for GitHub Pages with no backend, account, API, subscription, or recurring hosting cost.

## What changed in v9

Paige finished the first Blocks chapter quickly, so the Journey is now designed as a long-form path instead of a short demo.

- **720 total Journey levels**
- **24 chapters × 30 levels**
- At an average of **4 levels per day**, the path is exactly **180 days** of play.
- Every 10th level is a checkpoint.
- Every 30th level is a chapter finale with the Ryan/Link/Sketch celebration art.
- Difficulty increases gradually through tighter goals and a larger shape library.
- Later chapters introduce larger and less forgiving pieces while keeping play untimed.
- Journey progress, chapter progress, medals, current level, and completed chapters persist locally.
- Existing v8 progress migrates forward. If Paige already completed the original 10 levels, she starts at **Level 11** instead of being reset.

The 720 levels are generated deterministically from a fixed progression system, so every numbered level stays the same when replayed. The main progression goals rotate through line clears, scoring, rows, and columns. Harder skills such as double-clears and combos are used mainly as optional mastery-medal goals so they add depth without blocking the Journey.

## Solitaire

Solitaire remains the Practical build:

- **Classic** — Draw 1, unlimited stock passes, undo and hints.
- **Challenge** — Draw 3.
- **Vegas** — $52 fake-money buy-in, +$5 per foundation card, one stock pass, persistent Paige's Bankroll.
- **Today's Deal** — seeded Vegas deal that changes once per local calendar day.

It keeps auto-save, tap-to-logical-move, drag, undo, hints, themes, stats, and the Ryan/Link/Sketch celebration.

## Paige's Blocks

### Journey

- 720 levels
- 24 named chapters
- 30 levels per chapter
- 3 medals per level
- Visible current/target progress
- Move limits
- Checkpoints every 10 levels
- Chapter finales every 30 levels
- Undo, hint, auto-save, instant retry, and failed-level undo rescue
- Progressive shape difficulty

### Endless

No move limit. Continue until the board runs out of room and chase Paige's personal best.

## Deploy to GitHub Pages

1. Upload the contents of this folder to the existing GitHub repository.
2. Keep the same GitHub Pages URL Paige already uses.
3. GitHub Pages redeploys automatically.
4. Paige's installed PWA checks for updates when opened or brought back to the foreground.
5. If she is inside a game, the new service worker waits until she returns to the Game Room home screen before taking control.

## iPhone notes

- Portrait-only product direction.
- Uses real iOS safe areas; no fake/stamped status bar artwork.
- Game boards are locked against page bounce while playing.
- Home/mode screens can scroll normally on smaller iPhones.
- Saved progress is local to Paige's iPhone/browser storage.
- Works offline after the app shell has been cached once.
