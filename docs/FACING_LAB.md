# Facing lab

`facing-lab` is the first mechanics laboratory in Turn Over. It validates the piece-orientation model introduced for faction-specific front/back artwork and also serves as the reference implementation for future test levels.

## Access

Open any level, select the **Ajustes** notebook tab and choose **Orientación de piezas** under **Laboratorios de mecánicas**. The same level is directly addressable with `?level=facing-lab`.

The Ajustes list is generated from the mechanics-lab registry. No UI change is required when another lab is registered.

## What it validates

The board contains paired test pieces for the three current faction-specific special pieces:

- green bishops;
- red rooks;
- yellow knights.

Each pair starts with one unit facing `north` and the other facing `south`. The lab uses simple SVG placeholders whose labels make the active orientation explicit.

Moving a player piece calls the normal `GameState.turnAround()` operation through a generic level lifecycle hook before the unit leaves its origin. The next render therefore resolves the opposite artwork through `AssetRegistry.pieceAsset()`.

The lab keeps the player turn after each movement so several orientation changes can be tested consecutively. This behavior is configured by the lab and is not enabled in normal levels.

## Shared mechanics-lab framework

Mechanics labs are registered in `src/content/levels/labs/index.js`. The registry provides the lab id, display name, description and level factory. `src/level-ui.js` reads that registry to build the Ajustes menu automatically.

Common board geometry and artwork live in `src/content/levels/shared.js` as `STANDARD_BOARD`, so a new lab does not need to duplicate the isometric projection.

Lab-specific lifecycle behavior is created with `createLabBehavior()` from `src/content/levels/labs/behavior.js`. It produces generic level hooks consumed by `GameState`; the core state does not contain conditions for individual lab ids or mechanics.

## Test-only asset override

Lab units use a unit-local `pieceAssets` map. This lets the test exercise the same `north` / `south` resolution contract without registering temporary art as the official artwork of the green, red or yellow factions.

The lookup order is:

1. unit-local test artwork, when supplied;
2. faction artwork for `faction -> pieceType -> facing`;
3. the existing chess glyph fallback when no artwork is available.

When final faction artwork is available, the lab can switch from placeholders to real assets without changing the orientation state model.
