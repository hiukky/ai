---
name: auto
description: Work an OpenSpec change's tasks.md to completion without stopping for approval - deciding alone when the plan runs out, recording each decision for review afterwards, and interrupting only on a closed list of conditions. Use when a change should be implemented unattended - "implementa sozinho", "vai até o fim", "não me pergunta", an overnight run, a long task list nobody is watching. Requires a project that ran the `init` skill and a change with a tasks.md.
---

# Auto (unattended apply)

This is the `apply` phase run without a human in the loop. Same tasks, same
checkboxes, same verification - what changes is the **stopping contract**:
the agent decides alone where the plan runs out, writes down what it decided,
and keeps going. Review is deferred, not skipped.

The trade is explicit, and it only works in both directions: **autonomy is
bought with the record**. An agent that decides alone and doesn't write it
down is destroying information; an agent that writes it down and still stops
to ask has paid for nothing.

## The escalation bar - a closed list

Stop and hand back to the user **only** when one of these is true:

1. **Irreversible or destructive action outside the change's scope** - force
   push, dropping data, deleting files this change never named, anything
   the `git` skill's own rules already gate.
2. **Proceeding would violate the spec** - the only way forward contradicts
   a REQUIREMENT under `specs/`. The spec outranks the task list.
3. **Three failed hypotheses on the same task item** - see Stalls, below.
4. **A credential is needed, or a secret is found** in the working tree.
5. **A discovery invalidates the proposal** - what you learned means the
   change's `## Why` no longer holds. Don't implement a change whose
   premise died; stop and say which finding killed it.

This list is closed on purpose. "Pause if you need clarification" is an open
condition - any uncertainty satisfies it - and an open condition is how a run
that should have taken four hours takes three days of round trips.

**These are not reasons to stop**, and the run must not treat them as such:

- Finishing a task item. The next unchecked box is already authorized - the
  task list *is* the approval. Asking "can I continue?" after 2.3 to start
  2.4 is the failure this skill exists to prevent.
- An ambiguity that has a defensible answer. Pick the reading most
  consistent with `proposal.md` and `specs/`, record it, continue.
- Wanting to confirm an approach before investing in it. Investigate, decide,
  record. If it turns out wrong, the commit is the undo.
- A question you could answer yourself by reading the codebase.
- Being unsure whether the user would like it. That is what the record and
  the deferred review are for.

## The iteration

For each unchecked `- [ ]` in `tasks.md`, in order:

1. **Load state** - the task list, `decisions.md`, and the run's commits so
   far. Never rely on conversation history for state: a run outlives its
   context window, and the next iteration may start cold.
2. **Implement** the item.
3. **Verify** - run the project's own verification for what this item
   touched (its test command, type check, linter, whatever the repo uses -
   discover it, don't assume a toolchain). The gate is an **exit code**,
   never a judgement. "It looks right" does not close a task.
4. **Green** - tick the box, commit through the `git` skill's `commit`
   (one commit per completed item), reset the stall counter.
5. **Red** - form a hypothesis, fix, verify again. Record each failed
   hypothesis (see Stalls).
6. **Record** any decision taken along the way in `decisions.md`, in the
   same commit as the work it justifies.
7. Next item.

One commit per green item is not hygiene here, it is the mechanism: the sha
is what makes a rejected decision a `git revert` instead of an argument.

Never delete or weaken a test to make a gate pass. A failing test is
information; a deleted one is a lie the next run inherits. If a test is
genuinely wrong, that is a decision - record it as one.

## What goes in decisions.md

`openspec/changes/<change>/decisions.md`, append-only for the duration of
the run, one entry per decision the plan did not make for you. It is not a
diary: routine implementation goes in the commit, not here. Record a
decision when you chose between real alternatives and a reviewer could
reasonably have chosen the other one.

The template is `decisions.md` in the schema's templates. Every entry
carries: the status, the task it came from, the commit that holds it, what
the task list failed to anticipate, what you decided, the alternative you
rejected and why, and what reverting it would cost.

**Ownership is split and neither side crosses it**: the agent writes
entries and never touches `status`; the user writes `status` and never
rewrites an entry. That keeps the file merge-safe across an unattended run
and a later review, and it means an unread queue is visible as one.

Statuses: `pending` (decided, not yet reviewed) - `accepted` (stands, and
becomes an ADR candidate at archive) - `overturned` (rejected; its commit is
the revert point, and the follow-up work goes back into `tasks.md`) -
`blocked` (a hypothesis that failed, kept because it is the stall counter).

## Stalls

Three failed hypotheses on one task item ends the run. Each failure is
appended as a `blocked` entry naming the hypothesis and what actually
happened, so the counter survives a crash - it is `blocked` entries for
the same task, counted from the file, not a number held in context.

Escalating at three is the point. A loop that retries indefinitely does not
converge, it launders a wrong assumption into a large diff.

## The engine

This skill does not ship a loop. Classify what the harness offers and use it:

- a native scheduler or wake-up mechanism (a timer subscription, a
  self-paced wake-up tool, a built-in loop command) - use it;
- none of those - a shell loop that re-invokes the agent with a fresh
  context each iteration.

Either way the state lives in the same three portable places: the checkboxes
in `tasks.md`, the entries in `decisions.md`, and the commits. A cold
iteration reads those three and resumes exactly where the last one stopped.
Do not carry run state in conversation history, and do not summarize the
task list into a plan of your own - the file is the plan.

## Boundaries

`auto` implements. It does not:

- **merge, deploy or force-push** - those keep their existing gates;
- **write ADRs** - that happens at archive time, from the record this run
  leaves behind;
- **change scope** - a task list that turns out to be wrong is escalation
  condition 5, not an invitation to rewrite the proposal;
- **edit its own escalation bar** - this file is not inside the change, and
  a run must never relax the conditions under which it is allowed to stop.

## Report

When the run ends - finished or escalated - report in one place: items
completed out of the total, commits made, decisions awaiting review (with
their ids), any `blocked` entries, and the escalation condition if one
fired. That report is a summary of the files, not a replacement for them.
