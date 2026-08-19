# Turn Over

A lightweight browser game with a data-driven structure for levels, factions, assets and tutorial UI. There is no build step: serve the repository with any static HTTP server and open `index.html`. Do not open `index.html` directly with `file:///`: Chromium browsers may display the styling but block the JavaScript modules.

## Project structure

- `src/main.js` — application controller and level lifecycle.
- `src/core/` — game state, geometry and movement rules.
- `src/render/` — board/piece/terrain rendering.
- `src/systems/` — assets, audio, sessions, progression and tutorial systems.
- `src/content/factions.js` — faction identity, special pieces and palettes.
- `src/content/bands.js` — shared piece catalogue and starting-band factory.
- `src/content/levels/` — declarative level definitions and level registry.
- `src/home-screen.css` — illustrated start-screen composition and animations.
- `assets/menu/` — full-canvas start-screen background, title and button artwork.
- `assets/boards/` — board artwork.
- `assets/pieces/` — optional piece artwork; current factions use CSS tokens.
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

## Factions and pieces

The playable factions are **Verde**, **Roja** and **Amarilla**. A starting band always contains a king, queen and pawn plus its faction piece: bishop for Verde, rook for Roja and knight for Amarilla. New games ask the player to choose a faction before the tutorial; the tutorial opponent is always Verde.

Pieces use the original CSS token style with chess glyphs. The optional artwork lookup remains available for future levels, but no faction currently assigns bitmap piece art. When both sides are Verde, the player's pieces use the light palette and the AI uses the dark palette.

See [`docs/FACTIONS_AND_BANDS.md`](docs/FACTIONS_AND_BANDS.md) for the full behavior and extension contract.

## Tutorial preview

The first level includes a three-step tutorial definition but keeps it off by default so the current clean board UI remains unchanged. Open the game with `?level=tutorial-01&tutorial=1` to force the tutorial on.

A specific level can also be opened with `?level=<level-id>`.

## Progression

Player victories are persisted in local storage. The progression store tracks completed levels, unlocked levels and recruited units, which gives later campaign/menu work a stable data layer without coupling it to the board renderer.

## Start screen and local session

The app opens on an illustrated 1536×960 start-screen composition built from full-canvas WebP layers in `assets/menu/`. The title has a short paper-placement entrance animation, and the three artwork buttons use subtle hover/focus zoom and press/tap feedback. The action IDs remain wired to the existing New Game, Continue and Settings logic.

The filenames currently stored under `assets/menu/` include upload timestamp suffixes; `index.html` references those exact paths. If the files are renamed later, update the HTML paths in the same commit. See `assets/menu/README.md` for the current asset contract.

An in-progress game is saved locally after setup and after each completed move, so **Continuar partida** can restore the active level, selected faction, pieces and turn after closing the browser. Sessions are local to the current browser/device and are cleared when the encounter ends. The settings screen is currently a UI placeholder for future music, difficulty and controls settings.
