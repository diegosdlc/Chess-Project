# Factions and starting bands

This document is the implementation contract for factions, starting bands and tutorial faction selection in **Turn Over**.

## Playable factions

| Internal id | Display name | Special piece |
| --- | --- | --- |
| `green` | Verde | Alfil (`bishop`) |
| `red` | Roja | Torre (`rook`) |
| `yellow` | Amarilla | Caballo (`knight`) |

Player-facing faction and piece names stay deliberately simple. Add descriptive names only if the product direction changes explicitly.

Faction definitions live in `src/content/factions.js`. Each definition supplies its id, display name, special piece and palette. `PLAYER_FACTION_IDS` is the allowlist used by the new-game selector and session validation.

## Starting-band contract

Every starting band contains exactly four pieces:

1. Rey (`king`)
2. Reina (`queen`)
3. Peón (`pawn`)
4. The faction's special piece

`createInitialBand()` in `src/content/bands.js` is the authoritative factory. It combines the shared piece catalogue with a faction definition and level-specific starting coordinates. Levels should use this factory instead of copying the four units by hand.

Each generated unit receives:

- a stable id in the form `<team>-<pieceType>`;
- its owning `team` and selected `faction`;
- the plain Spanish piece name and chess glyph;
- its shared movement profile;
- the coordinates supplied by the level.

## Tutorial behavior

Choosing **Nueva partida** opens the faction selector before the tutorial begins. The selected faction determines the player's fourth piece:

- Verde starts with Rey, Reina, Peón and Alfil;
- Roja starts with Rey, Reina, Peón and Torre;
- Amarilla starts with Rey, Reina, Peón and Caballo.

The tutorial opponent is always Verde and therefore always starts with Rey, Reina, Peón and Alfil.

`createTutorial01()` in `src/content/levels/tutorial-01.js` builds a fresh level definition for the chosen player faction. The level registry calls level factories rather than returning one shared mutable tutorial object. Resetting a match consequently restores the correct selected formation from the active level definition.

Opening a level directly with `?level=tutorial-01` is a development shortcut and uses Verde as the default player faction. The normal **Nueva partida** flow always asks the player to choose.

## Piece graphics and faction colours

Current pieces use the original CSS token treatment: a coloured gradient token, light border, shadow and chess glyph. No current faction assigns bitmap piece artwork. The files under `assets/pieces/` remain unused references and the optional asset lookup is retained for future content.

Green has role-specific palettes:

- player-controlled green is light;
- AI-controlled green is dark.

`AssetRegistry.piecePalette()` selects the team-specific green palette. Red and yellow currently use one player palette each. When a green player faces the green tutorial opponent, result and turn messages use **Verde clara** and **Verde oscura** to remain unambiguous.

## Movement and AI

Movement remains independent of faction. Units point to the shared profiles in `src/core/rules.js`, and both player interaction and the AI consume the same legal-action generator.

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

An in-progress session stores the level id, selected player faction, units and active turn. `GameSessionStore` validates the faction against `PLAYER_FACTION_IDS` before allowing **Continuar partida**.

The session schema is version `2`. Older snapshots used the previous faction model and are intentionally ignored, preventing old `verdant` or `cinder` units from being mixed with the current factions. The legacy browser-storage key itself remains unchanged.

## Relevant files

- `src/content/factions.js` — faction identities, special pieces and palettes.
- `src/content/bands.js` — piece catalogue and reusable starting-band factory.
- `src/content/levels/tutorial-01.js` — faction-aware tutorial factory and coordinates.
- `src/content/levels/index.js` — level factory registry.
- `src/main.js` — faction-selection flow and level startup.
- `src/systems/GameSessionStore.js` — faction-aware session snapshots.
- `src/systems/AssetRegistry.js` — team-aware palette selection and optional artwork lookup.
- `src/core/rules.js` — shared movement profiles and legal actions.
- `src/ai/AIController.js` — shared piece values and search.

## Extending the system

When adding a new level that starts from standard bands:

1. Define coordinates for Rey, Reina, Peón and every special piece that the level can instantiate.
2. Call `createInitialBand()` separately for the player and enemy teams.
3. Keep faction choice in level configuration; do not branch inside the rules engine or AI.
4. Ensure generated ids remain unique within the level.
5. Validate that every starting piece has at least one legal move and that the opening does not contain accidental immediate captures.

Adding a fourth playable faction also requires updating `FACTIONS`, `PLAYER_FACTION_IDS`, the new-game selector and its player-facing documentation.
