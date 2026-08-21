# Piece evolution

Evolution is a shared unit-state system. It is not pawn promotion and it is not exclusive to one piece type. Each piece evolution may define its own activation condition and its own capabilities.

## State and profiles

An evolvable unit declares:

- `evolutionProfile` — the profile that owns its condition and capabilities;
- `evolutionStage` — `base` or `evolved`.

`src/core/evolution.js` is the profile registry and the only place that decides whether an evolution event activates a profile. `GameState.resolveEvolution()` is the generic entry point for gameplay events. Completed moves already emit `move-completed`; future profiles can consume that event or add another domain event without placing piece-specific conditions in the controller, renderer or AI.

An evolved profile exposes a `capabilities` object. The first supported capability is a replacement movement profile, consumed by the shared rules engine. Future evolutions may add other explicit capabilities and their owning systems should read them from the same profile instead of checking a piece id directly.

Evolution is permanent for the current unit. `evolutionStage` is authoritative game state, survives leaving the activation square, resets from the level definition and is serialized with the rest of the unit in session schema version `4`.

## Pawn evolution

The pawn is the first implemented profile.

- A player pawn evolves after completing a move or capture on row `0`.
- An enemy pawn evolves after completing a move or capture on the last board row.
- Before evolution it moves one cell toward the opposite edge and captures on the two forward diagonals.
- After evolution it moves one cell in either vertical direction and captures an opponent on any of the four adjacent diagonals.
- Blocking elements, active units and frozen-piece rules continue to use the common movement helpers.

The same state transition runs for human actions and AI simulation. The renderer adds a small star to any evolved unit as temporary observable feedback independent of final piece artwork.

## Pawn evolution lab

Open **Ajustes → Laboratorios de mecánicas → Evolución del peón** or use `?level=pawn-evolution-lab`.

The scenario keeps the player turn and contains:

- one base pawn at `(0, 1)`, one move away from its marked evolution cell `(0, 0)`;
- four evolved pawns, each paired with an enemy on a different capture diagonal;
- an enemy anchor that prevents the encounter from ending while targets remain.

Move the base pawn to the marked edge, select it again and verify that it can return. Select the four starred pawns to verify movement in both directions and captures to north-west, north-east, south-west and south-east. Press `R` at any time to reset the scenario.

## Adding another evolution

1. Give the piece catalogue entry an `evolutionProfile`.
2. Add that profile's condition and capabilities to `src/core/evolution.js`.
3. Emit any new generic domain event through `GameState.resolveEvolution()`.
4. Extend only the systems that own new capability types; do not branch on a level id or unit id.
5. Add rule tests for both teams, persistence after activation and interaction with blockers/captures where relevant.
6. Add or extend a mechanics lab when repeated manual validation benefits from a prepared board.
