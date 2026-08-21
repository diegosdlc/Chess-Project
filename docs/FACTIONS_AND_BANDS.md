# Factions and starting bands

This document is the implementation contract for factions, starting bands, piece facing and tutorial faction selection in **Turn Over**.

## Playable factions

| Internal id | Display name | Special piece |
| --- | --- | --- |
| `green` | Verde | Alfil (`bishop`) |
| `red` | Roja | Torre (`rook`) |
| `yellow` | Amarilla | Caballo (`knight`) |

Player-facing faction and piece names stay deliberately simple. Add descriptive names only if the product direction changes explicitly.

Faction definitions live in `src/content/factions.js`. Each definition supplies its id, display name, special piece, palette and optional piece artwork. `PLAYER_FACTION_IDS` is the allowlist used by the new-game selector and session validation.

## Starting-band contract

Every starting band contains exactly four pieces:

1. Rey (`king`)
2. Reina (`queen`)
3. Peón (`pawn`)
4. The faction's special piece

`createInitialBand()` in `src/content/bands.js` is the authoritative factory. It combines the shared piece catalogue with a faction definition, level-specific starting coordinates and an explicit initial facing. Levels should use this factory instead of copying the four units by hand.

Each generated unit receives:

- a stable id in the form `<team>-<pieceType>`;
- its controlling `team`;
- its origin `faction`;
- its `facing` on the board;
- the plain Spanish piece name and chess glyph;
- its shared movement profile;
- its evolution profile and current evolution stage;
- the coordinates supplied by the level.

`team`, `faction` and `facing` are intentionally independent. A piece can change controlling band or turn around without changing its faction identity or artwork family.

For levels with pre-match deployment, the deployment team's declared starting coordinates are cleared when `GameState.reset()` enters the deployment phase. The band/faction/facing data remains intact while the player chooses the final deployment coordinates. See `docs/DEPLOYMENT.md`.

## Piece facing

Pieces currently support two board-relative orientations:

- `north`
- `south`

The constants are exported as `FACINGS` by `src/content/bands.js`. Facing describes where the unit is looking on the board, not whether the camera currently sees its front or back.

The tutorial starts the two bands facing each other:

- player pieces start `north`;
- enemy pieces start `south`.

Facing is state, not a rendering-only transform. `GameState.setFacing(unit, facing)` assigns an explicit orientation and `GameState.turnAround(unit)` swaps `north` and `south`.

Movement does **not** automatically change facing. Any future rule that rotates a unit must do so explicitly. Facing also has no effect on legal movement unless a specific future rule chooses to read it.

## Tutorial behavior

Choosing **Nueva partida** opens the faction selector before the tutorial begins. The selected faction determines the player's fourth piece:

- Verde starts with Rey, Reina, Peón and Alfil;
- Roja starts with Rey, Reina, Peón and Torre;
- Amarilla starts with Rey, Reina, Peón and Caballo.

The tutorial opponent is always Verde and therefore always starts with Rey, Reina, Peón and Alfil.

`createTutorial01()` in `src/content/levels/tutorial-01.js` builds a fresh level definition for the chosen player faction. The level registry calls level factories rather than returning one shared mutable tutorial object.

The tutorial now begins with player deployment. The player band is created with its faction and north-facing state, then held off-board until the player places all four pieces on rows `6` and `7` and presses **Iniciar partida**. The enemy green band keeps its declared starting coordinates and south-facing state.

Resetting the tutorial recreates the selected faction, initial facing, obstacles and deployment phase from the active level definition.

Opening a level directly with `?level=tutorial-01` is a development shortcut and uses Verde as the default player faction. The normal **Nueva partida** flow always asks the player to choose.

## Piece graphics and faction colours

Current production pieces still use the CSS token treatment when no bitmap artwork is configured: a coloured gradient token, light border, shadow and chess glyph. The fallback remains valid while faction-specific artwork is produced.

Piece artwork belongs to the **origin faction**, not to the controlling team. Each faction can define a different graphic for every piece type and both orientations. The target `pieceAssets` contract is:

```js
pieceAssets: {
  king: {
    north: './assets/pieces/green/king-north.webp',
    south: './assets/pieces/green/king-south.webp'
  },
  queen: {
    north: './assets/pieces/green/queen-north.webp',
    south: './assets/pieces/green/queen-south.webp'
  }
}
```

`AssetRegistry.pieceAsset()` resolves artwork as `faction -> pieceType -> facing`. It also accepts the previous single-string piece asset shape as a compatibility fallback.

This means a recruited red rook remains visually a red rook even if another band controls it, while its `facing` may change independently during play.

The current `facing-lab` can override piece artwork per unit with temporary north/south SVGs so the orientation contract can be tested before final faction art is available. This test-only override does not make those SVGs production faction artwork.

Green has role-specific fallback palettes:

- player-controlled green is light;
- AI-controlled green is dark.

`AssetRegistry.piecePalette()` selects the team-specific green palette. Red and yellow currently use their configured fallback palettes. When a green player faces the green tutorial opponent, result and turn messages use **Verde clara** and **Verde oscura** to remain unambiguous.

## Movement and AI

Movement remains independent of faction and facing. Units point to the shared profiles in `src/core/rules.js`, and both player interaction and the AI consume the same legal-action generator.

The six available profiles are:

| Piece | Movement profile |
| --- | --- |
| Rey | One square in any direction |
| Reina | Orthogonal and diagonal lines |
| Alfil | Diagonal lines |
| Caballo | L-shaped jump |
| Torre | Orthogonal lines |
| Peón | Team-relative forward move and diagonal capture |

Turn Over does not currently implement chess check, checkmate, castling, promotion or the pawn's initial two-square move.

## Session persistence

An in-progress session stores:

- the level id;
- selected player faction;
- serialized units, including each unit's current `facing` and coordinates;
- active turn;
- finished state;
- lifecycle `phase` (`deployment` or `play`).

Because facing is part of the serialized unit state, orientation persists automatically. During deployment, placed pieces keep their chosen coordinates while undeployed pieces remain off-board with null coordinates.

`GameSessionStore` validates the player faction against `PLAYER_FACTION_IDS` before allowing **Continuar partida**.

The session schema is version `5`. Older snapshots are intentionally ignored because they do not contain the complete evolution-use state required for Torre+ and the shared royal swap. The legacy browser-storage key itself remains unchanged.

## Relevant files

- `src/content/factions.js` — faction identities, special pieces, palettes and faction-specific artwork definitions.
- `src/content/bands.js` — piece catalogue, `FACINGS` and reusable starting-band factory.
- `src/content/levels/tutorial-01.js` — faction-aware tutorial factory, obstacles, deployment and initial facing.
- `src/content/levels/index.js` — normal level factory registry.
- `src/content/levels/labs/index.js` — mechanics-lab registry.
- `src/main.js` — faction-selection, deployment and level startup flow.
- `src/core/GameState.js` — mutable unit state, facing operations and deployment phase.
- `src/systems/GameSessionStore.js` — faction-aware session snapshots, including unit facing and lifecycle phase.
- `src/systems/AssetRegistry.js` — team-aware palette selection and faction/type/facing artwork lookup.
- `src/core/rules.js` — shared movement profiles and legal actions.
- `src/ai/AIController.js` — shared piece values and search.
- `docs/DEPLOYMENT.md` — deployment contract.
- `docs/FACING_LAB.md` — orientation test scenario.

## Extending the system

When adding a new level that starts from standard bands:

1. Define coordinates for Rey, Reina, Peón and every special piece that the level can instantiate.
2. Choose the initial `facing` for each band explicitly.
3. Call `createInitialBand()` separately for the player and enemy teams.
4. If the level uses deployment, add the `deployment` configuration and remember that the deployment team's declared coordinates will be cleared until placement is confirmed.
5. Keep faction choice, facing and deployment in level configuration; do not branch inside the rules engine or AI for a specific level id.
6. Ensure generated ids remain unique within the level.
7. Validate that deployment has enough legal cells when enabled, or that every starting piece has appropriate legal movement when deployment is not used.

When adding final art for a faction, define the available piece sprites under that faction's `pieceAssets`, keyed first by `pieceType` and then by `north` / `south`.

Adding a fourth playable faction also requires updating `FACTIONS`, `PLAYER_FACTION_IDS`, the new-game selector and its player-facing documentation.
