# openspec/config.yaml additions

The `init` skill merges these into the project's `openspec/config.yaml` (append
to `context:` if the block doesn't already say something equivalent; merge
into `rules:` and `operations:` rather than overwriting any existing entries).

## Append to `context:`

```
Architecture documentation: the system architecture is drawn as Mermaid
(`.mmd` / `.mermaid`) under <the project's declared architecture
directory> - one file per view, no index. This is the diagrammable
source of truth. Verify with <the environment's own artifact check>; a
diagram can be valid and still fail to draw, or draw with relationships
silently missing, so reading the file is not verification.

  (When merging this block, substitute both placeholders with what this
  project actually uses - the directory it declares and the command that
  checks it. Under UZE that is `agents.yaml`'s `artifacts: path:` and
  `uze agent artifacts check`; another environment will differ. If the
  project has no such check, drop that sentence rather than inventing
  one.)

Architecture decisions: the default is NO ADR - most changes, including
most good ones, produce none. A significant, hard-to-reverse decision
gets a numbered ADR under docs/adr/ (Nygard style: Context/Decision/
Consequences) only at archive time (see `operations.archive` below),
for a decision flagged in a change's design.md or recorded in its
decisions.md that held up through implementation. See docs/adr/README.md
for the four questions that gate it and the list of what never
qualifies. The `adr` skill records one outside that flow only when
asked, or to backfill a decision predating this convention.
```

## Set/merge `rules:`

```yaml
rules:
  design:
    - If this change adds/removes a container or component, adds an
      external dependency, or changes a relationship between them, update
      the architecture diagrams as part of this change (not a follow-up),
      and note the update in this design doc. Prefer editing the view
      that already covers that altitude over adding a file; add one only
      when no existing view is about the level your change touches.
    - If this change makes an architecturally significant, hard-to-reverse
      decision (new external dependency, irreversible technology choice,
      a pattern costly to change later), flag it under a `## Candidate
      ADRs` note (title + one-line why) - don't write the full ADR now,
      the design can still change while the change is in flight. Flagging
      is cheap and the archive re-judges it, but flag a decision, not
      every choice: a naming or layout call, a refactor, a test strategy
      or a dependency version bump never becomes an ADR and does not
      belong in this note.
  tasks:
    - If design.md notes a required diagram update, include a task for
      it that runs the environment's architecture check before
      considering the change done - the check is the gate, not a look at
      the file.
```

## Set/merge `operations:`

```yaml
operations:
  archive:
    guidance:
      - Before moving the change, read BOTH sources of candidate
        decisions: design.md's `## Candidate ADRs` note (decisions known
        before implementing) and decisions.md (decisions taken during
        implementation). Judge by what was actually built, not by what
        was originally flagged - if the approach changed along the way, a
        flagged decision may no longer apply, and an unflagged one may
        now qualify.
      - Start from NO ADR and make each candidate earn one. It qualifies
        only if all four are yes, answered out loud in this discussion,
        not in your head: (1) is reversing it expensive - if undoing it
        is a refactor one change could carry, it is not an ADR; (2) was a
        real alternative rejected - a Decision with no contender is a
        description, and descriptions belong in the architecture docs or
        the code; (3) does it bind code that does not exist yet - a
        choice constraining only what is already written is history, and
        the archive is what history is for; (4) is it unrecorded
        elsewhere - a rule a test enforces, a boundary AGENTS.md states
        or a relationship a diagram draws already has a home.
      - These never qualify, however long they were debated: a naming or
        vocabulary choice, a file or module layout, a refactor, a bug fix
        however subtle, a performance tuning, a dependency version bump,
        a test strategy, a UI arrangement, or a decision that only
        restates a principle an existing ADR already holds. Fold the
        reasoning into the change's own design.md - it is archived with
        the change and stays findable.
      - If the Decision needs more than a short paragraph to state, it is
        probably two decisions or none. Split it or drop it.
      - If a qualifying decision continues an existing ADR rather than
        reversing it - the same decision refined or extended - fold it
        into that record instead of taking a new number, so one topic
        stays one ADR.
      - Every decisions.md entry must be resolved before the change is
        archived: `accepted` entries are the ADR candidates above,
        `overturned` ones must already have their follow-up work in
        tasks.md, and an entry still `pending` means the change is not
        ready to archive - say so and stop rather than archiving an
        unreviewed decision.
      - For each qualifying decision, write one ADR: list existing
        `docs/adr/NNN-*.md` files, take the next sequential number
        (3 digits, zero-padded, continuing the existing sequence), and
        create `docs/adr/<NNN>-<kebab-title>.md` in Nygard style (Context
        is the situation forcing a choice, Decision is what was chosen
        stated firmly, Consequences covers what becomes easier/harder
        including trade-offs accepted), with a trailing line `Source
        change: openspec/changes/<change-name>/`. This file is the
        permanent record - it is not moved or deleted when the change is
        archived.
      - If nothing clears the bar, create no ADR files and say so. This
        is the expected outcome, not a failure of the change: an ADR set
        that grows with every archive is a set nobody reads.
      - If a decision here reverses or supersedes an existing ADR, do not
        edit that file's Decision retroactively - write a new ADR instead
        and add `Status: Superseded by docs/adr/<NNN>-<new-title>.md` to
        the old file.
```

If the project's `openspec/config.yaml` already has a `rules:` and/or
`operations:` key, merge these entries into the existing lists rather
than replacing them.
