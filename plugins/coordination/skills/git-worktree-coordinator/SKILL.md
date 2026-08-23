---
name: git-worktree-coordinator
description: Coordinate multiple agents that can write to the same Git repository by isolating each writer in its own Git worktree and branch, and by verifying that isolation before every edit. Load this automatically whenever you are about to delegate implementation work to two or more agents, are already running alongside another agent in the same checkout, need to create/assign/inspect/finish/remove a worktree, are about to integrate branches produced by parallel agents, or notice signs of existing agent worktrees/branches (an `agents/*` branch, a sibling `<repo>.<branch>` worktree directory, an `agent-worktrees` registry under `.git`, a `worktrunk`/`wt` install). Also load it when the user asks for parallel development, splitting work across agents, task isolation, or avoiding merge conflicts between agents. Do NOT load it for read-only/research tasks, explaining Git concepts, a single agent working alone in one checkout, or ordinary branch operations that involve no isolation between concurrent writers.
compatibility: Linux environment with POSIX sh, Git (>=2.7, with `git worktree list --porcelain`), and worktrunk (`wt`, https://worktrunk.dev); requires a skills-compatible agent harness.
---

# Git Worktree Coordinator

Deterministic, harness-neutral coordination for multiple agents writing to the same Git repository. It builds on [worktrunk](https://worktrunk.dev) (`wt`) rather than reimplementing worktree mechanics: worktrunk already handles worktree creation, path templating, hooks, and safe branch cleanup well. What worktrunk has no concept of - and what this skill adds - is **exclusive, atomic ownership**: a real mutex-backed claim registry and a `verify` check that proves which agent, if any, legitimately owns the worktree a process is standing in. All of that lives in `scripts/worktree-coordinator`, a single POSIX `sh` CLI - no Python, Node, `jq`, or harness APIs required, beyond the `wt` binary itself.

`create` and `remove` shell out to `wt switch --create` and `wt remove`. Every other command (`claim`, `verify`, `release`, `finish`, `list`, `prune`) is pure Git + the claim registry, and works on a worktree regardless of whether `wt` created it.

## Decide before delegating

Classify each piece of work first; only writers with real overlap risk need isolation.

| Situation | Action |
|---|---|
| Research, reading, review, analysis, single agent writes | **No worktree.** Don't create one just because multiple agents are involved - if all but one are read-only, only the writer needs anything, and even it doesn't need isolation if no one else can touch its checkout. |
| Two+ agents will edit files, independent features/fixes, parallel tests that write tracked files, independent migrations | **Separate worktree per writer.** Each gets its own branch and directory via `create`. |
| Heavy file overlap, a schema change others depend on, a sweeping cross-cutting refactor, or a harness that cannot give each agent its own working directory | **Serialize instead.** Parallel worktrees don't fix contention that lives in the work itself or in the harness's inability to route agents to different directories. |

Favor parallelism only when tasks are genuinely independent. When in doubt, serialize - a slower correct run beats a fast racy one.

## What this skill can and cannot guarantee

It **can** guarantee, via Git and the scripts here: exclusive branches, a shared on-disk ownership registry, atomic claim/release, and a `verify` check that proves - by actually inspecting the filesystem and Git state a process is standing in - whether that process is really in its assigned worktree on its assigned branch.

It **cannot** make a harness launch or `cd` a subagent into the assigned directory. Whether isolation actually holds in practice depends on step 3 of the protocol below (the coordinator routing each worker to its path). If your harness has no way to set a per-agent working directory or force every command to run with an explicit path, **say so explicitly and serialize writers instead of claiming isolation you can't verify.** Never assert isolation is in effect without having run `verify` from inside the worker's actual process.

## Coordinator/worker protocol

1. Coordinator creates one worktree per writable task: `worktree-coordinator create --task <task> --agent <agent> [--base <ref>]`. This makes an exclusive branch (`agents/<agent>/<task>`), an exclusive worktree outside the main checkout, and an atomic claim, in one step.
2. Coordinator captures the printed absolute `path` and `branch`.
3. Coordinator starts or directs the worker at that exact path (sets the subagent's `cwd`, or - if the harness can't do that - tells the worker to run every command with that path explicit, e.g. `git -C <path>` or an explicit `cd`).
4. Worker confirms its own directory and runs `worktree-coordinator verify --agent <agent>` **before its first edit**, and again after any directory change, session resume, or context compaction. `verify` must be run from inside the worktree itself - it checks the process's real location, not a claimed one.
5. Worker edits, tests, and commits only inside that worktree.
6. Worker hands off state through commits, not loose files: it runs `worktree-coordinator finish --agent <agent>` and reports the printed branch, path, and commit back to the coordinator.
7. Coordinator verifies and integrates branches one at a time (see `references/integration-strategies.md`) - `finish` never integrates automatically.
8. Coordinator releases or removes the worktree only after integration: `release` (keep worktree+branch, drop the claim) or `remove` (delegates to `wt remove`, never `rm -rf`; refuses on a dirty tree; deletes the branch only when it's provably safe unless `--confirm-unmerged`/`--keep-branch` says otherwise).

## Command surface

```
worktree-coordinator doctor
worktree-coordinator list [--porcelain]
worktree-coordinator create --task TASK --agent AGENT [--base REF]
worktree-coordinator claim  --agent AGENT --path PATH [--task TASK] [--branch BRANCH]
worktree-coordinator verify --agent AGENT [--path PATH]
worktree-coordinator release --agent AGENT [--path PATH]
worktree-coordinator finish --agent AGENT [--path PATH] [--report]
worktree-coordinator remove --agent AGENT [--path PATH] [--confirm-unmerged] [--keep-branch]
worktree-coordinator prune [--dry-run] [--apply] [--git-prune]
```

Run any command with `--help`, or the CLI with no arguments, for full usage. Every failure exits non-zero with a plain-text reason on stderr; `list --porcelain` is the stable machine-readable form (blank-line-separated `key=value` records).

`verify` and `finish` are **cwd-bound**: they check the process's actual current directory and are meant to be run by the worker, standing inside its own worktree. `release` and `remove` are **registry-bound**: they resolve the target from the claim (optionally cross-checked against `--path`) and are meant to be run by the coordinator, typically from the main checkout - they never require you to `cd` into a worktree you're about to remove.

`create` and `remove` require `wt` on `PATH`; `doctor` reports its presence and version. If it's missing, install it (`cargo install worktrunk`, `brew install worktrunk`, etc. - see https://worktrunk.dev) rather than falling back to raw `git worktree` commands, so the whole fleet of worktrees stays consistent with whatever path template/hooks the project has configured.

Full registry layout, locking, and rollback behavior: `references/coordination-protocol.md`. Integration strategies for the coordinator, including worktrunk's own `wt merge`: `references/integration-strategies.md`.

## Non-negotiables

- No `create`/`claim` ever targets the main checkout; no `remove` ever touches it.
- Never `fetch`, `pull`, `push`, or otherwise touch the network - everything resolves from local refs. (A project's own `wt` hooks are its own opt-in configuration, not something this skill triggers itself - see the hooks/approval note below.)
- Never `--force` a worktree removal, `git reset --hard`, `git clean -fd`, `git checkout --`/`git restore` to discard changes, `branch -D`, or a destructive rebase/push. `remove` deletes a branch automatically only when `wt remove`'s own integration check says it's safe; `--confirm-unmerged` force-deletes an unmerged one, `--keep-branch` always preserves it. Removing the *worktree* itself never requires either flag - `wt` never loses commits by removing a worktree, since the branch ref survives on its own.
- `finish` reports; it never integrates. Integration order and strategy stay a coordinator decision.
- If `verify` fails for any reason - wrong path, wrong branch, conflicting claim, stale registry - stop and fix that before touching any file. Don't work around a failed `verify`.
- `create` will hang waiting on a TTY if the target repo defines project hooks (`.config/wt.toml`) that haven't been approved yet - pre-approve with `wt config approvals add` before delegating to non-interactive agents. Don't silently work around an approval prompt by re-running with `-y`/`--yes` unless you've actually reviewed what the hooks execute.
