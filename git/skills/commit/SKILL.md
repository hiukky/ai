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
  no trailing period, and **technical** - see the section below, which is
  where this most often goes wrong.
- **BREAKING CHANGE** - `!` right after type/scope (`feat!:`) or a
  `BREAKING CHANGE: <explanation>` footer, for a backwards-incompatible
  change. Use only when it's actually breaking - don't default to it.
- **body** - the why/context, not a walkthrough of the diff. Naming the
  module, function or flag that changed is context, not restatement -
  what is forbidden is narrating file by file. Omit for small,
  self-explanatory changes; a type+description line is a complete commit
  on its own. When there is a body, it is a few short paragraphs or
  bullets of facts - no headings, no story, no rhetorical asides
  ("Ordering dependency, not residue"), no table that exists to make a
  small change look large. Numbers and identifiers earn their place;
  prose about them does not.
- **footer(s)** - `Refs: #123`, `Closes: #123`, `BREAKING CHANGE: ...`,
  `Co-Authored-By: ...`, one per line.

## The description is technical, not literary

The description says **what the change does to the software**, in the
repo's own vocabulary. A reader scanning `git log` should be able to
guess which files the commit touched, and check the line against the
diff. Five rules, all of which must hold:

1. **One clause, one statement.** No `, and` welding two half-thoughts
   together, no trailing subordinate clause that trails off. If the
   change honestly has two halves, either a broader description covers
   both or it is two commits.
2. **Imperative addressed to the codebase** - what *you did to the
   code* - not narration of what the product now does or is like. Use
   `add`, `remove`, `rename`, `extract`, `cache`, `validate`, `reject`,
   `emit`, `render`, `pin`. Avoid `say`, `keep`, `let`, `make`,
   `know`, `remember`, `carry`, `read X as Y` - verbs that
   anthropomorphize the system instead of describing an edit.
3. **Name the artifact.** The command, module, flag, type, field,
   endpoint or error the diff touches - the identifiers a reviewer
   would grep for. A description with no noun taken from the code
   describes an intention, not a change.
4. **No metaphor, no riddle, no aphorism.** If the line only makes
   sense to someone who already read the diff, it failed. Don't gloss
   the change with an appositive either ("add `x update`, the command
   that moves this project's pins") - say the thing once.
5. **The code's names, not coined imagery.** `status bar`, `--json`,
   `StatusZone` - not "the strip's right end", "a row of chips".

Terseness is not the goal; a precise line may run to 72 characters.
Checkability is.

| instead of | write |
|---|---|
| `feat(observability): keep a journal nobody has to turn on` | `feat(observability): enable the session journal by default` |
| `feat(plugins): say whether an installed plugin is the one that exists` | `feat(plugins): flag installed plugins missing from the catalogue` |
| `feat(marketplace): skip what this machine cannot reach, and say access is access` | `feat(marketplace): report unreachable marketplaces as an access error` |
| `fix(ui): read the strip's right end as three zones, not a row of chips` | `fix(ui): render the status bar's right side as three fixed zones` |
| `fix(terminal): never end a live server that can still serve the client` | `fix(terminal): keep the server alive while a client is attached` |
| `feat!: carry every record across a version, and give every agent its work's state` | `feat!: migrate persisted records on version change` + a second commit for the agent state |

A useful last check before committing: **could a teammate who has not
seen the diff name the wrong feature from this line?** If the line is
evocative but unfalsifiable, rewrite it around the artifact.

## Workflow

1. Gather context in parallel: `git status`, `git diff` (staged and
   unstaged), `git log --oneline -10` - match the repo's existing
   type/scope *vocabulary* if it already has Conventional Commits
   history. Match its vocabulary, not its prose: a history full of
   literary descriptions is a reason to write the next one plainly, not
   licence to add to it.
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
6. Before running the commit, read the description back against the five
   rules above - one clause, an edit verb, a named artifact, no
   metaphor, the code's own names.
7. After committing, `git status` to confirm a clean tree (or exactly the
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
- `fix(delivery): resolve dangling refs instead of failing the install`
- `perf(marketplace): read from the local mirror instead of re-cloning`
- `docs: point architecture overview at the likec4 model`
- `chore: bump likec4 to 1.60`
- `refactor(sandbox): extract memory-limit parsing into its own function`
- `feat(api)!: require workspace_id on terminal connect`

  `BREAKING CHANGE: terminal websocket no longer infers workspace from session state`
