---
name: pr
description: Open, name and describe a pull/merge request (GitHub PR, GitLab MR) and its branch. Use whenever the user asks to open a PR/MR, "abre um PR", "cria o MR", "manda pra revisão", or when finished work on a branch needs to reach the default branch through review - and before publishing a branch for review, to name it right. Applies in any project with a remote and a review flow. Not for committing or pushing work (that is `commit`), not for reviewing someone else's request, and not for merging one - that stays with whoever the repo's convention says.
compatibility: >-
  git, plus the platform's CLI authenticated for this remote - `gh` for
  GitHub, `glab` for GitLab.
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
- **technical, by the `commit` skill's five rules**: one clause (no `, and` joining two half-titles), a verb describing an edit rather than narrating what the product now does, a named artifact (command, module, flag, type, endpoint), no metaphor or aphorism, the code's own names instead of coined imagery. A PR title outlives the branch - it is the line that lands in `main` and shows up in the release notes - so it gets stricter treatment than a commit on the branch, not looser.
- a PR that covers a lot is still titled by its **dominant technical change**, not summarized into an abstraction ("make a region legible", "carry every record across a version"). The breadth goes in the body's **What changes** bullets.

Examples: `feat(hooks)!: compile portable hooks into native artifacts` · `fix(conformance): read the request body once under --discovery` · `perf(marketplace): read from the local mirror instead of re-cloning` · `docs(openspec): propose plugin requirements`.

Rewrites of titles that missed: `feat(ui): read the strip's right end as three zones, not a row of chips` → `feat(ui): render the status bar's right side as three fixed zones`; `feat(observability): keep a journal nobody has to turn on` → `feat(observability): enable the session journal by default`; `fix(ui): say configured or nothing on a harness card` → `fix(ui): show the configured state on harness cards`.

## Body - what the reviewer needs

Short sections, in this order; drop a section rather than pad it:

1. **What changes** - bullets by behaviour, not by file. Mark **BREAKING** items.
2. **Why** - one or two sentences, or a link to the proposal/ADR/issue that holds it.
3. **Verification** - the commands that were run and their outcome (tests, gates, E2E verdicts). Numbers, not "tests pass".
4. **Review points** - decisions the author made that a reviewer should confirm or overturn, each one sentence.
5. **Refs** - `Closes #123`, `Refs #456`, links to specs. Put issue keywords here so the platform links them.

Never restate the diff, never paste logs; a reviewer reads the code for the how.

**Length and register.** The body fits on a screen or two - it is a briefing, not an essay about the work. Bullets are one line each and name components, commands and numbers. No narrative headings ("The seven", "one honest correction"), no rhetorical flourishes, no table used to make a change look bigger than it is; a table is for data with columns (harness × result, version before × after). If the full story genuinely needs prose, it belongs in the proposal/ADR the **Why** section links to, not in the PR body.

## Assignee - always the author

A PR/MR is opened **assigned to whoever authored it**, on every platform, without being asked: the assignee is who owns getting it merged, and an unassigned request has no owner. Reviewers are a separate field - assigning yourself never replaces requesting review.

Set it at creation, never as a follow-up edit. Prefer the CLI's own "me" token; if the platform rejects it, resolve the authenticated username first and pass that:

```bash
gh pr create --assignee @me ...
glab mr create --assignee @me ...          # if rejected: --assignee "$(glab api user --jq .username)"
```

The repo's convention wins where it has one (a rotation, a bot, a CODEOWNERS-driven assignment); assign yourself *as well* unless that convention says otherwise.

## Workflow

1. Confirm the branch is up to date with the base: `git fetch origin && git rebase origin/main` (or merge, per repo convention). A PR opened behind its base is a PR that will conflict.
2. Rename the branch to its gitflow name if it still carries a working name; push with `-u`.
3. Run the repo's pre-push gates yourself before pushing (hooks may regenerate files - commit what they ask for).
4. Open it with the platform CLI, assigned to yourself, body via heredoc:
   ```bash
   gh pr create --base main --head feature/topic --assignee @me --title "feat(scope): description" --body "$(cat <<'EOF'
   ...
   EOF
   )"
   # GitLab: glab mr create --target-branch main --source-branch feature/topic --assignee @me --title "..." --description "..."
   ```
5. Draft (`--draft`) while gates are still running; mark ready when green.
6. After merge, delete the branch (remote and local) and any worktree that used it.

## Don't

- Don't open a PR from an `agent/*`, `wip/*` or personal-name branch.
- Don't title a PR with the branch name, a ticket id, or a sentence ("Fixes the hooks stuff").
- Don't title a PR with a line that reads well but can't be checked against the diff - if a reviewer can't tell from the title which subsystem changed, rewrite it.
- Don't force-push a branch that has reviews in flight without saying so in the PR.
- Don't merge yourself unless the repo's convention says the author merges; leave it to review.
- Don't leave a PR/MR unassigned, and don't hardcode a username where the CLI's "me" token or the authenticated user will do.
