# Piece assets

The current factions intentionally use the CSS token graphics and do not register bitmap artwork. The existing files are retained as unused references.

If a future level needs faction-specific artwork, store it in subfolders, for example:

- `assets/pieces/green/bishop.webp`
- `assets/pieces/red/rook.webp`
- `assets/pieces/yellow/knight.webp`

Then register each file in `src/content/factions.js` under the faction's `pieceAssets` map.

Transparent WebP or PNG works best. The renderer falls back to the current chess glyph automatically when no artwork is registered or an image fails to load.
