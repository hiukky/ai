---
name: init
description: >-
  Adopt the personal engineering standard in this project - OpenSpec
  (proposal/specs/design/tasks) with ADRs written only at archive time, and
  Mermaid architecture diagrams. Use when someone asks to set this standard
  up, bootstrap a project onto it, or adopt it in an existing repository.
  Not for running a change through the standard once it is adopted (that is
  `auto`), not for writing a single decision record (that is `adr`), and not
  for setting up agent context portability across harnesses.
compatibility: >-
  The `openspec` CLI on PATH (npm `@fission-ai/openspec`), bash and python3.
  Writes into the current project; run it from the project root.
invoke:
  model: false
  user: true
---

# Init (bootstrap this project's standard)

Wire this project to follow the standard: **OpenSpec** drives "what are we
changing now" (proposal/specs/design/tasks), an **ADR** written when a change
is archived captures "why is the system this way" for the rare decision that
held up and is expensive to reverse, and **Mermaid diagrams** under the
project's architecture directory answer "how is the system organized".
Implementation runs from `tasks.md` and records what it decided along the
way, so a long run doesn't need somebody approving each step.

The copying, scaffolding and validating is one script, so it either succeeds
or exits non-zero:

```bash
"$SKILL_DIR/scripts/openspec-init" --help
```

`$SKILL_DIR` is the directory this file is in. The script resolves the plugin
from its own location, so nothing has to hunt for a plugin root.

What is left below is the part a script can't decide. Safe to re-run:
everything is idempotent and checks before writing.

## 1. Read the project before changing it

```bash
"$SKILL_DIR/scripts/openspec-init" detect
```

It reports whether this is a new or existing project, what OpenSpec state
exists, which schema is active, where the architecture is declared to live
and how many diagrams are there, and which harnesses the project is already
set up for. Report that back to the user in one line before proceeding -
adopting a standard changes their repository, and they should see what you
found before you act on it.

## 2. OpenSpec: init if missing

Only if `detect` said `openspec: absent`.

Pick `--tools` from what the project actually uses, not from a default.
`agents` writes `AGENTS.md`, the baseline every harness reads, so it belongs
in the list either way; add the harness-specific entries `detect` found. Run
`openspec init --help` for the accepted values.

```bash
openspec init --tools agents            # portable baseline only
openspec init --tools agents,<harness>  # plus each harness this project uses
```

If `detect` found no harness, ask rather than guessing - this writes files
into the user's repo.

## 3. Install the schema, the ADR home, and the architecture directory

```bash
"$SKILL_DIR/scripts/openspec-init" all
```

That installs `openspec/schemas/adr-driven/` from the plugin, validates it,
sets `schema: adr-driven` as the project default, creates `docs/adr/` with
its README if absent, and creates the architecture directory.

`openspec/schemas/adr-driven/` mirrors the plugin and is refreshed wholesale
on every run - it is not meant to be hand-edited per project. A project that
needs its own schema tweaks forks the schema under a different name rather
than editing `adr-driven` in place.

No numbered ADR files are created, ever: those come from real decisions, at
archive time, judged against what was actually built.

## 4. Merge the standing rules

Read `$PLUGIN_ROOT/resources/openspec/config-rules.md` - it has three blocks:
text to append to `openspec/config.yaml`'s `context:` (only if it isn't
already saying something equivalent), YAML to merge into `rules:`, and YAML
to merge into `operations:`. Where those keys already have entries, append
rather than replace; a project's own rules are not yours to drop.

The `context:` block ships with placeholders in angle brackets for what
differs per project - where its architecture lives, and which command checks
it. Substitute them with what `detect` reported, and drop a sentence rather
than leave a placeholder you can't resolve. A literal `<...>` landing in a
project's config is an instruction nobody can follow.

## 5. Architecture: one view, or none

The directory exists now; what goes in it is a judgement.

- **New project**: nothing. Draw the first view when there is something to
  draw.
- **Existing project**: at most one view of the system boundary, authored
  from what you actually read in the codebase - plus a container view only
  if the project genuinely has distinct runnable or deployable units. Don't
  diagram internals you haven't looked at.

A view nobody updates is worse than a view nobody drew, because it still
looks current. Same reason there is no index file: the diagrams are the
list, and an index is wrong the moment somebody adds the next one.

If the environment provides an architecture or diagramming skill, follow it
for which view a change belongs in, which altitude to draw at, how to title
it, and how to link a box to the code it stands for. (Example - under UZE:
the `architect` skill, with `uze agent artifacts check` as the gate.) Never
write diagram syntax from memory, including from this page: the renderer is
the only authority on what draws, it moves, and a remembered grammar
diverges from it silently. If the project declares where its architecture
lives through some manifest and hasn't yet, set it to the directory `detect`
reported.

## 6. Report

Summarize what was created, what was already present, and what was updated -
then the next steps:

- `openspec new change <name>` for the next piece of work. Flag candidate
  ADRs in `design.md`'s `## Candidate ADRs` note; they are judged, with the
  change's `decisions.md`, when the change is archived, and most changes
  produce no ADR at all.
- the `auto` skill to work a change's `tasks.md` through to the end without
  stopping for approval, recording what it decided for review afterwards.
- the environment's architecture check, to confirm the diagrams still draw.
