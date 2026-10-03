# Paige's Game Room — v10

iPhone-first, ad-free PWA containing:
- Solitaire (existing saves and bankroll preserved)
- Paige's Blocks (existing 720-level progress preserved)
- 90s Five (100 five-letter 90s pop-culture puzzles, daily puzzle, share/challenge mode)

## Saved data
The existing storage keys were not renamed or cleared:
- `paige.solitaire.*`
- `paige.blocks.*`

90s Five uses its own isolated namespace:
- `pgr90five:v1:puzzle:<id>`

Updating the files in the same GitHub Pages site therefore leaves Paige's current Solitaire and Blocks data in place on her iPhone.

## Deploy
Replace the files in the existing GitHub Pages repository with the contents of this folder. Do not change the site URL if you want existing local saves to remain available.
