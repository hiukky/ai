---
name: pr
description: Open, name and describe a pull/merge request (GitHub PR, GitLab MR) and its branch. Use whenever the user asks to open a PR/MR, "abre um PR", "cria o MR", "manda pra revisão", or when finished work on a branch needs to reach the default branch through review - and before publishing a branch for review, to name it right. Applies in any project with a remote and a review flow.
---

# Pull / merge requests

A PR/MR is the unit of review, so it is named like the unit of history it will become: **the title is a Conventional Commit line, the branch follows gitflow.** The body says what a reviewer needs and nothing a diff already says.

## Branch name - gitflow

`<type>/<kebab-topic>`, from the default branch (`main`/`develop` per repo):

| prefix | for |
|---|---|
| `feature/` | a new capability or change set (`feature/native-first-hooks`) |
| `fix/` | a bug fix that is not urgent (`fix/hook-stop-shape`) |
| `hotfix/` | an urgent fix cut from the production branch |
| `release/` | release preparation (`release/1.2.0`) |
| `chore/`, `docs/`, `ci/`, `refactor/` | maintenance-only branches, same vocabulary as the commit types |

Rules: one topic per branch; lowercase kebab-case; no ticket-only names (`fix/123` says nothing - `fix/123-hook-stop-shape` does). Agent-isolation branches (`agent/<name>`, worktrees) are **working** names, not review names: rename before publishing for review (`git branch -m agent/x feature/x`), never open the PR from them.

## Title - Conventional Commits

The title is the squash/merge commit line, so it follows the `commit` skill exactly:

```
<type>[optional scope][!]: <description>
```

- type and scope from the *diff*, not from the request; `!` only for a real breaking change.
- imperative, lowercase, no trailing period, ≤ 72 characters.
- one PR = one type. If the branch honestly spans two types, the title carries the dominant one and the body lists the rest - or split the PR.

Examples: `feat(hooks)!: compile portable hooks into native artifacts` · `fix(conformance): read the request body once under --discovery` · `docs(openspec): propose plugin requirements`.

## Body - what the reviewer needs

Short sections, in this order; drop a section rather than pad it:

1. **What changes** - bullets by behaviour, not by file. Mark **BREAKING** items.
2. **Why** - one or two sentences, or a link to the proposal/ADR/issue that holds it.
3. **Verification** - the commands that were run and their outcome (tests, gates, E2E verdicts). Numbers, not "tests pass".
4. **Review points** - decisions the author made that a reviewer should confirm or overturn, each one sentence.
5. **Refs** - `Closes #123`, `Refs #456`, links to specs. Put issue keywords here so the platform links them.

Never restate the diff, never paste logs; a reviewer reads the code for the how.

## Workflow

1. Confirm the branch is up to date with the base: `git fetch origin && git rebase origin/main` (or merge, per repo convention). A PR opened behind its base is a PR that will conflict.
2. Rename the branch to its gitflow name if it still carries a working name; push with `-u`.
3. Run the repo's pre-push gates yourself before pushing (hooks may regenerate files - commit what they ask for).
4. Open it with the platform CLI, body via heredoc:
   ```bash
   gh pr create --base main --head feature/topic --title "feat(scope): description" --body "$(cat <<'EOF'
   ...
   EOF
   )"
   # GitLab: glab mr create --target-branch main --source-branch feature/topic --title "..." --description "..."
   ```
5. Draft (`--draft`) while gates are still running; mark ready when green.
6. After merge, delete the branch (remote and local) and any worktree that used it.

## Don't

- Don't open a PR from an `agent/*`, `wip/*` or personal-name branch.
- Don't title a PR with the branch name, a ticket id, or a sentence ("Fixes the hooks stuff").
- Don't force-push a branch that has reviews in flight without saying so in the PR.
- Don't merge yourself unless the repo's convention says the author merges; leave it to review.
