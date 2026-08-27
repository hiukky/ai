# openspec/config.yaml additions

The `init` skill merges these into the project's `openspec/config.yaml` (append
to `context:` if the block doesn't already say something equivalent; merge
into `rules:` rather than overwriting any existing rules).

## Append to `context:`

```
Architecture documentation: the system architecture is modeled in LikeC4
(C4 model DSL) under docs/architecture/likec4/ (specification + model +
views, `.c4` files) - this is the structured, diagrammable source of
truth. Validate with `<pkg-runner> arch:validate` (script name may differ
per project - check package.json/justfile/Makefile).

Architecture decisions: significant, hard-to-reverse decisions get a
numbered ADR under docs/adr/ (Nygard style: Context/Decision/
Consequences), generated via the `adr` artifact in the OpenSpec schema
(optional, only when a change's design.md contains a qualifying
decision) or recorded ad hoc with the `adr` skill.
```

## Set/merge `rules:`

```yaml
rules:
  design:
    - If this change adds/removes a container or component, adds an
      external dependency, or changes a relationship between them, update
      the LikeC4 model under docs/architecture/likec4/ as part of this
      change (not a follow-up), and note the update in this design doc.
    - If this change makes an architecturally significant, hard-to-reverse
      decision (new external dependency, irreversible technology choice,
      a pattern costly to change later), flag it here for the `adr`
      artifact - don't duplicate the full write-up.
  tasks:
    - If design.md notes a required LikeC4 model update, include a task
      for it that runs the project's arch-validate script before
      considering the change done.
    - If the `adr` artifact produced entries, include a task confirming
      the matching docs/adr/NNN-*.md file(s) exist.
```

If the project's `openspec/config.yaml` already has a `rules:` key, merge
these entries into the existing `design`/`tasks` lists rather than
replacing them.
