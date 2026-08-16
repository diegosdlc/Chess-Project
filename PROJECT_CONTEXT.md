# Chess Project — Shared Project Context

This document is the durable context for development of **Bandas del Tablero / Chess Project** across different ChatGPT environments and devices.

## Source of truth

**GitHub is the single source of truth for code, assets, project documentation and current work state.**

Repository: `diegosdlc/Chess-Project`
Default branch: `main`

Do not treat a ChatGPT conversation, a Windows checkout, an Android/cloud session, or an unpushed local file as authoritative. Durable decisions must end up in this repository.

Before changing code, read this file, `CURRENT_WORK.md`, `README.md`, and the relevant source files. If conversation context conflicts with the repository, inspect Git history/current code and resolve the discrepancy explicitly rather than silently assuming the conversation is newer.

## Product direction

The project started as a lightweight chess-derived browser game and is evolving into a more complete game with custom rules and content. The architecture should support:

- multiple levels with declarative starting positions and level-specific configuration;
- custom artwork for different factions and pieces;
- board artwork independent from game geometry;
- obstacles, props and special board cells;
- music and sound assets;
- tutorial tooltips anchored to pieces, cells or the board;
- campaign/progression state;
- reusable AI whose difficulty can increase between levels;
- future new piece types and rule changes without rewriting the AI from scratch.

Keep game rules/state separate from rendering whenever practical. The UI should consume the rules engine rather than duplicate movement logic.

## Current architecture

The repository currently uses a data-driven browser architecture with no required build step.

Important areas:

- `src/main.js` — application controller, turn/lifecycle orchestration and level lifecycle.
- `src/core/` — game state, board geometry and movement/rules logic.
- `src/ai/` — AI implementation. It should consume legal moves produced by the rules engine rather than maintain a second set of chess rules.
- `src/render/` — board, pieces and terrain rendering.
- `src/systems/` — assets, audio, progression and tutorial systems.
- `src/content/factions.js` — faction identity and faction-specific piece artwork.
- `src/content/levels/` — declarative level definitions and registry.
- `assets/boards/` — board artwork.
- `assets/pieces/` — faction-specific piece artwork.
- `assets/music/` — music and sound effects.
- `assets/board-elements/` — obstacles, props and special-tile artwork.

See `README.md` for the repository's current concrete structure. When architecture changes materially, update both documents.

## Established game/design decisions

These decisions come from the development history and should be preserved unless explicitly changed:

1. This is **not standard chess**. Chess is the base vocabulary, but game-specific rules take precedence.
2. White and black pawns move in opposite directions.
3. Pawns do not inherit standard-chess behavior automatically; movement/capture behavior must follow the project's implemented rules.
4. The board uses custom artwork and game coordinates/movement must remain aligned with that artwork/projection.
5. The intended play UI is deliberately minimal: the board/background and pieces are primary; avoid adding permanent informational chrome unless required by a level or tutorial.
6. Capture interaction has been designed around contextual controls emerging from/near the piece being captured rather than a conventional detached modal.
7. Assets must be loadable as real repository files because future levels depend on custom board, faction, piece and board-element artwork.
8. Level definitions should be able to supply their own starting state and assets.
9. The AI should be reusable across levels. Prefer generic legal-move generation + evaluation/search over hard-coding each level into the AI.
10. AI difficulty should be tunable per level (for example through search depth, evaluation parameters or other configuration) without duplicating the AI implementation.
11. Adding a new piece/rule should primarily extend the rules/move-generation layer. The AI should automatically benefit from those legal moves where possible.
12. The game opens on a start screen. In-progress sessions are persisted in browser local storage as a level id plus board state and active turn; selections and incomplete capture choices are intentionally transient. Completed matches clear that session, while campaign progression remains separate.
13. The current UI language is paper-cut collage with pencil-like linework. Prefer CSS-native texture and hand-drawn treatment for UI chrome; keep the game board and piece artwork data-driven.

## Turn-blocking rule

The agreed rule for positions with no legal moves is:

- At the start of a turn, determine whether the active side has any legal move.
- If it has at least one legal move, play continues normally.
- If it has zero legal moves, that side **loses/passes its turn automatically**.
- Before simply returning control, determine whether the other side can move.
- If neither side has any legal move, the encounter ends in **draw**.
- Display the message **`Tablas`**.
- After the draw notification, restart the encounter from the level's initial state.
- This behavior must be identical for the human player and AI.
- Implement this at the game-rules/turn lifecycle level, not as an AI-only or UI-only workaround.
- The reset must use the current level's declared initial state so the mechanism remains valid for future levels with different pieces, obstacles, special cells and rules.

See `CURRENT_WORK.md` for implementation status.

## Development principles

### One rules engine

Legal movement is authoritative. Rendering, interaction and AI should call the same movement/rules layer. Avoid separate human and AI interpretations of what is legal.

### Data-driven levels

Prefer configuration/content files for level-specific setup, assets and difficulty. Avoid scattering level IDs through core game logic.

### AI extensibility

Search/evaluation should operate on generic game states and legal successor states. New pieces may require evaluation tuning, but should not require rewriting the search algorithm merely to become movable.

### Reset from level definition

Do not reset a game by manually reconstructing today's tutorial board. Recreate/clone the initial state from the active level definition so future levels work automatically.

### Minimal UI

Keep permanent UI minimal. Temporary/tutorial/status UI is acceptable when it communicates necessary game state, such as `Tablas` before an automatic reset.

## Cross-device workflow

Development happens in two main environments:

### Windows — local project

The local checkout is the preferred environment for substantial implementation, refactors, running local servers/tests, inspecting multiple files and manipulating assets.

At the beginning of a Windows session:

```bash
git status
git switch main
git pull --ff-only origin main
```

If there is unfinished work on another branch, do not discard it. Inspect `git status`, the branch and GitHub before switching.

Create a focused branch for non-trivial work when appropriate:

```bash
git switch -c feature/<short-description>
```

Before ending the session, ensure valuable work is committed and pushed. Do not leave the only copy of important work on the PC.

### Android — cloud project

The cloud/Android environment works against the GitHub repository rather than a Windows filesystem. Before making changes, inspect the latest GitHub state and `CURRENT_WORK.md`.

Do not assume that a Windows chat's conversational context is available. The repository documentation is the handoff mechanism.

Any durable Android/cloud changes must be committed to GitHub. When returning to Windows, pull before continuing.

## Git workflow

GitHub coordinates both environments.

Recommended rules:

1. Start by synchronizing/reading GitHub.
2. Keep `main` usable.
3. Use focused branches for changes that benefit from review or involve multiple files/refactors.
4. Use concise commits describing one coherent change.
5. Push before changing device/environment.
6. Pull/fetch before resuming work elsewhere.
7. Never overwrite remote work merely because a local checkout is older.
8. Resolve conflicts using the actual intent documented in `PROJECT_CONTEXT.md`, `CURRENT_WORK.md`, code and Git history.
9. For tiny documentation corrections, direct commits to `main` are acceptable when intentional; substantive game changes should preferably use a branch/PR when the workflow permits.

## Session handoff protocol

At the start of any ChatGPT coding session, the agent should:

1. Read `PROJECT_CONTEXT.md`.
2. Read `CURRENT_WORK.md`.
3. Read `README.md`.
4. Inspect `git status`/current branch when local, or the current GitHub branch/commits when cloud-based.
5. Inspect the relevant implementation before proposing architectural changes.

At the end of a session that changes the project, the agent should:

1. Update code/assets.
2. Run the relevant available validation.
3. Update `CURRENT_WORK.md` if task status, decisions, blockers or next steps changed materially.
4. Update `PROJECT_CONTEXT.md` if a durable product/architecture rule changed.
5. Commit with a meaningful message.
6. Push to GitHub.
7. Report the branch/commit/PR and any validation or remaining blocker.

## Avoiding divergence

- Never maintain separate "Windows rules" and "Android rules".
- Never use chat history as the only record of an architectural decision.
- Do not duplicate source files just to make one environment work.
- Do not make an Android/cloud change based on an old snapshot when GitHub has newer commits.
- Do not force-push over work from another environment unless explicitly resolving a known history problem.
- If `CURRENT_WORK.md` says a task is in progress, inspect its branch/commit status before starting a second implementation.

## Maintaining these docs

`PROJECT_CONTEXT.md` contains durable context and decisions. Keep it concise enough to read at the start of a coding session.

`CURRENT_WORK.md` contains the active implementation target, acceptance criteria, status and immediate next steps. It is expected to change frequently.

`README.md` remains the user/developer-facing description of how the repository is structured and run.
