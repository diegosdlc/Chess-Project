# Piece evolution and carried bands

Evolution is shared campaign state, not standard chess promotion. For the current prototype, a piece that already belongs to the player band evolves when it survives a victorious encounter and continues into the next level. Destroyed pieces and player pieces captured by the enemy do not continue. Enemy prisoners still present after victory join the player band and preserve their origin faction, but they do not evolve during that transition. Once a recruit has played an encounter as a band member, it may evolve by surviving a later victory.

Rey+ and Reina+ are a joint evolution: both must survive in the carried band. If either is missing, a base royal partner does not evolve by itself.

## State and persistence

Every catalogue piece declares an `evolutionProfile`. Units persist:

- `evolutionStage`: `base` or `evolved`;
- optional `evolutionState` for per-encounter consumable uses.

`src/core/evolution.js` owns profile capabilities, event conditions and consumable state. `src/core/campaign.js` evolves active player survivors first, then adds new prisoners without evolving them, removes losses and normalizes control for the next deployment.

`ProgressionStore.playerBand` keeps the complete carried roster between levels. The in-progress session schema is version `5` and also stores `teamEvolution`, so spent shields and royal swaps remain spent after using **Continuar partida**. Starting or resetting a new encounter recharges its one-use abilities from the level definition.

## Implemented capabilities

### Peón+

- Moves one cell in either vertical direction.
- Captures on all four adjacent diagonals.
- A base pawn evolves immediately when a move or capture reaches the opposite edge.

### Caballo+

- Keeps normal knight movement.
- During deployment it may use the first four rows measured from its controlling side.
- Other pieces remain restricted to the level's normal deployment rows.

### Alfil+

- Keeps every normal diagonal destination.
- On reaching a non-corner board edge along a clear diagonal, it may reflect once and continue in the same move.
- The reflected component reverses on the edge that was hit.
- Corners end the path, and active pieces or blocking board elements stop the path before a rebound.
- It may capture after the rebound; capture still ends the path.

### Torre+

- Starts each encounter with one shield charge.
- The first capture or destruction attempt against it is rejected before resolving damage.
- The attacker is placed on the cell immediately beyond the rook in the direction of its original movement.
- If that cell is outside the board, occupied, frozen or blocked, the attacker remains on its origin cell; the rook still survives and the charge is consumed.
- Later attacks resolve normally.

### Rey+ and Reina+

- When both evolved pieces are active, selecting either exposes the other as a special destination.
- The action exchanges their board coordinates without capturing or changing facing/faction.
- The pair shares one swap charge per encounter.
- If either member is missing or inactive, the action is unavailable.

## Level transition

`tutorial-01` now unlocks `tutorial-02`. Level 2 reuses the same board, obstacles, opponent, deployment phase, music and AI configuration as level 1. Its player units come from the carried campaign band rather than `createInitialBand()`:

1. active player pieces survive;
2. destroyed pieces and player prisoners are removed;
3. eligible pieces that already belonged to the band evolve;
4. surviving enemy prisoners recruited by the player are then added without evolving;
5. the resulting roster is persisted and deployed in level 2.

Opening `?level=tutorial-02` without a saved carried band creates an evolved default band for direct development testing. Add `&faction=green`, `&faction=red` or `&faction=yellow` to test Alfil+, Torre+ or Caballo+ directly. A real carried band always takes precedence over this shortcut.

## Manual validation

In level 2:

- select Caballo+ during deployment and confirm rows `4` through `7` are available;
- select Alfil+ near a diagonal edge and inspect destinations after the rebound;
- attack Torre+ twice and confirm only the first attack is rejected;
- select Rey+ or Reina+ and use the purple double-bordered destination on its partner once;
- select Peón+ away from an edge to inspect both moves and all available diagonals.

The existing `pawn-evolution-lab` includes a base pawn one move from the opposite edge plus focused Peón+ movement and capture scenarios.
