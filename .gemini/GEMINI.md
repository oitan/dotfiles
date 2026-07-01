# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

⚠️ **Name collision**: If `rtk gain` fails, you may have reachingforthejack/rtk (Rust Type Kit) installed instead.

## Hook-Based Usage

All other commands are automatically rewritten by the Claude Code hook.
Example: `git status` → `rtk git status` (transparent, 0 tokens overhead)

Refer to CLAUDE.md for full command reference.

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
  Claude / Codex sessions can see progress.

**Delete rule:** after `git commit` succeeds AND every path in `Touched
Files` appears in the commit → `rm` the tracker file. Partial commit → keep
tracker, update `Log` with what remains.

**Abandoned trackers:** no auto-cleanup. Manual sweep of stale files under
`.agent-progress/` when noticed.
