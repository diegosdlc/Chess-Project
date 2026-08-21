# Turn Over — Current Work

Last updated: 2026-08-21

## Project naming

The official game name is **Turn Over**. Historical working names **Bandas del Tablero** and **Chess Project** are no longer product names. Existing browser-storage keys remain unchanged as legacy technical identifiers until an explicit migration is implemented.

## Current main baseline

`main` is the current source of truth. The recent gameplay/UI work described below has already been merged; do not treat the old feature branches as the authoritative implementation.

### Level UI

The tabletop level UI is on `main`.

- `index.html` defines the full-screen level stage with a dedicated board area, notebook and compact game controls.
- `src/level-ui.css` owns responsive viewport positioning independently from the board projection.
- The notebook exposes **Banda**, **Misión**, **Reglas** and **Ajustes** tabs, with vertical selected-tab movement and multi-page sections.
- Fine music volume lives in the notebook settings page; the compact mute control bridges to the existing `AudioManager`.
- The pause dialog currently blocks pointer interaction with the board, but AI timers/state are not yet paused at engine level.
- During deployment, the notebook temporarily gives its content area to the deployment panel. After **Iniciar partida**, normal notebook content returns.
- Deployment no longer locks the notebook tabs: **Banda** hosts piece placement while **Misión**, **Reglas** and **Ajustes** remain available. Long section content scrolls inside the paper area.

### Pre-match deployment

Merged to `main` through PR #12.

- Levels opt in through a declarative `deployment` block. The tutorial uses `team: 'player'` and `rows: [6, 7]`.
- The configured team's pieces start off-board and are displayed over the notebook.
- The player selects pieces and places/repositions them on legal deployment cells.
- `GameState` validates board bounds, configured rows, occupied cells and blocking `boardElements`.
- **Iniciar partida** appears only when every deployment unit is placed on a unique valid cell.
- Turn resolution, AI scheduling and tutorial progression do not begin during deployment.
- Session snapshots persist the lifecycle `phase` and unit coordinates, so an interrupted deployment can be resumed.
- Resetting the level recreates deployment from the level definition.
- Deployment does not alter origin faction or `facing`.

See `docs/DEPLOYMENT.md`.

### Piece facing and faction artwork contract

Merged to `main` through PR #10.

- Units have explicit `facing` state: `north` or `south`.
- `team`, origin `faction` and `facing` are independent.
- The tutorial starts player pieces facing north and enemy pieces facing south.
- `GameState.setFacing()` and `GameState.turnAround()` are the authoritative operations for orientation changes.
- `AssetRegistry.pieceAsset()` resolves optional artwork by origin faction, piece type and facing, with CSS chess-token fallback when art is not configured.
- The session schema is version `3`, so unit facing persists with the serialized unit state.

See `docs/FACTIONS_AND_BANDS.md`.

### Mechanics labs

The reusable mechanics-lab framework is on `main`.

- Labs are registered in `src/content/levels/labs/index.js`.
- Registered labs automatically become directly addressable by level id and appear in **Ajustes → Laboratorios de mecánicas**.
- Shared test-only lifecycle behavior uses generic level hooks rather than hard-coded lab ids in core systems.
- The current `facing-lab` validates orientation state changes and front/back artwork selection with temporary SVG assets.
- `pawn-evolution-lab` provides one activation case and four prepared diagonal-capture cases while retaining the player turn.

See `docs/MECHANICS_LABS.md` and `docs/FACING_LAB.md`.

### Piece evolution

The generic evolution framework and first pawn profile are implemented.

- Units declare an evolution profile and persist `base` / `evolved` state.
- Profiles own their activation condition and evolved capabilities; other pieces can add different profiles without adding piece-specific branches to the controller or AI.
- Pawns evolve on reaching the opposite board edge, then move one cell in either vertical direction and capture on all four adjacent diagonals.
- Human moves, captures and AI simulations apply the same evolution event.
- Evolved units display a temporary star marker.
- Session schema version `4` persists evolution state.

See `docs/EVOLUTION.md`.

### Tutorial obstacles

Merged to `main` through PR #11 and reconciled with the facing work.

- The tutorial declares three blocking obstacles through `boardElements`.
- Blocking squares cannot be occupied or captured onto; sliding movement stops at them and knights may jump over them without landing on them.
- Human and AI behavior is identical because both consume the same legal-action generator.
- Frozen-piece pass-through remains a separate rule: frozen pieces can be crossed, while blocking board elements remain solid.
- Current obstacle art is a visible placeholder and can be replaced without changing movement rules.

See `assets/board-elements/README.md`.

## Session and turn lifecycle

A session snapshot is saved during deployment, after play starts and after each completed move. It stores the selected player faction, serialized units (including facing and evolution stage), active turn, finished state and lifecycle phase. Completed matches clear the in-progress session; campaign progression remains separate in `ProgressionStore`.

The no-legal-moves lifecycle is implemented: a blocked side loses its turn; if neither side has a legal move, the encounter ends with **Tablas** and offers **Reiniciar encuentro**. Human and AI use the same legal-move source.

## Factions and starting bands

Playable factions are **Verde** (alfil), **Roja** (torre) and **Amarilla** (caballo). A starting band contains rey, reina, peón and the selected faction's special piece. The tutorial opponent remains Verde.

Production factions currently fall back to the CSS chess-token presentation when final faction artwork is not configured. The artwork infrastructure is already ready for separate `north` / `south` assets per faction and piece type.

## Remaining work / next focus

The main unresolved UI items are:

- implement engine-level pause semantics so AI timers/state truly pause and resume;
- replace placeholder notebook section content with level-specific content as level design matures;
- implement the shared-notebook menu-to-level transition animation once the level composition is considered stable;
- replace development placeholder obstacle/facing artwork with final production assets when available.

The menu-to-level transition should animate the start-menu elements away while the notebook travels from its menu position to the in-level position and board elements appear. This remains intentionally deferred until the current level UI and deployment interaction are stable.

## Local development

Open the project through an HTTP static server rather than directly with `file:///`, because Chromium may block JavaScript modules from local files.

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
4. the relevant system contract in `docs/`
5. the relevant implementation files

After implementation, update the affected documentation, commit and push before moving to another device/environment.
