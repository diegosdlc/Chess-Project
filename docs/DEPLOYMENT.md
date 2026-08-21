# Pre-match deployment

This document defines the reusable pre-match deployment contract for **Turn Over**.

## Purpose

A level may require one band to choose its starting formation before turn 1. During this phase the deployment team's pieces are kept off-board, shown over the notebook and placed manually into a level-defined deployment zone.

Deployment is a lifecycle phase, not a sequence of normal moves. Movement rules, AI turns and tutorial progression do not begin until deployment is explicitly confirmed.

## Level configuration

A level opts into deployment with a `deployment` block:

```js
deployment: {
  team: 'player',
  rows: [6, 7]
}
```

- `team` identifies which controlling band deploys.
- `rows` contains the legal board `y` coordinates for placement.

The tutorial currently deploys the player on rows `6` and `7`, the two rows nearest the player in the current board coordinate system.

The contract is intentionally data-driven so future levels may use different rows without changing core UI or rules code.

## Lifecycle

`GameState.reset()` sets:

- `phase = 'deployment'` when the level defines `deployment`;
- `phase = 'play'` otherwise.

When deployment begins, active units belonging to the deployment team have their board coordinates cleared (`x = null`, `y = null`). Their other state, including origin `faction` and `facing`, is preserved.

The non-deploying team remains at the coordinates defined by the level.

Normal turn resolution is suspended while `phase === 'deployment'`.

## Placement validation

`GameState` is authoritative for deployment validity.

A deployment cell is legal only when:

1. `x` and `y` are inside the current board size;
2. `y` belongs to the configured deployment rows or to rows granted by that unit's evolution capabilities;
3. no other active unit occupies the cell;
4. no blocking `boardElement` occupies the cell.

The UI may highlight valid/invalid placement zones, but it must not implement a separate interpretation of these rules.

Placed deployment pieces may be selected again and moved to another valid deployment cell before play starts.

## Completion and start action

Deployment is complete only when every active deployment-team unit:

- has coordinates on a valid deployment cell;
- occupies a unique cell;
- does not overlap a blocking board element.

Only then is **Iniciar partida** available.

Calling the start action transitions the state to `phase = 'play'`, clears selection and starts normal turn resolution. The player begins the current tutorial encounter.

## Notebook and board UI

During deployment:

- the notebook's normal page/tabs content is temporarily hidden;
- the deployment panel shows the available band and placement status;
- the selected piece can come either from the notebook panel or from a piece already placed on the board;
- deployment rows/cells receive board highlighting;
- the start button appears when deployment is complete.

After **Iniciar partida**, the normal notebook sections return.

## Session persistence

`GameSessionStore` stores the lifecycle `phase` with the serialized units and active turn.

This allows **Continuar partida** to resume a partially completed deployment with already placed units at their chosen coordinates and undeployed units still off-board.

For compatibility, a schema-compatible saved state that has no `phase` field is treated as normal play rather than being forced back into deployment.

Unit `facing` is serialized as part of each unit and therefore survives deployment/session restoration automatically.

## Reset behavior

Resetting the level rebuilds state from the active level definition. For a level with deployment this means:

- returning to `phase = 'deployment'`;
- clearing the deployment team's board coordinates again;
- restoring the non-deploying team's declared coordinates;
- restoring each unit's initial faction/facing/state from the level definition.

Do not reset deployment by manually reconstructing the tutorial formation in controller/UI code.

## Interaction with other systems

### Facing

Deployment changes coordinates only. It must not rotate a unit or alter its origin faction. Initial facing still comes from the level/band definition.

### Caballo+

An evolved knight extends its own legal deployment depth to four rows from its controlling edge. This is unit-specific: selecting Caballo+ highlights the additional rows, while base pieces continue using the rows declared by the level.

### Obstacles

Blocking `boardElements` invalidate deployment cells. This uses the same blocking content contract that movement rules use during play.

### AI

AI scheduling is disabled during deployment. The AI is considered part of normal play and starts only after deployment confirmation and turn resolution.

### Tutorial

Tutorial steps do not render/advance during deployment. Tutorial progression starts after **Iniciar partida**.

### Capture/frozen-piece state

Deployment happens before normal captures. The deployment validator works with active units and blocking board elements; it does not treat frozen-prisoner pass-through rules as deployment-placement rules.

## Notebook access during deployment

Deployment uses the **Banda** section of the notebook, but it does not lock notebook navigation. **Misión**, **Reglas** and **Ajustes** remain visible and interactive throughout setup. Returning to **Banda** restores the deployment panel with the current placement state intact.

Notebook section content scrolls vertically when it exceeds the available paper area, so long settings and mechanics-lab lists remain reachable during deployment and normal play.

## Relevant files

- `src/content/levels/tutorial-01.js` — current deployment configuration.
- `src/core/GameState.js` — deployment phase, validation, placement and completion logic.
- `src/main.js` — deployment interaction, start action, session/lifecycle orchestration.
- `src/render/BoardRenderer.js` — deployment cell state passed into board rendering.
- `src/deployment.css` — notebook deployment panel and board highlights.
- `src/systems/GameSessionStore.js` — phase persistence.
- `index.html` — deployment panel markup.

## Extending deployment

When adding deployment to another level:

1. Add a `deployment` block with the correct team and legal rows.
2. Ensure there are enough non-blocking cells for every deployment unit.
3. Keep initial unit facing explicit in the level/band factory.
4. Test that existing blocking board elements cannot be selected as deployment cells.
5. Test partial-session restore during deployment.
6. Test reset returns to a clean deployment phase.
7. Confirm AI/tutorial logic remains inactive before **Iniciar partida**.

If future deployment rules need shapes other than whole rows, extend the level configuration and `GameState` validation contract rather than hard-coding a specific level in the UI.
