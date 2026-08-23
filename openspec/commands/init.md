---
description: Apply the personal engineering standard to this project - OpenSpec (with an optional ADR artifact) + LikeC4 architecture diagrams. Works on a new (empty/near-empty) or an existing project.
---

# /openspec:init

Wire this project to follow the standard: **OpenSpec** drives "what are we
changing now" (proposal/specs/design/tasks), an optional **ADR** artifact
inside that same OpenSpec flow captures "why is the system this way" for
decisions durable enough to deserve a permanent record, and **LikeC4**
models "how is the system organized" as a living, diagrammable source of
truth. Safe to re-run - every step below is idempotent (checks before
writing, never blindly overwrites existing content).

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
- Check whether `docs/architecture/likec4/` already exists (and whether
  it already has `.c4` files in it, vs just being an empty/absent dir).

Report this detected state to the user in one short line before
proceeding (e.g. "Existing project, no openspec/, no docs/adr/, no
LikeC4 model yet.").

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
project-specific schema tweaks beyond the `adr` artifact, that's a
reason to fork this schema again under a different name, not to edit
`adr-driven` in place.

## 4. OpenSpec: make it the project default

Open `openspec/config.yaml`. If its first line is `schema: spec-driven`
(or any value other than `adr-driven`), change it to `schema:
adr-driven`. If the file doesn't have a `schema:` line at all (shouldn't
happen after `openspec init`, but just in case), add one at the top.

## 5. OpenSpec: merge the standing rules

Read `$PLUGIN_ROOT/resources/openspec/config-rules.md` - it has two
blocks: text to append to `openspec/config.yaml`'s `context:` (only if
not already saying something equivalent) and YAML to merge into its
`rules:` key (create `rules:` if absent; if it already has `design`
and/or `tasks` lists, append these entries to them rather than
replacing).

## 6. ADR: scaffold `docs/adr/`

```bash
mkdir -p docs/adr
```

If `docs/adr/README.md` does not already exist, copy it:

```bash
cp "$PLUGIN_ROOT/resources/docs/adr-readme.md" docs/adr/README.md
```

Do not create any numbered ADR files here - those come from real
decisions (via the OpenSpec `adr` artifact or `/openspec:adr`), not from init.

## 7. LikeC4: scaffold `docs/architecture/likec4/`

```bash
mkdir -p docs/architecture/likec4
```

If there are no `.c4` files in that directory yet:

- Copy `$PLUGIN_ROOT/resources/docs/likec4-starter/specification.c4`
  verbatim to `docs/architecture/likec4/specification.c4` - it's generic
  (actor/system/container/component kinds), no project-specific content.
- **Author** (don't copy verbatim) `docs/architecture/likec4/model.c4`
  and `views.c4` for the actual project. Use
  `$PLUGIN_ROOT/resources/docs/likec4-starter/model.c4` and `views.c4`
  only as a structural reference (their content is a placeholder example
  and says so in a comment).
  - **New project**: usually just one actor and one system so far - that's
    fine, expand it as the project grows.
  - **Existing project**: read enough of the codebase (entry points,
    services, obvious external dependencies) to model what's actually
    there - containers for distinct deployable/runnable units, components
    only where a container has real internal structure worth diagramming.
    Don't guess at internals you haven't looked at.
- Validate: `bunx likec4@latest validate docs/architecture/likec4` (or
  `npx likec4@latest validate ...` if the project doesn't use Bun).

If `.c4` files already exist there, leave the model alone - just make
sure `specification.c4` has the four base element kinds this schema
expects (add what's missing, don't remove custom elements already there).

### Wiring `arch:dev` / `arch:validate` / `arch:build`

- If the project has a `package.json`: add `likec4` as a dev dependency
  and add these three scripts (adjust the runner - `bun`/`pnpm`/`npm`/
  `yarn` - to match what the project already uses, detected from its
  lockfile):
  ```json
  "arch:dev": "likec4 start docs/architecture/likec4",
  "arch:validate": "likec4 validate docs/architecture/likec4",
  "arch:build": "likec4 build docs/architecture/likec4 -o docs/architecture/likec4/dist"
  ```
  Also gitignore `docs/architecture/likec4/dist/`.
- If the project has no JS/TS tooling at all (e.g. pure Rust/Go/Python),
  don't add a package.json just for this. Instead, note in
  `docs/architecture/overview.md` (or the README, if there's no such doc
  yet) the raw commands: `bunx likec4@latest start|validate|build
  docs/architecture/likec4 ...`.

## 8. Report

Summarize what was created vs. already present vs. updated, and remind
the user of the next steps: `openspec new change <name>` for the next
piece of work (now producing an optional `adr` artifact alongside
design.md), and the arch:* commands (or raw `bunx likec4@latest ...`) to
preview the architecture model.
