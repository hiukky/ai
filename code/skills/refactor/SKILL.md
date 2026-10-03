---
name: refactor
description: Change the structure of existing code without changing its behavior - from a rename across a module to a boundary moved across a codebase - in small verified steps, with every decision the plan did not make recorded for review. Use when someone asks to refactor, restructure, extract, split, untangle, decouple or migrate a module or an interface, to pay down technical debt, or says "refatora isso", "reorganiza esse módulo", "quebra esse arquivo", "limpa essa parte". Language-agnostic - the project's own gates and docs decide what green means. Not for adding or changing behavior (that goes in its own step, before or after, never in the same one), not for reviewing code without changing it, not for working an existing OpenSpec task list (that is the `openspec` plugin's `auto`), and not for committing the result (that is the `git` plugin's `commit`).
compatibility: >-
  A git repository, any language. Uses a language server, ast-grep or comby
  for mechanical changes when one is present, and falls back to search and
  edit when none is.
---

# Refactor

A refactoring makes two promises, and a change that breaks either one is not
a refactoring, whatever its commit type says:

1. **Behavior is preserved** - proved by the project's gate, not by reading
   the diff.
2. **Every step is small enough to undo** - one transformation, one green
   gate, one commit. The sha is the undo.

Everything below serves those two. The method is the one that has survived
since Fowler's *Refactoring* and Feathers' *Working Effectively with Legacy
Code*: pin the behavior, then move in steps so small that a red gate points
at the one thing that broke it.

## First, read the project

Before planning anything, find out what this project already decided. Its
docs win over this skill wherever they disagree.

- **The rules** - `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING`, the architecture
  docs and decision records it points at. Layering rules, dependency
  policy, naming conventions and "never do X" lists live there.
- **The gate** - what actually blocks a merge. Read CI first (`.github/workflows`,
  `.gitlab-ci.yml`, whatever exists), then the task runner it calls
  (Makefile, justfile, `package.json` scripts, `pyproject`, `Cargo.toml`,
  `go.mod`...). Write down the exact commands: build, tests, lint, type
  check. That list *is* "green" for this run - say which one you adopted in
  the report.
- **The safety net** - what will tell you a step broke something. That is a
  property of the language and of the code, and it decides how big a step
  may be. See `references/safety-net.md`.

A project with no runnable gate is not a reason to stop - it is the first
task: build the net (characterization tests, see the reference) before the
first structural edit.

## Two hats, never both

Structure and behavior never change in the same step. When the refactoring
uncovers a bug:

- don't fix it in passing - a characterization test pinned the current
  behavior, bug included, and a silent fix makes that test lie;
- record it, and fix it in a commit of its own (`fix:`, not `refactor:`),
  before or after, if it is in scope - or leave it for the report if not.

The same goes for "while I'm here" improvements that change output, error
messages, timing or ordering someone might depend on.

## Size it

Classify before starting; the class decides where the plan lives.

| Size | Looks like | Plan lives |
| --- | --- | --- |
| **Local** | one module, every caller findable, one session | in your head; just do it in steps |
| **Spread** | several modules, prerequisites appear as you go, one or two sessions | a Mikado graph in the git dir |
| **Aggressive** | crosses an architectural boundary, touches a persisted format or a public interface, or needs several sessions | a written change, run unattended - see below |

When unsure between two sizes, take the larger. Promoting a run midway is
cheap; discovering at step 30 that nothing was written down is not.

## The process

1. **Map - no edits.** Name the target and *why*: what becomes easy once
   this is done (Beck: "make the change easy, then make the easy change").
   A refactoring with no answer to that is taste, and is not started. Then:
   who calls it, what tests cover it, which files change most often
   (`git log --format= --name-only | sort | uniq -c | sort -rn` - churn
   times complexity is where the payoff is), and what kind of safety net
   applies.
2. **Protect.** Where the behavior you are about to move is not pinned by a
   test, pin it first. Those tests land in their own commit, green against
   the *old* code.
3. **Plan with Mikado.** Try the goal directly; when it breaks, write down
   what it needed, revert, and work the leaves first. See
   `references/mikado.md`.
4. **Execute in steps.** One transformation, the gate, a commit through the
   `git` plugin's `commit` (or the project's own convention if it has one).
   Mechanical changes across many files follow
   `references/mechanical-change.md`. Any change to an interface, a schema
   or a format goes expand → migrate → contract, each phase green on its
   own.
5. **Look through the lenses** - once while planning, once on the final
   diff. They are the questions to ask every time, so nobody has to type
   them into a prompt again:
   - `$PLUGIN_ROOT/resources/lenses/architecture.md`
   - `$PLUGIN_ROOT/resources/lenses/security.md`
   - `$PLUGIN_ROOT/resources/lenses/performance.md`
   - `$PLUGIN_ROOT/resources/lenses/quality.md`

   A finding is either in scope (do it, as its own step) or a discovery
   (goes in the report). It never quietly widens the run.
6. **Report** - see the end of this file.

## Which decisions are yours

Autonomy is bought with the record: decide, write it down, keep going. What
you may decide depends on how hard it is to undo.

**Two-way doors - decide and record in one line** (commit body or report):
names, extracting or inlining, moving code inside a module boundary, the
order of steps, which of two equivalent shapes to use, which tool performs
a mechanical change.

**One-way doors - never taken alone mid-run:**

- a persisted format: anything written to disk, a database, a cache key, a
  wire protocol, a config file a person edits;
- a public surface: an exported API, a CLI flag or command, an HTTP route,
  an event name - anything a caller outside this repository may depend on;
- a new dependency;
- removing behavior someone could rely on, even behavior that looks
  accidental;
- moving a trust boundary - where input is validated, where a privilege is
  checked;
- anything the project's own docs say needs approval.

A one-way door is decided **while planning**, with the person, or written
into the plan as decided. Met unexpectedly mid-run, it is not taken: take
the path that does not need it, and list it in the report as pending with
your recommendation.

## When to stop - a closed list

Stop and hand back **only** when:

1. The gate cannot go green without changing behavior - that means the
   step was not a refactoring; say which behavior and why.
2. Three failed attempts at the same Mikado node - a fourth would be
   laundering a wrong assumption into a larger diff.
3. A destructive action outside the run's scope is needed - deleting what
   the plan never named, rewriting pushed history.
4. A credential is needed, or a secret turns up in the working tree.

Not reasons to stop: finishing a step (the next node is already
authorized), an ambiguity with a defensible answer (pick it, record it), a
question the codebase answers, wanting reassurance before a two-way door.

## Aggressive refactors: plan here, run elsewhere

An aggressive refactoring outlives a context window, so its state cannot
live in conversation. Two ways, picked by what is installed:

**The `openspec` plugin is present** (the project has an `openspec/`
directory and the `auto` skill is available): this skill does the planning,
`auto` does the running. Write a change whose

- `proposal.md` `## Why` is the answer to "what becomes easy";
- `design.md` holds the Mikado graph and **every one-way door, decided** -
  so the unattended run never meets one;
- `tasks.md` lists the graph's nodes leaves-first, one green step per box,
  with expand, migrate and contract as separate groups.

Then hand off to `auto`. Its escalation list is its own and closed; do not
add conditions to it - decide them in `design.md` instead.

**It is not**: run the loop here, keeping the state in three places that
survive a cold start - the Mikado graph at
`$(git rev-parse --git-dir)/refactor/<topic>.md` (per checkout, never
committed, gone with the worktree), the commits, and the decisions in
commit bodies. A fresh session reads the graph and `git log` and resumes
at the first unchecked leaf. Never carry run state only in conversation.

## Report

The same shape every time, so it can be reviewed at a glance when you come
back to it:

```markdown
## Refactor: <target>

**Why**: <what becomes easy now>
**Gate**: <the exact commands adopted> - <green | red, with output>

### Changed
- <one line per step, with its sha>

### Decided
- <decision> - <why> - <two-way | one-way, decided in plan> - <sha>

### Pending your call
- <one-way door met mid-run> - <recommendation> - <the path taken instead>

### Found, out of scope
- <bug, smell or risk the lenses surfaced> - <where>

### Stopped because   (only if it did)
- <condition from the closed list> - <evidence>
```

An empty section is written as `none`, not left out: "nothing pending" is
information, a missing heading is a question.
