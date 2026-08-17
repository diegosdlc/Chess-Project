# Turn Over — Current Work

Last updated: 2026-08-17

## Project naming

The official game name is **Turn Over**. Historical working names **Bandas del Tablero** and **Chess Project** are no longer product names. The repository name and existing browser-storage keys remain unchanged as legacy technical identifiers until an explicit migration is implemented.

## Active task

Implement the first game UI layer: an illustrated start screen, an in-game settings entry point and resumable local sessions.

## UI implementation status

Implemented and merged to `main`.

- `index.html` opens on a start screen with **Nueva partida**, **Continuar partida** and **Ajustes**.
- The game board includes an in-corner gear button that opens the same settings dialog.
- The settings dialog is intentionally a visual placeholder for future music, difficulty and controls options.
- A session snapshot is saved in browser local storage after a game starts and after each completed move. It records the active level, pieces and active turn; it deliberately does not retain a transient selected piece or an unfinished capture prompt.
- Finished matches clear the in-progress session. Campaign progression continues to use `ProgressionStore`.
- UI styling uses a paper-cut / hand-drawn pencil language across the start screen, buttons, dialogs and interaction states.
- The project must be opened through an HTTP static server (for example `npx http-server -p 4173` and then `http://localhost:4173`), rather than by double-clicking `index.html`. Chrome can show the CSS through `file:///` while blocking the JavaScript modules that make the buttons work.

## Previous task: turn lifecycle

### Required behavior

1. Whenever a side is about to take a turn, obtain its legal moves using the authoritative rules/move-generation layer.
2. If at least one legal move exists, continue the turn normally.
3. If no legal move exists, show a message naming that side and automatically pass/lose its turn.
4. Check whether the opposing side has any legal move.
5. If the opposing side can move, continue with that side's turn.
6. If neither side can move, end the encounter as a draw.
7. Show the user the exact status message **`Tablas`**.
8. Show a **`Reiniciar encuentro`** button after the draw notification; restart from the active level's declared initial state when the player presses it.
9. Human and AI turns must use the same rule and legal-move source.
10. The implementation must remain reusable for future levels, custom starting positions, obstacles/special cells and new piece types.

## Architectural intent

Do not solve this by adding an isolated special case only to the AI or only to click handling.

The turn/lifecycle layer should be able to answer the equivalent of:

- does the active side have any legal moves?
- if not, can the opponent move?
- should the turn be passed or should the encounter end in a draw?

The AI should treat a no-move state consistently with the game lifecycle and must not fabricate an illegal move.

The reset path should reuse the existing level initialization/lifecycle rather than hard-code the current board position.

## Acceptance checks

Validate at minimum these scenarios:

- Human has legal moves -> no behavior change.
- AI has legal moves -> no behavior change.
- Human has zero legal moves and AI has one or more -> a specific turn-lost message is shown, then AI proceeds after confirmation.
- AI has zero legal moves and human has one or more -> a specific turn-lost message is shown, then control returns to human after confirmation.
- Human and AI both have zero legal moves -> `Tablas` and a `Reiniciar encuentro` button are shown.
- After restart, the board/state matches the active level's initial configuration.
- Repeated turn checks do not create an infinite loop.
- Existing capture/movement rules still work.

If automated tests exist or can be added cleanly, cover the turn-resolution logic with deterministic states. Otherwise perform focused manual/browser validation and record what was checked in the commit/PR summary.

## Status

**Implemented and merged.**

The turn lifecycle reads legal actions from the shared rules layer. A blocked side shows a `Turno perdido` message naming that faction, then passes when the player presses `Continuar`. If the opposing side is also blocked, the game shows `Tablas` and a `Reiniciar encuentro` button. The active level restarts from its declared initial state when the player presses that button. The same lifecycle is used before human and AI turns.

## Next session

Before implementation on Windows:

```bash
git status
git switch main
git pull --ff-only origin main
```

Then read:

1. `PROJECT_CONTEXT.md`
2. this file
3. `README.md`
4. the relevant implementation files

After implementation, update this file to record completion/remaining issues, commit and push to GitHub before moving back to the Android/cloud environment.
