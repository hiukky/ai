---
name: commit
description: Commit (and push) changes using Conventional Commits. Use this whenever the user explicitly asks to commit, push, save, or check in changes - "commit this", "commit and push", "save my work", "git commit", "faz um commit" - and also proactively, on your own initiative, once a unit of work is genuinely done, not only when explicitly asked. Applies in any project with a git repository.
---

# Commit (Conventional Commits)

Every commit made with this skill follows [Conventional Commits](https://www.conventionalcommits.org/): the type/scope prefix keeps history scannable and stays compatible with changelog/semver automation, even in repos that don't use that automation today.

## When to commit - proactively, without being asked

Commit (and push, see below) on your own initiative once a coherent unit of work is genuinely finished - don't wait for the user to say "commit this." A unit of work is finished when **all** of these hold:

- It's a complete, coherent step - a requested feature is implemented, a bug is fixed, a task from a checklist is done - not a half-written function or a "let me also just quickly..." detour mid-task.
- It builds/typechecks, and any fast, relevant tests pass. Don't commit code you haven't verified works.
- The working tree doesn't mix this finished unit with unrelated in-progress changes (see splitting, below).

Do **not** commit proactively when:
- The user is mid-conversation about what to build and hasn't converged on an approach yet.
- You're in the middle of a multi-step task and this is an intermediate, not-yet-working state.
- The user has just told you, for this task or session, to hold off (that instruction overrides this skill until they say otherwise).

When in doubt about whether something counts as "done," err toward committing - a commit is cheap and reversible (`git reset`/`--amend` before push, revert after); leaving finished work uncommitted is the actual failure mode this skill exists to prevent.

This proactive default does not extend to force-pushing, rewriting other people's history, or anything else outside normal commit+push - those keep requiring explicit confirmation per the user's general git safety rules.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- **type** - required, one of:
  - `feat` - a new feature/capability
  - `fix` - a bug fix
  - `docs` - documentation only
  - `style` - formatting/whitespace, no code meaning change
  - `refactor` - code change that neither fixes a bug nor adds a feature
  - `perf` - performance improvement
  - `test` - adding/correcting tests
  - `build` - build system or external dependencies
  - `ci` - CI configuration/scripts
  - `chore` - everything else (tooling, config, maintenance)
  - `revert` - reverts a previous commit
- **scope** - optional, parenthesized (`feat(auth): ...`). Skip it when the
  change is repo-wide or the scope would just restate the description.
- **description** - imperative mood ("add", not "added"/"adds"), lowercase,
  no trailing period.
- **BREAKING CHANGE** - `!` right after type/scope (`feat!:`) or a
  `BREAKING CHANGE: <explanation>` footer, for a backwards-incompatible
  change. Use only when it's actually breaking - don't default to it.
- **body** - the why/context, not a restatement of the diff. Omit for
  small, self-explanatory changes; a type+description line is a complete
  commit on its own.
- **footer(s)** - `Refs: #123`, `Closes: #123`, `BREAKING CHANGE: ...`,
  `Co-Authored-By: ...`, one per line.

## Workflow

1. Gather context in parallel: `git status`, `git diff` (staged and
   unstaged), `git log --oneline -10` - match the repo's existing
   type/scope conventions if it already has Conventional Commits history.
2. Review what's about to be staged. If a broad `git add` would sweep in
   unrelated files or anything that looks like a secret/credential, stage
   explicitly by path instead.
3. Pick the type (and scope, if it earns its keep) from the actual diff,
   not from the words the user used to ask for it (if any) - the type
   describes the change, not the request.
4. If the diff spans genuinely unrelated concerns, prefer splitting into
   separate commits over one mixed-type commit - but don't force a split
   for naturally-related changes just to keep commits small.
5. Write the message via heredoc (never a bare `-m` for anything with a
   body), so formatting comes out exact:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(scope): add thing

   Why this was needed, in a sentence or two.
   EOF
   )"
   ```
6. After committing, `git status` to confirm a clean tree (or exactly the
   expected remainder).

## Push

Push right after committing, by default - don't leave finished, committed work stranded locally waiting for a separate request:

- Plain `git push` (or `git push -u origin <branch>` if the branch has no upstream yet).
- If the push is rejected because the remote has commits you don't have, `git pull --rebase` (or `--ff-only` if you expect no divergence) and retry - don't force-push to make a rejected push go through.
- Force-push (`--force`/`--force-with-lease`), pushing to a shared/protected branch (e.g. `main` on a team repo where others are actively pushing), and anything that rewrites already-pushed history stay outside this proactive default - confirm with the user first, same as the amend-after-push case below.
- If push fails for a reason that isn't "just rebase and retry" (auth, permissions, CI/branch-protection rejection), stop and surface it rather than working around it.

## Fixing a message after the fact

If a commit was just made with a non-conforming message and the user asks
to fix it: `git commit --amend` if it hasn't been pushed yet. If it has
already been pushed, amending requires a force-push - confirm that's
wanted (own branch, no one else pulled it) before `git push
--force-with-lease`, per the user's general git safety rules; don't treat
"fix the message" alone as blanket authorization to force-push.

## Examples

- `feat(terminal): bridge resize events through the websocket`
- `fix(workspace): reject absolute paths in file write requests`
- `docs: point architecture overview at the likec4 model`
- `chore: bump likec4 to 1.60`
- `refactor(sandbox): extract memory-limit parsing into its own function`
- `feat(api)!: require workspace_id on terminal connect`

  `BREAKING CHANGE: terminal websocket no longer infers workspace from session state`
