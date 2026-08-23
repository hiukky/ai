---
description: Commit (and push) the current changes using the `commit` skill's Conventional Commits process.
---

# /git:commit

Use the `commit` skill to inspect the current changes, validate the
repository state, and create a properly formatted commit (and push, per
the skill's default).

Treat any argument given after `/git:commit` as additional guidance from
the user (a scope, a note for the body, an instruction to hold off on
pushing) - it informs the skill's judgment, it doesn't replace the
skill's own checks (splitting unrelated changes, verifying the
build/tests pass, matching the repo's existing commit conventions).
