---
name: commit
description: Create git commits using the Conventional Commits format. Use whenever the user asks to commit, save, or check in their changes - in any project, not just ones with their own commit-style docs already written down.
---

# Commit (Conventional Commits)

Every commit made with this skill follows [Conventional Commits](https://www.conventionalcommits.org/): the type/scope prefix keeps history scannable and stays compatible with changelog/semver automation, even in repos that don't use that automation today.

Only commit when explicitly asked - never proactively, regardless of what else this skill says.

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
   not from the words the user used to ask for it - the type describes
   the change, not the request.
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
