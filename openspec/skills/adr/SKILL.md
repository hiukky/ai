---
name: adr
description: Record one Architecture Decision Record under docs/adr/ when the user asks for it, or to backfill a past decision that predates this project's docs/adr/ convention. ADRs in the normal flow are written at archive time, not here - this skill is the out-of-band path, not a second routine door. Not for a decision taken while implementing a change (that goes in the change's decisions.md and is judged at archive), not for documenting how the system is built (that is the architecture diagrams), and not for a naming, layout, refactor or tuning choice however long it was argued.
compatibility: A project that ran the `init` skill, so docs/adr/ and its README exist.
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

2. Confirm the decision clears the bar before writing anything. The bar
   is stated in one place - `docs/adr/README.md`, in this project - and
   that file wins over any summary, including this one. Read its Rules
   section, answer its four questions out loud, and check the decision
   against its list of what never qualifies. The default is no ADR. If it
   doesn't clear the bar, create no file: say so, and say where the
   reasoning belongs instead - the commit message, the change's
   `design.md`, or its `decisions.md`.

3. Gather Context/Decision/Consequences. If backfilling a past decision,
   look at the actual code/commits/design docs involved rather than
   reconstructing from memory - Context and Consequences should reflect
   what was really true at the time, not a tidied-up retelling.

4. Number and write the file the way `docs/adr/README.md` states, in
   Nygard style. Status is `Accepted` unless the user says otherwise. If
   the decision was made outside any OpenSpec change, omit the `Source
   change:` line other ADRs may carry; if it is tied to one that still
   exists, include it - don't point at an archived or deleted path
   without checking.

5. Add the record to the README's index, in number order. Nothing
   generates that list, so an ADR missing from it is an ADR nobody finds.

6. If this decision reverses or supersedes an existing ADR, do not edit
   that file's Decision - add `Status: Superseded by
   docs/adr/<NNN>-<new-title>.md` to the old file instead.

7. Report the file path created.
