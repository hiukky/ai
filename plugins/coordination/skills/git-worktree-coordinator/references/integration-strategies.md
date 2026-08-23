# Integration strategies for the coordinator

`finish` never integrates anything - it only reports whether a worktree is clean, what commit it's on, and how many commits it has beyond its recorded base. Integrating finished work into the target branch is always a decision the coordinator makes explicitly, one branch at a time. This document is what to consider when making it; the tool has no opinion baked in.

## Before integrating anything

For each worktree reporting ready:

1. `worktree-coordinator verify --agent <agent>` (run by the worker, or by the coordinator with `-C <path>` equivalents) to confirm the branch and claim still line up - branches can drift if someone checks out something else inside the worktree after `finish`.
2. Confirm it's actually clean: `finish` already checked this, but re-check if time has passed.
3. Read the commits: `git log <base>..<branch>` - don't integrate a branch you haven't looked at.
4. Estimate file overlap against other branches about to be integrated: `git diff --name-only <base>..<branch>` for each, compare the sets. Heavy overlap between two "independent" branches is a sign they should have been serialized, not parallelized - resolve that consciously rather than discovering it as a wall of conflicts.

## Picking a strategy

None of these are chosen automatically by the tool - pick deliberately per branch:

- **`wt merge [<target>]`** (run from inside the finished worktree): worktrunk's own local-CI pipeline - commits any remaining changes, squashes to one commit, rebases onto the target, runs the project's `pre-merge` hooks (tests/lint/build, if configured), fast-forwards the target, then removes the worktree and branch in one step (respecting the same safe-deletion check `worktree-coordinator remove` relies on). Good default when the project has `pre-merge` hooks worth enforcing and a squashed, linear history is fine. `--no-squash` preserves individual commits, `--no-ff` makes an explicit merge commit, `--no-remove` keeps the worktree afterward instead of removing it (skip `worktree-coordinator remove`/`release` in that case, since the claim should still be dropped explicitly). After `wt merge` removes the worktree itself, run `worktree-coordinator release --agent <agent>` (the worktree/branch are already gone, so plain `remove` would just fail to find them) to drop the now-stale claim.
- **Plain `git merge --no-ff <branch>`** (from the target's worktree): preserves the branch's own commit history and an explicit merge point, without worktrunk's squash/rebase pipeline. Good when history granularity matters or multiple people may want to trace what happened, or when the project has no worktrunk hooks to lean on.
- **Rebase, then fast-forward** (`git rebase <target> <branch>` in the worktree, then `git merge --ff-only <branch>` from the target): linear history, no merge commit, without squashing. Good for small, self-contained branches where a clean line of commits matters more than provenance. Never rebase a branch other agents might still be building on without telling them - it rewrites commits they'd have to re-base onto.
- **Cherry-pick**: when only part of a branch's work is ready, or when combining fixes from several branches into one commit sequence deliberately.
- **Sequential integration**: when two branches touch nearby files but not the same lines, integrate one fully (including its own validation pass) before starting the second, rather than merging both in one shot. Re-run validation after each merge, not just once at the end - a second branch can still conflict logically even if Git resolves it textually.

Whatever is chosen, do it **one branch at a time**, run whatever validation is proportional to the project (tests, typecheck, lint - whatever this repo actually uses, or `pre-merge` hooks if using `wt merge`) after each integration, and stop at the first conflict to resolve it consciously rather than plowing through with `-X ours`/`-X theirs` or similar.

## After integrating

Only release or remove a worktree once its branch is actually integrated (or the coordinator has explicitly decided to abandon it). If `wt merge` was used, it already removed the worktree and branch - just run `worktree-coordinator release --agent <agent>` to drop the claim. Otherwise, after a plain `git merge`/rebase:

- `worktree-coordinator release --agent <agent>` - drops the claim, leaves the worktree and branch on disk untouched. Use this when you want to keep the worktree around (e.g. for a quick follow-up) but free the agent slot.
- `worktree-coordinator remove --agent <agent>` - delegates to `wt remove`, which removes the worktree (never forced - refuses on a dirty tree) and deletes the branch automatically only if its own integration check confirms it's safe (handles squash-merge and rebase workflows correctly, not just plain fast-forward ancestry). `--confirm-unmerged` force-deletes an unmerged branch anyway (`wt remove -D`); `--keep-branch` always preserves it. Removing the worktree is never blocked by merge status - only by an unclean tree - since the branch ref survives on its own regardless.

## What never happens automatically

No command here ever runs `git reset --hard`, `git clean -fd`, `git checkout --`/`git restore` to discard changes, `git branch -D` (or `wt remove -D`) without `--confirm-unmerged` explicitly asking for it, `wt remove --force`/`git worktree remove --force` on a dirty tree, a destructive rebase, or a force-push. If integration hits a conflict, or `remove` hits a dirty tree, the tool stops and hands the decision back rather than guessing.
