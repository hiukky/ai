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
directory answer "how is the system organized". Safe to re-run - every step below is
idempotent (checks before writing, never blindly overwrites existing
content).

## 0. Resolve the plugin's own root

You need this to read the bundled resource files referenced below.

```bash
echo "${CLAUDE_PLUGIN_ROOT:-unset}"
```

If that prints a real path, use it as `$PLUGIN_ROOT` for the rest of this
command. If it prints `unset` or empty, fall back:

```bash
python3 -c "
import json
d = json.load(open('$HOME/.claude/plugins/installed_plugins.json'))
entries = d['plugins'].get('openspec@ai', [])
print(entries[0]['installPath'] if entries else '')
"
```

If that's also empty, ask the user where the `openspec` plugin (from the
`ai` marketplace / `hiukky/ai` repo) is installed locally, and use that path.
All paths below (`$PLUGIN_ROOT/resources/...`) assume you've resolved this.

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

```bash
openspec init --tools claude
```

(If the user's primary AI tool isn't Claude Code, ask which `--tools`
value to use instead - see `openspec init --help`.)

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

## 6. ADR: scaffold `docs/adr/`

```bash
mkdir -p docs/adr
```

If `docs/adr/README.md` does not already exist, copy it:

```bash
cp "$PLUGIN_ROOT/resources/docs/adr-readme.md" docs/adr/README.md
```

Do not create any numbered ADR files here - those come from real
decisions, formalized when an OpenSpec change is archived (via the
`operations.archive` guidance) or recorded ad hoc via the `adr` skill,
not from init.

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

Summarize what was created vs. already present vs. updated, and remind
the user of the next steps: `openspec new change <name>` for the next
piece of work (flag candidate ADRs in design.md's `## Candidate ADRs`
note; they get formalized under `docs/adr/` when the change is archived),
and the environment's own architecture check to confirm the diagrams
still draw.