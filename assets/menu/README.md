# Start menu artwork

The illustrated start screen uses full-canvas artwork aligned to a 1536×960 composition. The background is opaque; the title and three button layers preserve transparency and their authored position on that shared canvas.

## Files currently used by `index.html`

- `menu-background (20260817070941).webp` — opaque background artwork.
- `title-turn-over (20260817071053).webp` — transparent title layer.
- `btn-new-game (20260817071132).webp` — transparent New Game layer.
- `btn-continue (20260817071201).webp` — transparent Continue layer.
- `btn-settings (20260817071231).webp` — transparent Settings layer.

The timestamp suffixes are part of the filenames currently stored in GitHub, so the application references those exact paths. If these files are later renamed to cleaner filenames, update `index.html` in the same commit so the deployed site never points at missing assets.

Keep all transparent layers at the original 1536×960 canvas size and position. `src/home-screen.css` deliberately stacks the full-canvas layers so the composition stays aligned when the viewport is resized or cropped. The title entrance and button hover/tap feedback are CSS animations applied to those layers; the artwork itself should remain static.
