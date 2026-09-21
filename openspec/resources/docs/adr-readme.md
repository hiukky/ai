# Architecture Decision Records

This directory answers **"why is the system this way?"** — the durable
record of significant, hard-to-reverse decisions. It complements two other
parts of this repo:

- `openspec/changes/` answers **"what are we changing now?"** (proposal,
  specs, design, tasks for one in-flight change).
- the project's architecture directory answers **"how is the system
  organized?"** (the current structure, as Mermaid views).

## Format

Each ADR is `NNN-kebab-title.md`, numbered sequentially (never reused,
never renumbered), using this structure (Michael Nygard style):

- **Status** — `Accepted`, or `Superseded by docs/adr/NNN-new-title.md`
- **Context** — the situation that forced a choice
- **Decision** — what was decided, stated firmly
- **Consequences** — what becomes easier or harder as a result

An ADR that absorbed others carries a `Consolidates:` line under its Status
naming them, and the absorbed records are listed under
[Consolidated records](#consolidated-records) below.

## Rules

- **Numbered sequentially**, one shared sequence for the whole repo.
  Numbers are never reused and never renumbered — code comments,
  architecture docs and OpenSpec changes cite them. To number a new one:
  list the existing `NNN-*.md`, take the highest `NNN`, add one, zero-pad
  to three digits (`001` if the directory is empty), and name the file
  `NNN-kebab-title.md`. A record tied to an OpenSpec change carries a
  trailing `Source change: openspec/changes/<name>/` line; one made
  outside any change omits it.
- **An ADR is written when an OpenSpec change is archived**, not while the
  approach could still change. The `operations.archive` guidance in
  `openspec/config.yaml` is the trigger: a decision flagged in that
  change's `design.md`, or recorded in its `decisions.md` during
  implementation, that actually held up earns a record. Writing the ADR up
  front produces a decision that a later slice contradicts, and then two
  ADRs where one belonged. The `adr` skill records one outside that flow —
  when you ask for it, or to backfill a decision that predates this
  convention — but it is not a second routine door.
- **The default is no ADR.** Most changes — including most good ones —
  produce none. The archive under `openspec/changes/archive/` is already
  the log of what was done and why; an ADR is the rarer thing: a record
  that exists so a future reader does not *undo the decision by accident*.
  Writing one for an ordinary choice does not document the system, it
  dilutes the set that matters and adds a second place for the truth to
  drift.
- **Four questions, all yes, or no record.** Answer them in the archive
  discussion, not in your head:
  1. **Is reversing it expensive?** If undoing it is a refactor one change
     could carry, it is not an ADR.
  2. **Was a real alternative rejected?** An ADR whose Decision had no
     contender is a description. Descriptions belong in the architecture
     docs, in the code, or in a doc comment.
  3. **Does it bind code that does not exist yet?** A choice that
     constrains only what is already written is history, and history is
     what the archive is for.
  4. **Is it unrecorded elsewhere?** A rule a test enforces, a boundary
     `AGENTS.md` states, or a relationship a diagram draws already has a
     home and an owner. Do not give it a second one.
- **These do not clear the bar**, however much discussion they took: a
  naming or vocabulary choice, a file or module layout, a refactor, a bug
  fix however subtle, a performance tuning, a dependency *version* bump, a
  test strategy, a UI arrangement, or a decision that only restates a
  principle an existing ADR already holds. Fold the reasoning into the
  change's own `design.md`; it is archived with the change and stays
  findable.
- **If the Decision needs more than a short paragraph to state, it is
  probably two decisions or none.** Split it or drop it.
- **Stable once accepted, but not frozen.** Don't quietly rewrite a
  Decision to match what the code does now — that erases the reason the
  boundary exists. When a later change *reverses* a decision, write a new
  ADR and mark the old one superseded. When a later change *continues*
  one — the same decision, refined or extended — fold it into the existing
  record instead of starting a new number, so one topic stays one ADR.
- **Consolidation is periodic and deliberate.** When several ADRs turn out
  to be one decision told in installments, or one records an approach that
  was never implemented, merge them into the surviving record, delete the
  absorbed files, and log the merge under
  [Consolidated records](#consolidated-records). The surviving ADR keeps
  its own number; every reference to an absorbed number is repointed in
  the same change. Full history stays in git and in
  `openspec/changes/archive/`.

## Index

<!-- One line per ADR: - [NNN — Title](NNN-kebab-title.md) -->

## Consolidated records

<!-- One line per absorbed ADR: - NNN — Title → consolidated into MMM -->
