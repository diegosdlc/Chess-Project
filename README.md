# Turn Over

A browser strategy game with data-driven levels, factions, deployment, campaign progression, evolution and mechanics-test levels. There is no build step: serve the repository with a static HTTP server and open `index.html`.

Do not open `index.html` directly with `file:///`; Chromium may block ES modules.

## Project structure

- `src/main.js` — application controller, deployment and turn lifecycle.
- `src/core/` — game state, geometry, movement, evolution and campaign transition.
- `src/ai/` — reusable AI over shared legal actions.
- `src/render/` — board, piece and terrain rendering.
- `src/systems/` — assets, audio, sessions, progression and tutorials.
- `src/content/factions.js` — faction identity, palettes and optional artwork.
- `src/content/bands.js` — piece catalogue, starting-band factory and facing constants.
- `src/content/balance.js` — runtime parser/helpers for the editable point-balance table.
- `src/content/levels/` — production levels and mechanics-lab scenarios.
- `src/content/levels/labs/` — mechanics-lab registry and reusable test behavior.
- `src/level-ui.js` / `src/level-ui.css` — notebook UI.
- `src/deployment.css` — deployment/lineup UI and board-zone highlighting.
- `assets/` — menu, board, piece, music and board-element assets.
- `docs/` — durable system contracts and balance data.

## Adding a level

1. Create a level factory in `src/content/levels/`.
2. Give it a unique `id` and define its board, teams, units and optional content.
3. Register normal campaign levels in `src/content/levels/index.js`.
4. Set `nextLevelId` when a victory should unlock the next encounter.
5. Add/verify the level point limit in `docs/BALANCE.md`.

Levels can define board artwork/projection, arbitrary units/factions, initial facing, deployment, music, blockers, special tiles, tutorial steps, behavior hooks, AI difficulty and campaign progression.

## Deployment, lineup and point budget

A level can opt into deployment with configuration equivalent to:

```js
deployment: {
  team: 'player',
  rows: [6, 7],
  pointLimit: 18
}
```

For budgeted deployment, the complete carried player roster starts off-board. The player chooses the current encounter lineup by placing pieces. Every placed piece spends its point cost; pieces kept off-board are **reserve**, spend zero points and remain inactive for the encounter.

Placed pieces can be repositioned or **Retirar** to refund their cost. Occupied cells and blocking `boardElements` remain invalid deployment cells. Evolved Caballo+ may receive additional deployment rows through its evolution capability.

**Iniciar partida** becomes available when at least one selected piece is validly placed and the lineup is within the level budget. The player does not need to spend every point.

All base/evolved piece costs and per-level limits are edited in [`docs/BALANCE.md`](docs/BALANCE.md), which the browser reads at runtime. If a level is not listed, the balance layer falls back to the calculated enemy-band value; explicit limits are checked against that enemy value and warn when they diverge.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Current provisional balance

| Piece | Base | Evolved |
| --- | ---: | ---: |
| Peón | 2 | 3 |
| Alfil | 4 | 6 |
| Caballo | 4 | 6 |
| Torre | 4 | 6 |
| Reina | 7 | 9 |
| Rey | 5 | 7 |

The current tutorial enemy band is worth **18 points**, so levels 1 and 2 currently use an 18-point limit. These numbers are intentionally easy to iterate in `docs/BALANCE.md`.

## Factions, bands and facing

Playable factions are **Verde**, **Roja** and **Amarilla**. A new starting band contains rey, reina, peón and its faction special piece: alfil, torre or caballo respectively. The tutorial opponent is always Verde.

Units keep `team`, origin `faction` and `facing` as independent state. Facing is `north` or `south` and does not automatically change on movement. Optional artwork resolves by faction, piece type and facing; production factions can fall back to CSS chess tokens.

See [`docs/FACTIONS_AND_BANDS.md`](docs/FACTIONS_AND_BANDS.md).

## Evolution and carried roster

Evolution is a generic state/profile system. Peón+, Caballo+, Alfil+, Torre+ and the Rey+/Reina+ pair are implemented.

A base pawn can evolve immediately at the opposite edge. Between victorious encounters, only pieces that **participated and survived** evolve. Pieces kept in deployment reserve carry forward unchanged. Newly recruited prisoners join without evolving and become eligible after participating in and surviving a later encounter.

Evolution raises deployment cost through `docs/BALANCE.md`. A fully evolved four-piece default band currently exceeds the 18-point level-2 limit, so deployment becomes a real choice rather than automatically fielding every piece.

See [`docs/EVOLUTION.md`](docs/EVOLUTION.md).

## Obstacles

Blocking `boardElements` participate in the shared movement rules and deployment validation. Sliding pieces stop at blockers, no unit may land on them, and knights can jump over them without landing on them. Human and AI use the same legal-action source.

## Mechanics labs

Registered mechanics labs are addressable with `?level=<lab-id>` and automatically appear under **Ajustes → Laboratorios de mecánicas**. Labs exercise the same engine operations as production gameplay and keep test-only behavior in generic level hooks.

Current labs include `facing-lab` and `pawn-evolution-lab`.

See [`docs/MECHANICS_LABS.md`](docs/MECHANICS_LABS.md).

## Progression and local session

`ProgressionStore` tracks completed/unlocked levels, recruits and the complete carried player roster. The encounter lineup is selected separately during deployment; reserve pieces remain part of that carried roster.

Session schema `6` saves in-progress units (including facing, evolution and reserve state), turn, lifecycle phase and team evolution uses. **Continuar partida** can resume an interrupted lineup/deployment. Completed encounters clear the in-progress session while campaign progression remains.

## Useful development URLs

- `?level=tutorial-01&tutorial=1` — force tutorial tooltips.
- `?level=<level-id>` — open a normal level or mechanics lab directly.
- `?level=tutorial-02&faction=<green|red|yellow>` — direct evolved-band development shortcut when there is no saved carried roster.

## Project documentation

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — durable architecture/product decisions and workflow.
- [`CURRENT_WORK.md`](CURRENT_WORK.md) — current merged baseline and remaining work.
- [`docs/BALANCE.md`](docs/BALANCE.md) — runtime-editable point costs and level budgets.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment, lineup/reserve and budget contract.
- [`docs/EVOLUTION.md`](docs/EVOLUTION.md) — evolution and carried-roster contract.
- [`docs/FACTIONS_AND_BANDS.md`](docs/FACTIONS_AND_BANDS.md) — faction/band/facing/artwork contract.
- [`docs/MECHANICS_LABS.md`](docs/MECHANICS_LABS.md) — mechanics-lab workflow.
