# Chess Project — Current Work

Last updated: 2026-08-14

## Active task

Implement the agreed **no-legal-moves / draw** turn lifecycle rule.

### Required behavior

1. Whenever a side is about to take a turn, obtain its legal moves using the authoritative rules/move-generation layer.
2. If at least one legal move exists, continue the turn normally.
3. If no legal move exists, automatically pass/lose that side's turn.
4. Check whether the opposing side has any legal move.
5. If the opposing side can move, continue with that side's turn.
6. If neither side can move, end the encounter as a draw.
7. Show the user the exact status message **`Tablas`**.
8. Restart the encounter from the active level's declared initial state after the draw notification.
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
- Human has zero legal moves and AI has one or more -> human turn is skipped and AI proceeds.
- AI has zero legal moves and human has one or more -> AI turn is skipped and control returns to human.
- Human and AI both have zero legal moves -> `Tablas` is shown and the encounter restarts.
- After restart, the board/state matches the active level's initial configuration.
- Repeated turn checks do not create an infinite loop.
- Existing capture/movement rules still work.

If automated tests exist or can be added cleanly, cover the turn-resolution logic with deterministic states. Otherwise perform focused manual/browser validation and record what was checked in the commit/PR summary.

## Status

**Pending implementation.**

The rule has been agreed and documented, but no code change for it should be assumed until the implementation commit is present in GitHub.

## Next session

The next coding session is expected to run from the **Windows local project**.

Before implementation:

```bash
git status
git switch main
git pull --ff-only origin main
```

Then read:

1. `PROJECT_CONTEXT.md`
2. this file
3. `README.md`
4. the relevant files under `src/core/`, `src/ai/` and `src/main.js`

After implementation, update this file to record completion/remaining issues, commit and push to GitHub before moving back to the Android/cloud environment.
