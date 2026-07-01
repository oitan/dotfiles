## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
- Make the plan multi-phase.

Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".

We want the simplest change possible. We don't care about migration. Code readability matters most, and we're happy to make bigger changes to achieve it.

NEVER code or make changes before asking for approval.

## Agent Progress Tracker

Create a tracker file **only when the user explicitly asks for one** (signal:
multiple agents running concurrently and might collide on the same files).
Do NOT create trackers otherwise — even for large tasks.

**Path:** `<repo-root>/.agent-progress/<UTC-ts>-<slug>.md` where `<UTC-ts>`
is `YYYYMMDDTHHMMSSZ` and `<slug>` is a short kebab-case task name.
Example: `20260701T143205Z-add-progress-tracker.md`.
The directory is globally gitignored via `~/.gitignore_global` — safe to
write, never commits.

**Template (fixed sections — do not rename):**

`````md
# Progress: <task title>

- **Started:** 2026-07-01T14:32:05Z
- **Agent:** claude-code (or codex / gemini / other)
- **Status:** in-progress | blocked | ready-to-commit

## Task
<one-line goal>

## Touched Files
- app/foo.ts
- app/bar.tsx

## Log
- 14:32 started, exploring app/
- 14:45 pattern found in helpers.ts
- 15:02 wrote fix in foo.ts
`````

**Update rules:**

- Every file edit → add path to `Touched Files` (dedup).
- Phase change, blocker, or status flip → append `Log` line with UTC `HH:MM`.
- Main agent owns the tracker. Subagents share the same file — main agent
  logs their key output.
- Any internal task-list state (session-private) is invisible to other
  agents. Log major task state changes in the tracker so concurrent
  Claude / Gemini sessions can see progress.

**Delete rule:** after `git commit` succeeds AND every path in `Touched
Files` appears in the commit → `rm` the tracker file. Partial commit → keep
tracker, update `Log` with what remains.

**Abandoned trackers:** no auto-cleanup. Manual sweep of stale files under
`.agent-progress/` when noticed.

@/Users/oitan/.codex/RTK.md
