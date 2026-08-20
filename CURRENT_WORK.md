# Turn Over — Current Work

Last updated: 2026-08-20

## Project naming

The official game name is **Turn Over**. Historical working names **Bandas del Tablero** and **Chess Project** are no longer product names. Existing browser-storage keys remain unchanged as legacy technical identifiers until an explicit migration is implemented.

## Active task

Rework the in-level interface around the new tabletop composition: repositioned board, notebook navigation and compact game controls. The menu-to-level transition animation is deliberately deferred until the level UI is stable.

## Tutorial obstacles

Implemented on `feature/tutorial-obstacles`.

- The tutorial level now declares three blocking obstacles through its existing `boardElements` content hook.
- Obstacles use the generic `type: 'blocker'` contract plus `blocking: true`, so future artwork can replace the current placeholders without changing movement rules.
- The authoritative rules engine already prevents occupation/capture of blocking squares, stops sliding movement at them and lets knights jump over them without landing on them.
- The AI consumes the same legal-action generator, so obstacle behavior is identical for human and AI turns.
- Frozen-piece pass-through remains independent: frozen pieces can be crossed according to the existing rule, while board obstacles remain solid.
- The obstacle contract is documented in `assets/board-elements/README.md`.

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
- The **Banda** section explains the three faction pieces and the fixed tutorial starting-band composition. Manual drag/select deployment is not wired to `GameState` yet.
- The menu-to-level shared-notebook FLIP transition is intentionally not part of this branch yet.

## Existing start screen

The illustrated start screen is implemented on `main` with **New Game**, **Continue** and **Settings** artwork while preserving the existing action IDs. The title entrance and menu hover/press animations live in `src/home-screen.css` and the timestamped files under `assets/menu/` are referenced by their exact filenames.

## Session and turn lifecycle

A session snapshot is saved in browser local storage after a game starts and after each completed move. Finished matches clear the in-progress session. Campaign progression continues to use `ProgressionStore`.

The no-legal-moves lifecycle is implemented: a blocked side loses its turn; if neither side has a legal move, the encounter ends with `Tablas` and offers `Reiniciar encuentro`. Human and AI use the same legal-move source.

## Tutorial factions and starting bands

The game now defines three simply named factions: Verde (special piece: bishop), Roja (rook) and Amarilla (knight). A reusable starting-band factory supplies king, queen, pawn and the selected faction's special piece. New Game opens a faction selector before constructing the tutorial level, while the tutorial opponent is always a green starting band. Green player pieces use a light palette and green AI pieces use a dark palette.

The bitmap paper pieces are no longer assigned to factions. Gameplay has returned to the original CSS token graphics with chess glyphs; the asset files remain in the repository but are unused. Piece and faction display names are the plain chess/color names.

The reusable contract, tutorial flow, palette behavior, session migration and extension checklist are documented in `docs/FACTIONS_AND_BANDS.md`.

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