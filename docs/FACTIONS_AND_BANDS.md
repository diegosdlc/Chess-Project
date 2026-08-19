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
- the coordinates supplied by the level.

`team`, `faction` and `facing` are intentionally independent. A piece can change controlling band or turn around without changing its faction identity or artwork family.

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

`createTutorial01()` in `src/content/levels/tutorial-01.js` builds a fresh level definition for the chosen player faction. The level registry calls level factories rather than returning one shared mutable tutorial object. Resetting a match consequently restores the correct selected formation and initial facing from the active level definition.

Opening a level directly with `?level=tutorial-01` is a development shortcut and uses Verde as the default player faction. The normal **Nueva partida** flow always asks the player to choose.

## Piece graphics and faction colours

Current pieces still use the CSS token treatment when no bitmap artwork is configured: a coloured gradient token, light border, shadow and chess glyph. The fallback remains valid while faction-specific artwork is produced.

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

`AssetRegistry.pieceAsset()` resolves artwork as `faction -> pieceType -> facing`. It also accepts the previous single-string piece asset shape as a temporary compatibility fallback.

This means a recruited red rook remains visually a red rook even if another band controls it, while its `facing` may change independently during play.

Green has role-specific fallback palettes:

- player-controlled green is light;
- AI-controlled green is dark.

`AssetRegistry.piecePalette()` selects the team-specific green palette. Red and yellow currently use one player palette each. When a green player faces the green tutorial opponent, result and turn messages use **Verde clara** and **Verde oscura** to remain unambiguous.

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

An in-progress session stores the level id, selected player faction, units and active turn. Because units are serialized as state, their current `facing` is persisted automatically.

`GameSessionStore` validates the faction against `PLAYER_FACTION_IDS` before allowing **Continuar partida**.

The session schema is version `3`. Version `2` snapshots are intentionally ignored because their units do not contain explicit facing. The legacy browser-storage key itself remains unchanged.

## Relevant files

- `src/content/factions.js` — faction identities, special pieces, palettes and faction-specific artwork definitions.
- `src/content/bands.js` — piece catalogue, `FACINGS` and reusable starting-band factory.
- `src/content/levels/tutorial-01.js` — faction-aware tutorial factory, coordinates and initial facing.
- `src/content/levels/index.js` — level factory registry.
- `src/main.js` — faction-selection flow and level startup.
- `src/core/GameState.js` — mutable unit state plus explicit facing operations.
- `src/systems/GameSessionStore.js` — faction-aware session snapshots, including unit facing.
- `src/systems/AssetRegistry.js` — team-aware palette selection and faction/type/facing artwork lookup.
- `src/core/rules.js` — shared movement profiles and legal actions.
- `src/ai/AIController.js` — shared piece values and search.

## Extending the system

When adding a new level that starts from standard bands:

1. Define coordinates for Rey, Reina, Peón and every special piece that the level can instantiate.
2. Choose the initial `facing` for each band explicitly.
3. Call `createInitialBand()` separately for the player and enemy teams.
4. Keep faction choice and initial facing in level configuration; do not branch inside the rules engine or AI.
5. Ensure generated ids remain unique within the level.
6. Validate that every starting piece has at least one legal move and that the opening does not contain accidental immediate captures.

When adding final art for a faction, define the available piece sprites under that faction's `pieceAssets`, keyed first by `pieceType` and then by `north` / `south`.

Adding a fourth playable faction also requires updating `FACTIONS`, `PLAYER_FACTION_IDS`, the new-game selector and its player-facing documentation.
