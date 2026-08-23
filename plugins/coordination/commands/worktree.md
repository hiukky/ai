---
description: Use the git-worktree-coordinator skill to create, verify, or manage an isolated Git worktree for parallel agent work.
---

# /coordination:worktree

Use the `git-worktree-coordinator` skill for the requested worktree
operation - creating an isolated worktree for a new task, listing
current worktrees and their claims, verifying ownership before an edit,
finishing/releasing/removing a worktree once work is done, or diagnosing
the claim registry.

Treat the argument after `/coordination:worktree` as the operation to
perform, in plain language (e.g. "create a worktree for agent X to fix
the login bug", "list current worktrees", "remove the worktree for task
Y once merged") - the skill decides which concrete
`worktree-coordinator` subcommands to run, including the ownership and
safety checks it always applies before writing or removing anything.
