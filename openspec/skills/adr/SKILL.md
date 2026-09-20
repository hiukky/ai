---
name: adr
description: Record one Architecture Decision Record under docs/adr/ when the user asks for it, or to backfill a past decision that predates this project's docs/adr/ convention. ADRs in the normal flow are written at archive time, not here - this skill is the out-of-band path, not a second routine door. Requires the project to have already run the `init` skill (docs/adr/ must exist).
---

# ADR (Architecture Decision Record)

Record one Architecture Decision Record directly under `docs/adr/`,
independent of any OpenSpec change - for a decision made outside the
OpenSpec flow, or to backfill one that predates this convention. Most of
a project's early, significant decisions likely predate `docs/adr/` and
are worth backfilling this way rather than left undocumented.

## When to record - only on request, or to backfill

**Don't create an ADR on your own initiative.** In the normal flow, ADRs
are written at archive time, judged against what was actually built
(`operations.archive` in `openspec/config.yaml`). A decision taken while
implementing belongs in the change's `decisions.md`; a decision taken
while designing belongs in `design.md`'s `## Candidate ADRs` note. Both
are re-judged at archive. Writing the record earlier produces a decision
a later slice contradicts, and then two ADRs where one belonged.

Use this skill when the user asks for an ADR, or to backfill a decision
that predates the convention. The argument (if any) is a short
description of the decision; if empty, ask which decision to record.

If a decision genuinely made outside any OpenSpec change deserves a
record and nobody asked, **say so and offer** - name the decision and why
it clears the bar. Don't write the file first.

## Steps

1. If `docs/adr/` doesn't exist yet, this project hasn't run the `init` skill
   - tell the user and stop (don't half-scaffold it here).

2. Confirm the decision clears the bar before writing anything. The
   default is no ADR. All four must be yes: is reversing it expensive
   (if undoing it is a refactor one change could carry, it is not an
   ADR); was a real alternative rejected (a Decision with no contender
   is a description); does it bind code that does not exist yet (a
   choice constraining only what is already written is history); is it
   unrecorded elsewhere (a rule a test enforces or a boundary AGENTS.md
   states already has a home). These never qualify however long they
   were debated: naming or vocabulary, file or module layout, a
   refactor, a bug fix, a performance tuning, a dependency version bump,
   a test strategy, a UI arrangement, or a restatement of a principle an
   existing ADR already holds. If it doesn't clear the bar, create no
   file - say so, and say where the reasoning belongs instead (the
   commit message, `design.md`, or the change's `decisions.md`).
   `docs/adr/README.md` holds the full rules.

3. Gather Context/Decision/Consequences. If backfilling a past decision,
   look at the actual code/commits/design docs involved rather than
   reconstructing from memory - Context and Consequences should reflect
   what was really true at the time, not a tidied-up retelling.

4. Determine the next sequential number: list existing
   `docs/adr/NNN-*.md` files, take the highest `NNN`, add one
   (zero-padded to 3 digits). If none exist yet, start at `001`.

5. Write `docs/adr/<NNN>-<kebab-case-title>.md` using the
   Context/Decision/Consequences structure (see any existing ADR in the
   directory for the exact shape, or `docs/adr/README.md` for the
   convention). Status is `Accepted` unless the user says otherwise. If
   this decision was made outside any OpenSpec change, omit the "Source
   change" line other ADRs may have; if it's tied to one, include it:
   `Source change: openspec/changes/<name>/` (only if that change still
   exists - don't reference an archived/deleted one by a stale path
   without checking).

6. If this decision reverses or supersedes an existing ADR, do not edit
   that file's Decision - add `Status: Superseded by
   docs/adr/<NNN>-<new-title>.md` to the old file instead.

7. Report the file path created.
