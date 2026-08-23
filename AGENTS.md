# AGENTS.md

## Overview
Personal hub for AI resources — a **UZE marketplace** (`marketplace.json`) cataloging self-contained plugins under `plugins/<name>/`. Clone source for `uze add https://github.com/hiukky/ai#plugins/<name>`; on dotfiles-managed machines the repo is cloned locally and `uze setup` picks it up.

## Structure
```
marketplace.json   Catalog (same shape as UZE official marketplace)
plugins/
  <name>/
    plugin.json    Manifest (Agent Plugins 1.0)
    skills/        Skill packages
    commands/      Slash commands
    agents/        Custom subagents (when present)
    hooks/         Hook configs (when present)
    resources/     Bundled files read at runtime
    .mcp.json      MCP servers (when present)
```
Only categories actually in use are created.

Current plugins:
- `std` — engineering standard: OpenSpec (`proposal`/`specs`/`design`/`tasks`) with optional ADR (`docs/adr/`, Nygard style) + LikeC4 (`docs/architecture/likec4/`, `model.c4`/`views.c4`/`specification.c4`). Entry points: `/std:init`, `/std:adr`. See `plugins/std/`.
- `flow` — git workflow: Conventional Commits (`feat:`/`fix:`/`docs:`/`chore:`...) — commit+push proactively when a unit of work is done and verified, no force-push without confirmation. See `plugins/flow/skills/commit/SKILL.md`.

## Build / Test / Lint
No build, test, or lint commands at repo root — this repo is a marketplace catalog, not a runnable app. No `package.json` scripts or CI workflows to run. Validate marketplace/plugin shape with UZE tooling when needed (`uze list`, `uze context inspect`).

## Conventions
- Keep `marketplace.json` in sync when adding/removing plugins (`name`/`source`/`description`/`keywords`).
- Keep each plugin self-contained under `plugins/<name>/`; don't leak plugin files to repo root.
- Don't hand-edit UZE-managed regions (`<!-- uze:begin -->` / `<!-- uze:end -->`); run `uze context reconcile` for those.
- For changes that touch `std` resources, mirror upstream expectations: `openspec/schemas/adr-driven/` mirrors `plugins/std/resources/openspec/schema/` — don't hand-edit per-project copies.
- Commit messages follow Conventional Commits (see `flow` skill).
