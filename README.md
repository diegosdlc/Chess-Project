# Bandas del Tablero

A lightweight browser game with a data-driven structure for levels, factions, assets and tutorial UI. There is no build step: serve the repository with any static HTTP server and open `index.html`. Do not open `index.html` directly with `file:///`: Chromium browsers may display the styling but block the JavaScript modules.

## Project structure

- `src/main.js` — application controller and level lifecycle.
- `src/core/` — game state, geometry and movement rules.
- `src/render/` — board/piece/terrain rendering.
- `src/systems/` — assets, audio, progression and tutorial systems.
- `src/content/factions.js` — faction identity and faction-specific piece artwork.
- `src/content/levels/` — declarative level definitions and level registry.
- `assets/boards/` — board artwork.
- `assets/pieces/` — faction-specific piece artwork.
- `assets/music/` — music and sound effects.
- `assets/board-elements/` — obstacles, props and special-tile artwork.

## Adding a level

1. Create a file in `src/content/levels/` by copying `tutorial-01.js`.
2. Give it a unique `id`, define its board, teams, units and optional content.
3. Register it in `src/content/levels/index.js`.
4. Set `nextLevelId` on the preceding level if it should unlock automatically after a player victory.

Levels can define:

- their own board artwork and isometric projection;
- arbitrary starting units and factions;
- background music;
- blocking `boardElements` with custom artwork;
- visual `specialTiles` ready for level-specific mechanics;
- tutorial tooltip steps anchored to a unit, cell or the board;
- the next campaign level.

## Faction-specific pieces

Add artwork under `assets/pieces/<faction>/` and register the paths in `src/content/factions.js`. Piece rendering automatically uses the faction art when available and keeps the current glyph as a fallback.

## Tutorial preview

The first level includes a three-step tutorial definition but keeps it off by default so the current clean board UI remains unchanged. Open the game with `?tutorial=1` to force the tutorial on.

A specific level can also be opened with `?level=<level-id>`.

## Progression

Player victories are persisted in local storage. The progression store tracks completed levels, unlocked levels and recruited units, which gives later campaign/menu work a stable data layer without coupling it to the board renderer.

## Start screen and local session

The app opens on a start screen with a new game, continuation and settings entry point. An in-progress game is saved locally after setup and after each completed move, so **Continuar partida** can restore the active level, pieces and turn after closing the browser. Sessions are local to the current browser/device and are cleared when the encounter ends. The settings screen is currently a UI placeholder for future music, difficulty and controls settings.
