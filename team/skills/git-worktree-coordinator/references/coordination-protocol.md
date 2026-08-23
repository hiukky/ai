# Coordination protocol: registry, locking, rollback

Read this when you need the mechanics behind `worktree-coordinator` - what it stores, how it stays race-free, and exactly what it guarantees when something goes wrong mid-operation. Everyday usage only needs `SKILL.md`.

## Invariants

1. Each writer agent has exactly one active worktree claim per repository.
2. Each managed worktree has at most one owning agent.
3. Every writable task gets an exclusive branch (`agents/<agent>/<task>`, with a numeric suffix only if that exact name is already taken).
4. Two agents can never hold a claim on the same worktree path at once.
5. The main checkout is never a `create`/`claim` target and `remove` refuses it even from a hand-edited registry entry.
6. Read-only agents can share context freely; nothing here grants them implicit write permission.
7. `verify` re-checks reality immediately before a write, not just at claim time.
8. Work moves between agents via commits on the claimed branch, never via loose modified files.
9. `remove` requires a clean tree and a known registry match; branch deletion happens only when `wt remove`'s own integration check says it's safe, unless overridden.
10. No destructive Git flag (`--force`, `-D`, `--hard`, `-fd`) is ever added automatically.
11. A crash mid-operation leaves state that `doctor`/`list`/`prune` can diagnose, never silent corruption.
12. Integration order is always the coordinator's call - the tool never merges on its own.

## Dependencies

`doctor` checks for both: Git (>=2.7, for `git worktree list --porcelain`; `git worktree lock --reason` is used opportunistically if the installed Git supports it, plain `git worktree lock` otherwise) and worktrunk's `wt` binary (checked via `command -v`; no version floor is enforced beyond it existing and running `--version`, since `create`/`remove` only rely on stable, long-documented flags: `switch --create/--base/--no-cd/--format=json` and `remove/-D/--no-delete-branch/--format=json/--foreground`). `claim`, `verify`, `release`, `finish`, `list`, and `prune` never invoke `wt` at all, so they keep working even if it's temporarily missing or a worktree was created by hand.

## Repository discovery

The CLI never assumes `.git` is a directory - it is a plain file in every linked worktree. Discovery always goes through Git itself, resolved to canonical (symlink-free) absolute paths:

- `git rev-parse --show-toplevel` - the current worktree's root.
- `git rev-parse --git-dir` - this worktree's own git-dir (`.../worktrees/<name>` for a linked one).
- `git rev-parse --git-common-dir` - the one git-dir shared by the whole worktree family; this is where the registry lives.
- `git worktree list --porcelain` - the authoritative worktree list. Its **first record is always the main worktree**, regardless of which worktree you query from; the tool relies on this instead of guessing from a directory name. Human-readable `git worktree list` output is never parsed.
- `git symbolic-ref --quiet --short HEAD` - current branch; failure means detached HEAD, which the tool always treats as a hard stop for claim-related checks.

A path containing a tab or a newline is rejected outright (`has_bad_path_chars`) rather than parsed ambiguously - the porcelain format has no quoting for those bytes, so there is no safe way to disambiguate them.

## Registry layout

Everything lives under the shared git-common-dir, never inside the working tree, never committed:

```
<git-common-dir>/agent-worktrees/
  .lock/                     mkdir-based mutex for registry mutations
    owner                    pid=, host=, time=, cmd= (plain key=value lines)
  claims/
    by-agent/<agent>/info    one claim, keyed by the (sanitized) agent id
    by-path/p_<hash>/info    the same claim, keyed by a cksum hash of the canonical path
  .tmp/                      scratch space for atomic writes (temp file + mv)
```

Each `info` file is `key=value` lines: `agent`, `task`, `branch`, `path` (canonical), `base` (resolved commit at creation time, for `finish`'s ahead-count; not used for "is this merged" checks - see below), `common_dir`, `created`, `pid`, `locked` (whether `git worktree lock` is holding it).

Both directories for a claim are written from the same in-memory record, so `by-agent` and `by-path` always agree while the writer holds the lock. `list`/`doctor` flag a mismatch as `inconsistent` if the two ever disagree (only possible via manual tampering).

## Locking and atomicity

Every registry mutation (`create`, `claim`, `release`, `finish`'s none - it only reads -, `remove`, `prune --apply`) holds a single mutex directory, `.lock`, acquired with `mkdir` - atomic on any local POSIX filesystem, so there is no separate check-then-write race. The lock is held for the whole read-modify-write transaction (e.g. "is this branch/path free, then create it, then register the claim"), not just the final write.

- Acquiring: `mkdir .lock` succeeds -> caller writes `owner` (pid/host/time/cmd) and installs `trap ... EXIT INT TERM HUP`.
- Busy: if `.lock` already exists, its age is checked against `WTC_STALE_LOCK_SECS` (default 30). Older than that -> immediate, explicit **stale lock** error with the recovery command printed (`rmdir` after you've confirmed no coordinator process is actually running). Newer -> the caller retries for up to that same window, then gives up with a **busy lock** error. Neither case is ever broken automatically or silently - see "Recovering a stuck lock" below.
- Releasing: the trap (or the normal end-of-command path) removes `owner` then `.lock`.

`git worktree lock`/`unlock` is a *different* mechanism - it only stops Git itself from pruning/moving/removing a worktree. It is opportunistically applied when a claim is created (with `--reason` if the installed Git supports it) and is not, by itself, proof of agent ownership; the registry is the source of truth for that.

Per-claim uniqueness (one worktree per agent, one agent per worktree) is enforced *inside* that locked section: `by-agent/<agent>/info` existing with a different path refuses a new claim; `by-path/<hash>/info` existing under a different agent refuses too. Re-claiming the exact same agent+path is treated as an idempotent refresh, not an error.

## Creation and rollback

`create` runs its whole branch search, the `wt switch --create` call, opportunistic `git worktree lock`, and claim registration inside one locked section:

1. Refuse fast if the agent already holds a different claim - nothing is created yet.
2. Search `agents/<agent>/<task>`, then `-1`, `-2`, ... up to 20 suffixes, for a branch name with no existing ref. Unlike the branch name, the worktree's *path* is not this tool's to pick - `wt switch --create <branch> --base <base-sha> --no-cd --format=json` computes it from worktrunk's own `[worktree-path]` template (a sibling directory by default: `<repo>.<branch|sanitize>`) and returns it in the JSON `path` field. `--no-cd` means no shell integration is required for this scripted, non-interactive call.
3. worktrunk's own hooks may run here (`pre-start`, then `post-start` in the background) - see the SKILL.md non-negotiable about unapproved project hooks blocking on a TTY prompt.
4. Register the claim using the `path` worktrunk returned. If this step fails (only realistically possible via manual tampering, since the branch search already ran inside the lock), the just-created worktree and branch are removed again with `wt remove -D <branch>`. `-D` (force-delete) is safe specifically here: the branch is this same invocation's own not-yet-claimed artifact with zero commits beyond its base, not pre-existing data - worktrunk's own safe-by-default deletion could otherwise, in principle, retain a branch relative to a non-default `--base`.

Rollback only ever removes artifacts *this invocation* just created. It never touches a pre-existing claim, worktree, or branch belonging to someone else - the tests in `tests/run.sh` (group 15/16) verify this by killing a `create` mid-flight with `SIGKILL` (uncatchable, so no trap runs) and checking an unrelated pre-existing claim is byte-for-byte unchanged afterward.

`wt switch --create` prints one JSON line on stdout and human/approval-prompt text on stderr; the two are captured separately (never merged with `2>&1`) so the JSON extraction never has to skip over prose. `json_string_field` is a narrow, single-purpose scraper for this - not a general JSON parser - safe here because these particular fields (`path`, `branch_outcome`) are plain strings worktrunk emits without embedded quotes.

## What survives an uncatchable interruption

`SIGKILL` cannot be trapped, so a `create` killed after worktrunk has created the worktree but before the claim is written leaves: the branch and worktree directory (Git and worktrunk already know about them - nothing is hidden), no registry claim for that agent/path, and the `.lock` directory still held. This is the expected, diagnosable partial-failure state:

- `git worktree list --porcelain` still shows the orphaned worktree.
- `worktree-coordinator list` does not show a claim for it.
- Any further registry-mutating command reports the lock as busy (or stale, once the timeout passes) instead of guessing.

**Recovering a stuck lock**: confirm no coordinator process is actually still running (check the pid/host printed in the error, or in `.lock/owner`), then remove it manually exactly as instructed:

```sh
rm -f '<git-common-dir>/agent-worktrees/.lock/owner'
rmdir '<git-common-dir>/agent-worktrees/.lock'
```

After that, the orphaned worktree from the interrupted `create` can simply be adopted with `claim --agent <agent> --path <path>` if it's still useful, or removed by hand (`wt remove -D <branch>`, or `git worktree remove`) if not - nothing about it is unsafe to inspect first.

## `verify` vs. `release`/`remove`: cwd-bound vs. registry-bound

`verify` and `finish` require the invoking process's *actual* current directory to be the claimed worktree - that is their entire purpose: proving where a process really is, not trusting what it claims. They read `git symbolic-ref --short HEAD` and `pwd`-style state without `-C`, on purpose.

`release` and `remove` deliberately do **not** require that - they resolve the target from the registry (optionally cross-checked against an explicit `--path`) and operate on it via `git -C <target>`. This matches how a coordinator actually works: it typically sits in the main checkout and needs to remove a worktree it is *not* standing inside (you cannot usefully `git worktree remove` the directory your own shell is currently in). Requiring a `cd` first would be both impossible in some cases and pointless busywork in the rest.

## `remove`'s branch-safety check

`remove` itself only checks: the claim resolves and matches (agent, path, branch, common-dir), the target isn't the main checkout/`$HOME`/`/`/common-dir/git-dir, and the working tree is clean (no `--force` is ever passed). Everything about whether the *branch* is safe to delete is delegated to `wt remove`'s own six-condition integration check (same-commit, ancestor, no-added-changes, trees-match, merge-adds-nothing, patch-id-match - see `wt remove --help` or worktrunk's docs) rather than reimplemented here, because that check already handles squash-merge and rebase workflows correctly, which a simple `git merge-base --is-ancestor` does not.

Concretely: plain `wt remove <branch>` always removes the worktree once it's confirmed clean, and deletes the branch only if that check says it's safe - otherwise the branch is silently retained (not an error; nothing is lost, since the commits still exist on that ref). `--confirm-unmerged` adds `-D` (force-delete even if unmerged). `--keep-branch` adds `--no-delete-branch` (always retain, and wins if both flags are given). Removing the worktree itself is never gated on merge status - only on a clean tree - since deleting a worktree directory can't lose committed work as long as the branch ref survives, which it always does unless force-deleted.

## Prune's conservatism

`prune` defaults to dry-run with no flag needed to get that behavior; `--dry-run` is accepted for explicitness. With `--apply`, it clears registry metadata for a claim **only** when both are true: the worktree's directory is gone from disk *and* `git worktree list --porcelain` no longer lists it. A missing directory alone is never enough - that could be a transient mount issue, not evidence the worktree is truly gone - so a `missing-dir` finding (directory absent, but Git still lists it) is reported but left untouched. `--git-prune` (only meaningful combined with `--apply`) additionally runs `git worktree prune`, which only ever cleans Git's own stale administrative entries, never anything the registry doesn't already agree is gone.
