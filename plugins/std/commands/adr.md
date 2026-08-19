---
description: Record an Architecture Decision Record ad hoc - for a decision made outside an in-flight OpenSpec change, or to backfill one that predates this convention.
---

# /std:adr

Record one Architecture Decision Record directly under `docs/adr/`,
independent of any OpenSpec change. Use this for a decision made outside
the OpenSpec flow, or to backfill a decision that was already made (and
maybe already implemented) before this project adopted the standard -
most of this project's early, significant decisions likely predate
`docs/adr/` and are worth backfilling this way rather than left
undocumented.

**Input**: the argument after `/std:adr` is either a short description of
the decision to record, or empty (ask the user what decision to record).

## Steps

1. If `docs/adr/` doesn't exist yet, this project hasn't run `/std:init` -
   tell the user and stop (don't half-scaffold it here).

2. Confirm this decision actually clears the ADR bar before writing
   anything: a new external dependency, a technology/pattern choice with
   long-term consequences, a boundary expensive to move later. If it
   doesn't, say so and don't create a file - suggest it belongs in a
   regular commit message or design.md instead.

3. Gather Context/Decision/Consequences. If backfilling a past decision,
   look at the actual code/commits/design docs involved rather than
   reconstructing from memory - Context and Consequences should reflect
   what was really true at the time, not a tidied-up retelling.

4. Determine the next sequential number: list existing
   `docs/adr/NNN-*.md` files, take the highest `NNN`, add one (zero-padded
   to 3 digits). If none exist yet, start at `001`.

5. Write `docs/adr/<NNN>-<kebab-case-title>.md` using the
   Context/Decision/Consequences structure (see any existing ADR in the
   directory for the exact shape, or `docs/adr/README.md` for the
   convention). Status is `Accepted` unless the user says otherwise.
   If this decision was made outside any OpenSpec change, omit the
   "Source change" line other ADRs may have; if it's tied to one, include
   it: `Source change: openspec/changes/<name>/` (only if that change
   still exists - don't reference an archived/deleted one by a stale
   path without checking).

6. If this decision reverses or supersedes an existing ADR, do not edit
   that file's Decision - add `Status: Superseded by
   docs/adr/<NNN>-<new-title>.md` to the old file instead.

7. Report the file path created.
