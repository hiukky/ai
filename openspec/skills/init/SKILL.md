---
name: init
description: >-
  Apply the personal engineering standard to this project - OpenSpec (with
  ADRs formalized at archive time) + Mermaid architecture diagrams. Works on
  a new (empty/near-empty) or an existing project. Deliberate, one-time
  bootstrap: human-invoked only; not meant to be auto-discovered by the
  model.
invoke:
  model: false
  user: true
---

# Init (bootstrap this project's standard)

Wire this project to follow the standard: **OpenSpec** drives "what are we
changing now" (proposal/specs/design/tasks), an **ADR** formalized when a
change is archived captures "why is the system this way" for decisions
that held up through implementation and are durable enough to deserve a
permanent record, and **Mermaid diagrams** under the project's architecture
directory answer "how is the system organized". Implementation runs from
`tasks.md` and records what it decided along the way, so a long run
doesn't need somebody approving each step. Safe to re-run - every step below is
idempotent (checks before writing, never blindly overwrites existing
content).

## 0. Resolve the plugin's own root

You need this to read the bundled resource files referenced below. Don't
assume a particular harness - resolve it by kind, in this order, and stop
at the first that checks out.

1. **A harness that exposes the running plugin's own directory** does it
   through an environment variable:

   ```bash
   env | grep -iE '_plugin_root=' || true
   ```

2. **The plugin manager's store or installed-plugin manifest**, for
   whichever manager installed this plugin - the marketplace store
   directory, or the harness's record of installed plugins. Look for the
   `openspec` plugin from the `ai` marketplace (`hiukky/ai`).

3. **Ask the user** where the plugin is installed locally.

Whatever you get, **verify it before using it**: the candidate is the
right directory only if `resources/openspec/schema/schema.yaml` exists
under it. A path that doesn't have that file is the wrong plugin or the
wrong root, and copying from it silently produces a broken project.

All paths below (`$PLUGIN_ROOT/resources/...`) assume you've resolved
this.

## 1. Detect project state

- Read the current directory's top-level listing. Treat it as a **new
  project** if it has no README, no package manifest (package.json,
  Cargo.toml, pyproject.toml, go.mod, ...), and no source files beyond
  maybe a `.git/` - otherwise treat it as **existing**.
- Check whether `openspec/` already exists.
- Check whether `docs/adr/` already exists.
- Check where the project declares its architecture directory, and
  whether it already holds diagrams. Resolve this from the environment
  rather than assuming: read the project's agent-environment manifest if
  it has one, then fall back to an existing `docs/architecture/`.
  (Example - under UZE, `agents.yaml`'s `artifacts: path:` declares it.)

Report this detected state to the user in one short line before
proceeding (e.g. "Existing project, no openspec/, no docs/adr/, no
architecture diagrams yet.").

## 2. OpenSpec: init if missing

If `openspec/` does not exist:

Pick `--tools` from what this project actually uses, not from a default.
`agents` writes `AGENTS.md`, the baseline every harness reads, so it
belongs in the list either way; add the harness-specific entries for the
agents this project is already set up for, detected from what is on disk
(a harness-specific directory or config at the project root). Run
`openspec init --help` for the accepted values.

```bash
openspec init --tools agents            # portable baseline only
openspec init --tools agents,<harness>  # plus each harness this project uses
```

If nothing on disk says which harness is in use, ask rather than
guessing - this writes files into the user's repo.

If `openspec/` already exists, skip this - do not re-init.

## 3. OpenSpec: install the `adr-driven` schema

Regardless of whether OpenSpec was just initialized or already existed:

```bash
mkdir -p openspec/schemas/adr-driven/templates
cp "$PLUGIN_ROOT/resources/openspec/schema/schema.yaml" openspec/schemas/adr-driven/schema.yaml
cp "$PLUGIN_ROOT/resources/openspec/schema/templates/"*.md openspec/schemas/adr-driven/templates/
openspec schema validate adr-driven
```

This is safe to re-run (e.g. after the plugin itself gets updated) - it
always overwrites `openspec/schemas/adr-driven/` with the plugin's
current bundled version, since that directory is meant to mirror the
plugin, not to be hand-edited per project. If the project needs
project-specific schema tweaks, that's a reason to fork this schema
again under a different name, not to edit `adr-driven` in place.

## 4. OpenSpec: make it the project default

Open `openspec/config.yaml`. If its first line is `schema: spec-driven`
(or any value other than `adr-driven`), change it to `schema:
adr-driven`. If the file doesn't have a `schema:` line at all (shouldn't
happen after `openspec init`, but just in case), add one at the top.

## 5. OpenSpec: merge the standing rules

Read `$PLUGIN_ROOT/resources/openspec/config-rules.md` - it has three
blocks: text to append to `openspec/config.yaml`'s `context:` (only if
not already saying something equivalent), YAML to merge into its
`rules:` key (create `rules:` if absent; if it already has `design`
and/or `tasks` lists, append these entries to them rather than
replacing), and YAML to merge into its `operations:` key (same merge
behavior, for the `archive` guidance that formalizes ADRs).

The `context:` block ships with placeholders in angle brackets for what
differs per project - where its architecture lives and which command
checks it. **Substitute them with what this project actually uses before
writing the block**, and drop a sentence rather than keep a placeholder
you can't resolve. A literal `<...>` landing in a project's
`config.yaml` is an instruction nobody can follow.

## 6. ADR: scaffold `docs/adr/`

```bash
mkdir -p docs/adr
```

If `docs/adr/README.md` does not already exist, copy it:

```bash
cp "$PLUGIN_ROOT/resources/docs/adr-readme.md" docs/adr/README.md
```

Do not create any numbered ADR files here - those come from real
decisions, and only at archive time (via the `operations.archive`
guidance), judged against what was actually built. The `adr` skill is
the out-of-band path for a decision made outside any change, or to
backfill one that predates the convention; it is not a second routine
door, and nothing about bootstrapping a project warrants an ADR.

## 7. Architecture: point the project at its diagrams

The architecture is a handful of **Mermaid** views (`.mmd` / `.mermaid`)
under one directory the project declares. Adding a file is the whole act
of adding a diagram.

```bash
mkdir -p docs/architecture
```

- **Declare the location** in whatever the environment uses to point at a
  project's architecture, if it has such a mechanism and the project
  hasn't declared one already. (Example - under UZE: `artifacts: path:
  docs/architecture` in `agents.yaml`.) If the project already declares a
  different directory, use that one and don't move it.
- **Do not create an index.** No `README.md`, no list of diagrams - the
  files are the list, and an index is wrong the moment somebody adds the
  next diagram.
- **Do not scaffold placeholder diagrams.** A view nobody updates is
  worse than a view nobody drew, because it still looks current.
  - **New project**: create none. Draw the first view when there is
    something to draw.
  - **Existing project**: at most one view of the system boundary,
    authored from what you actually read in the codebase - plus a
    container view only if the project genuinely has distinct runnable
    or deployable units. Don't diagram internals you haven't looked at.
- **Delegate the drawing.** If the environment provides an architecture
  or diagramming skill, follow it for which view a change belongs in,
  which altitude to draw at, how to title a diagram, and how to link a
  box to the code it stands for. (Example - under UZE: the `architect`
  skill.) Never write diagram syntax from memory, including from this
  page: the renderer is the only authority on what draws, it moves, and
  a remembered grammar diverges from it silently.
- **Verify by running the environment's check**, not by reading the file
  - a diagram can be valid and still fail to draw, or draw with
  relationships silently missing. (Example - under UZE: `uze agent
  artifacts check`, which exits non-zero and is a gate, not a report.)
  If the environment offers no such check, say so plainly rather than
  inventing a validation step.

## 8. Report

Summarize what was created vs. already present vs. updated, then give the
next steps:

- `openspec new change <name>` for the next piece of work - flag candidate
  ADRs in `design.md`'s `## Candidate ADRs` note; they are judged, with
  the change's `decisions.md`, when the change is archived, and most
  changes produce no ADR at all.
- the `auto` skill to work a change's `tasks.md` through to the end
  without stopping for approval, recording what it decided in that
  change's `decisions.md` for review afterwards.
- the environment's own architecture check, to confirm the diagrams still
  draw.
