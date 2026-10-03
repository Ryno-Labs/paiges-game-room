# Paige's Game Room — v11

iPhone-first, ad-free PWA containing:
- Solitaire (existing saves and bankroll preserved)
- Paige's Blocks (existing 720-level progress preserved)
- 90s Five (100 five-letter 90s pop-culture puzzles, daily puzzle, manual puzzle-number picker, share/challenge mode)

## Saved data
The existing storage keys were not renamed or cleared:
- `paige.solitaire.*`
- `paige.blocks.*`

90s Five uses its own isolated namespace:
- `pgr90five:v1:puzzle:<id>`

Updating the files in the same GitHub Pages site therefore leaves Paige's current Solitaire, Blocks, and existing 90s Five puzzle data in place on her iPhone. Puzzle numbers are permanent: #042 is the same puzzle for everyone.

## Deploy
Replace the files in the existing GitHub Pages repository with the contents of this folder. Do not change the site URL if you want existing local saves to remain available.


## v12 — 90s Five word-check + clue pass
- 90s Five now rejects made-up five-letter strings before they consume a turn.
- Valid guesses use an offline English five-letter dictionary plus every themed solution word.
- All 100 clues were rewritten as indirect nudges instead of near-answer giveaways.
- Existing storage namespaces, puzzle IDs, answers, Solitaire data, Blocks data, and 90s Five saves are unchanged.
