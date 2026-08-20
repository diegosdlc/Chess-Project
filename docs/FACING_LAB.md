# Facing lab

`facing-lab` is a development-only level for validating the piece orientation model introduced for faction-specific front/back artwork.

## Access

Open any level, select the **Ajustes** notebook tab and press **Laboratorio de orientación**. The same level is directly addressable with `?level=facing-lab`.

## What it validates

The board contains paired test pieces for the three current faction-specific special pieces:

- green bishops;
- red rooks;
- yellow knights.

Each pair starts with one unit facing `north` and the other facing `south`. The lab uses simple SVG placeholders whose labels make the active orientation explicit.

Moving a player piece in this level calls the normal `GameState.turnAround()` path before the unit leaves its origin. The next render therefore resolves the opposite artwork through `AssetRegistry.pieceAsset()`.

The lab keeps the player turn after each movement so several orientation changes can be tested consecutively. Both behaviors are gated by `level.testing` and are not enabled in production levels.

## Test-only asset override

Lab units use a unit-local `pieceAssets` map. This lets the test exercise the same `north` / `south` resolution contract without registering temporary art as the official artwork of the green, red or yellow factions.

The normal lookup order is:

1. unit-local test artwork, when supplied;
2. faction artwork for `faction -> pieceType -> facing`;
3. the existing chess glyph fallback when no bitmap/vector asset is available.

When final faction artwork is available, the lab can be switched from the placeholders to those real assets without changing the orientation state model.
