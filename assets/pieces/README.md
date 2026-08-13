# Piece assets

Store faction-specific piece artwork in subfolders, for example:

- `assets/pieces/verdant/rook.webp`
- `assets/pieces/verdant/bishop.webp`
- `assets/pieces/cinder/rook.webp`

Then register each file in `src/content/factions.js` under the faction's `pieceAssets` map.

Transparent WebP or PNG works best. The renderer falls back to the current chess glyph automatically when no artwork is registered or an image fails to load.
