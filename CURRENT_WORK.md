# Turn Over — Current Work

Last updated: 2026-08-18

## Project naming

The official game name is **Turn Over**. Historical working names **Bandas del Tablero** and **Chess Project** are no longer product names. Existing browser-storage keys remain unchanged as legacy technical identifiers until an explicit migration is implemented.

## Active task

Rework the in-level interface around the new tabletop composition: repositioned board, notebook navigation and compact game controls. The menu-to-level transition animation is deliberately deferred until the level UI is stable.

## Level UI rework status

Work in progress on `feature/level-ui-rework`.

- `index.html` now defines a full-screen level stage with a dedicated `board-stage`, the notebook UI and the game controls as independent layout elements.
- The level background uses `assets/background.webp` and the notebook uses the layered WebP assets in `assets/notebook menu/`.
- `src/level-ui.css` owns the new responsive layout so the existing board renderer and board projection remain independent from viewport positioning.
- The notebook exposes **Banda**, **Misión**, **Reglas** and **Ajustes** tabs. The selected post-it rises vertically and every section can contain multiple pages with previous/next navigation.
- `src/level-ui.js` currently provides placeholder notebook content and the pagination controller. The data model is intentionally simple so level-specific content can replace the placeholders later.
- The old corner settings entry point is hidden in the level UI. The old settings dialog remains available from the home screen for compatibility.
- The old visible volume menu is hidden but retained as the compatibility bridge to the existing `AudioManager`. A new mute button toggles between zero and the last non-zero volume. Fine volume control is exposed from the notebook's Ajustes page.
- A pause button and informational pause dialog are present. This iteration blocks board pointer interaction while the dialog is open; engine-level pausing of AI timers/state is still pending and must be implemented before pause is considered gameplay-complete.
- The **Banda** section reserves the UI/content model for deployment. Actual drag/select deployment into the player's two nearest rows is not wired to `GameState` yet.
- The menu-to-level shared-notebook FLIP transition is intentionally not part of this branch yet.

## Existing start screen

The illustrated start screen is implemented on `main` with **New Game**, **Continue** and **Settings** artwork while preserving the existing action IDs. The title entrance and menu hover/press animations live in `src/home-screen.css` and the timestamped files under `assets/menu/` are referenced by their exact filenames.

## Session and turn lifecycle

A session snapshot is saved in browser local storage after a game starts and after each completed move. Finished matches clear the in-progress session. Campaign progression continues to use `ProgressionStore`.

The no-legal-moves lifecycle is implemented: a blocked side loses its turn; if neither side has a legal move, the encounter ends with `Tablas` and offers `Reiniciar encuentro`. Human and AI use the same legal-move source.

## Local development

The project must be opened through an HTTP static server rather than by double-clicking `index.html` because Chromium can block the JavaScript modules under `file:///`.

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
