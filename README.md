# Turn Over

A lightweight browser strategy game with a data-driven structure for levels, factions, assets, deployment, tutorials and mechanics testing. There is no build step: serve the repository with any static HTTP server and open `index.html`.

Do not open `index.html` directly with `file:///`: Chromium browsers may display the styling but block JavaScript modules.

## Project structure

- `src/main.js` — application controller, lifecycle orchestration, deployment and turn flow.
- `src/core/` — game state, geometry, movement rules and piece-evolution profiles.
- `src/ai/` — reusable AI over the shared legal-action generator.
- `src/render/` — board, piece and terrain rendering.
- `src/systems/` — assets, audio, sessions, progression and tutorial systems.
- `src/content/factions.js` — faction identity, special pieces, palettes and optional piece artwork.
- `src/content/bands.js` — shared piece catalogue, starting-band factory and facing constants.
- `src/content/levels/` — production levels, shared board definitions and mechanics-lab scenarios.
- `src/content/levels/labs/` — mechanics-lab registry and reusable lab behavior helpers.
- `src/level-ui.js` / `src/level-ui.css` — notebook navigation and in-level tabletop composition.
- `src/deployment.css` — pre-match deployment UI and board-zone highlighting.
- `assets/menu/` — illustrated start-screen artwork.
- `assets/boards/` — board artwork.
- `assets/pieces/` — optional faction/piece/facing artwork and development placeholders.
- `assets/music/` — music and sound effects.
- `assets/board-elements/` — obstacles, props and special-tile artwork.
- `docs/` — durable implementation contracts and mechanics-lab documentation.

## Adding a level

1. Create a file in `src/content/levels/`, usually starting from `tutorial-01.js` or a smaller existing scenario.
2. Give it a unique `id` and define its board, teams, units and optional content.
3. Register it in `src/content/levels/index.js` when it is a normal game level.
4. Set `nextLevelId` on the preceding level if campaign progression should unlock it automatically.

Levels can define:

- their own board artwork and isometric projection;
- arbitrary starting units and factions;
- explicit initial `facing` for units/bands;
- an optional pre-match `deployment` block;
- background music;
- blocking `boardElements` with custom artwork;
- visual `specialTiles` ready for level-specific mechanics;
- tutorial tooltip steps anchored to a unit, cell or the board;
- generic level behavior hooks;
- the next campaign level.

## Pre-match deployment

A level can opt into deployment with:

```js
deployment: {
  team: 'player',
  rows: [6, 7]
}
```

When deployment is enabled, that team's pieces start off-board and are shown over the notebook. The player selects each piece and places it on a valid configured row. Occupied cells and blocking `boardElements` cannot be used. Placed pieces can be selected again and repositioned before play begins.

Once every deployment unit occupies a unique legal cell, **Iniciar partida** becomes available. Turn resolution, AI scheduling and tutorial progression begin only after confirmation.

The tutorial uses the player's two nearest rows (`6` and `7`). Deployment state is included in the local session snapshot, so **Continuar partida** can resume an interrupted setup.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full contract.

## Factions, bands and piece facing

Playable factions are **Verde**, **Roja** and **Amarilla**. A starting band always contains rey, reina and peón plus its faction piece: alfil for Verde, torre for Roja and caballo for Amarilla. New games ask the player to choose a faction before the tutorial; the tutorial opponent is always Verde.

Units keep three independent concepts:

- `team` — who currently controls the piece;
- `faction` — the piece's origin/art family;
- `facing` — `north` or `south` on the board.

The tutorial starts the two bands facing each other: player pieces face north and enemy pieces face south. Facing is explicit game state and does not change automatically just because a unit moves.

Optional artwork resolves by `faction -> pieceType -> facing`. Production factions currently fall back to the CSS chess-token treatment when final artwork is not configured. This lets a recruited piece preserve its origin faction artwork while changing team, and lets facing change independently.

See [`docs/FACTIONS_AND_BANDS.md`](docs/FACTIONS_AND_BANDS.md).

## Obstacles and board elements

Blocking `boardElements` participate in the shared movement rules. Sliding movement stops at blockers, no unit may land on a blocking square, and knights may jump over blockers without landing on them. Human turns and AI turns use the same rules.

The tutorial currently includes visible placeholder blockers. Their artwork can be replaced without changing the gameplay contract. See [`assets/board-elements/README.md`](assets/board-elements/README.md).

## Mechanics labs

Mechanics labs are small development levels for repeatedly exercising one mechanic without affecting production progression.

Registered labs:

- are automatically addressable with `?level=<lab-id>`;
- automatically appear under **Ajustes → Laboratorios de mecánicas**;
- should exercise the same engine operations used by production levels;
- may use generic level behavior hooks for test-only conveniences, but core systems must not hard-code individual lab ids.

The current `facing-lab` validates north/south state changes and facing-specific artwork selection.
The `pawn-evolution-lab` provides a pawn at the activation edge plus prepared movement and four-diagonal capture cases.

See [`docs/MECHANICS_LABS.md`](docs/MECHANICS_LABS.md), [`docs/FACING_LAB.md`](docs/FACING_LAB.md) and [`docs/EVOLUTION.md`](docs/EVOLUTION.md).

## Piece evolution

Evolution is a generic state/profile system: each piece type can define its own activation condition and evolved capabilities. The pawn is the first implemented evolution. Reaching the opposite edge permanently changes it to a bidirectional one-cell mover that can capture on all four adjacent diagonals.

Evolution is shared by player interaction, legal-action generation and AI simulation. Its state is saved with the unit, and evolved units currently receive a small star marker. See [`docs/EVOLUTION.md`](docs/EVOLUTION.md).

## Tutorial preview

The first level includes tutorial tooltip steps but keeps them off by default so the clean level UI remains unchanged. Open the game with `?level=tutorial-01&tutorial=1` to force the tutorial on.

A normal level or mechanics lab can also be opened directly with `?level=<level-id>`.

## Progression

Player victories are persisted in local storage. `ProgressionStore` tracks completed levels, unlocked levels and recruited units, keeping campaign state separate from the active board/session state.

## Start screen, notebook and local session

The app opens on an illustrated 1536×960 start-screen composition built from WebP layers in `assets/menu/`. The title has a paper-placement entrance animation and the artwork buttons use subtle hover/focus/press feedback.

The in-level UI uses a notebook with **Banda**, **Misión**, **Reglas** and **Ajustes** sections. During deployment, the notebook content area temporarily becomes the deployment panel; after **Iniciar partida**, normal notebook navigation returns.

An in-progress game is saved locally during deployment, after setup and after each completed move. **Continuar partida** restores the active level, selected faction, serialized units (including facing and evolution state), lifecycle phase and turn. Sessions are local to the current browser/device and are cleared when the encounter ends.

## Project documentation

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — durable architecture/product decisions and cross-device workflow.
- [`CURRENT_WORK.md`](CURRENT_WORK.md) — current merged baseline, remaining gaps and immediate next focus.
- [`docs/FACTIONS_AND_BANDS.md`](docs/FACTIONS_AND_BANDS.md) — faction/band/facing/artwork contract.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — pre-match deployment contract.
- [`docs/MECHANICS_LABS.md`](docs/MECHANICS_LABS.md) — reusable mechanics-lab workflow.
- [`docs/FACING_LAB.md`](docs/FACING_LAB.md) — facing-lab test procedure.
- [`docs/EVOLUTION.md`](docs/EVOLUTION.md) — generic evolution profiles and pawn-evolution rules/lab.
