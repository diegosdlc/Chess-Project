# Start menu artwork

The illustrated start screen uses full-canvas artwork aligned to a 1536×960 composition.

Expected files:

- `menu-background.webp` — opaque background artwork.
- `title-turn-over.webp` — transparent 1536×960 layer containing the positioned Turn Over title.
- `btn-new-game.webp` — transparent 1536×960 layer containing the positioned New Game artwork.
- `btn-continue.webp` — transparent 1536×960 layer containing the positioned Continue artwork.
- `btn-settings.webp` — transparent 1536×960 layer containing the positioned Settings artwork.

Keep the transparent layers at the same canvas size and position used in the source composition. The CSS deliberately stacks those full-canvas layers instead of cropping them, so the design stays aligned when the viewport is resized or cropped.
