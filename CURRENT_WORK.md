# Turn Over — Current Work

Last updated: 2026-08-17

## Project naming

The official game name is **Turn Over**. Historical working names **Bandas del Tablero** and **Chess Project** are no longer product names. Existing browser-storage keys remain unchanged as legacy technical identifiers until an explicit migration is implemented.

## Active task

Implement the first game UI layer: an illustrated start screen, an in-game settings entry point and resumable local sessions.

## UI implementation status

Implemented and merged to `main`.

- `index.html` opens on the illustrated start screen with **New Game**, **Continue** and **Settings** artwork while preserving the existing `new-game`, `continue-game` and `home-settings` action IDs.
- The start screen is composed from full-canvas 1536×960 WebP layers under `assets/menu/` and styled by `src/home-screen.css`.
- The title uses an entrance animation that simulates the paper artwork being placed on the table; the three menu actions use subtle hover/focus zoom plus press/tap feedback.
- The menu currently references the exact timestamped asset filenames stored in GitHub. Do not assume clean filenames unless the files and `index.html` are renamed together.
- The game board includes an in-corner gear button that opens the same settings dialog.
- The settings dialog is intentionally a visual placeholder for future music, difficulty and controls options.
- A session snapshot is saved in browser local storage after a game starts and after each completed move. It records the active level, pieces and active turn; it deliberately does not retain a transient selected piece or an unfinished capture prompt.
- Finished matches clear the in-progress session. Campaign progression continues to use `ProgressionStore`.
- The project must be opened through an HTTP static server (for example `npx http-server -p 4173` and then `http://localhost:4173`), rather than by double-clicking `index.html`. Chromium can show CSS through `file:///` while blocking the JavaScript modules that make the buttons work.

## Deployment note

The GitHub Pages run triggered by merge PR #7 uploaded the site artifact successfully but GitHub returned HTTP 503 while creating the Pages deployment. That failure was external to the repository contents. During inspection, a separate repository issue was found: `index.html` referenced clean asset filenames while the actual files in `assets/menu/` include upload timestamp suffixes. `main` now references the exact existing filenames so the next successful Pages deployment can load the menu artwork.

## Previous task: turn lifecycle

The no-legal-moves lifecycle is implemented and merged. A blocked side loses its turn; if neither side has a legal move, the encounter ends with `Tablas` and offers `Reiniciar encuentro`. Human and AI use the same legal-move source, and reset uses the active level definition.

## Next session

Before implementation on Windows:

```bash
git status
git switch main
git pull --ff-only origin main
```

Then read:

1. `PROJECT_CONTEXT.md`
2. this file
3. `README.md`
4. the relevant implementation files

After implementation, update this file to record completion/remaining issues, commit and push to GitHub before moving back to the Android/cloud environment.
