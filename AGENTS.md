# AGENTS.md

## Overview
Personal hub for AI resources — a **UZE marketplace** (`agents.json`) cataloging self-contained plugins at the repo's top level: `agents.json` is the only thing here that isn't itself a plugin. Register once with `uze market add hiukky/ai`, then `uze plugin install <name>@ai` (machine-wide) or `uze <name>@ai` (current project only); on dotfiles-managed machines the repo is cloned locally and `uze setup` picks it up.

## Structure
```
agents.json          Catalog (same shape as UZE official marketplace)
<name>/
  plugin.json         Manifest (Agent Plugins 1.0)
  skills/             Skill packages (agent-discoverable)
  commands/           Slash commands (human-invoked)
  agents/             Custom subagents (when present)
  hooks/              Hook configs (when present)
  resources/          Bundled files read at runtime
  .mcp.json           MCP servers (when present)
```
Only categories actually in use are created.

Plugins are grouped by **domain** (what the capability is about), not by how it's invoked. A capability's canonical logic lives in its `skills/<name>/SKILL.md`; a `commands/<name>.md` is a thin human-facing wrapper that points at the skill (`/<plugin>:<name>`) rather than a second implementation - a command should orient the harness at the skill and pass through user arguments, not duplicate its process/checks. Not every skill needs a command (a rare, deliberate action like project bootstrap can stay command-only), and not every command implies a skill (same reasoning, inverted) - add a skill layer once a capability would benefit from the agent discovering/triggering it on its own, not just from a human typing a slash command.

Current plugins:
- `openspec` — engineering standard: OpenSpec (`proposal`/`specs`/`design`/`tasks`) with optional ADR (`docs/adr/`, Nygard style) + LikeC4 (`docs/architecture/likec4/`, `model.c4`/`views.c4`/`specification.c4`). `/openspec:init` bootstraps a project (command-only - deliberate, one-time). `/openspec:adr` / the `adr` skill records one ADR ad hoc, proactively when a decision clears the bar. See `openspec/`.
- `git` — git workflow: Conventional Commits (`feat:`/`fix:`/`docs:`/`chore:`...) via the `commit` skill — commit+push proactively when a unit of work is done and verified, no force-push without confirmation. `/git:commit` is a thin wrapper. See `git/skills/commit/SKILL.md`.
- `team` — multi-agent coordination: `git-worktree-coordinator` skill gives multiple agents exclusive, verified ownership of Git worktrees (atomic claim registry + `verify`-before-write), built on top of [worktrunk](https://worktrunk.dev) (`wt`) for the actual worktree mechanics. `/team:worktree` is a thin wrapper. Entry point: `scripts/worktree-coordinator` (`doctor`/`create`/`claim`/`verify`/`release`/`finish`/`remove`/`prune`). See `team/skills/git-worktree-coordinator/SKILL.md`.

Deliberately *not* split into their own plugins yet - the current inventory doesn't need it and premature separation is easy to regret: an `architecture`/`specification` split of `openspec` (OpenSpec and ADR/LikeC4 are one coupled workflow today; split only when one needs to evolve independently of the other), a standalone `project` plugin (there's only one bootstrap entry point, `/openspec:init`; split out only if a second, non-OpenSpec bootstrap concern shows up), and an `adapters/` layer for per-harness translation (UZE itself already detects/provisions claude-code/codex/opencode/gemini - confirm it doesn't already cover this before duplicating it here).

## Build / Test / Lint
No build, test, or lint commands at repo root — this repo is a marketplace catalog, not a runnable app. No `package.json` scripts or CI workflows to run. Validate marketplace/plugin shape with UZE tooling when needed (`uze list`, `uze context inspect`).

## Conventions
- Keep `agents.json` in sync when adding/removing plugins (`name`/`source`/`description`/`keywords`).
- Keep each plugin self-contained under `<name>/` at the repo root; don't leak plugin files into `agents.json`-adjacent shared space, and don't nest plugins inside each other.
- Don't hand-edit UZE-managed regions (`<!-- uze:begin -->` / `<!-- uze:end -->`); run `uze context reconcile` for those.
- For changes that touch `openspec` plugin resources, mirror upstream expectations: `openspec/schemas/adr-driven/` (in a project that adopted the standard) mirrors `openspec/resources/openspec/schema/` (in this repo) — don't hand-edit per-project copies.
- Commit messages follow Conventional Commits (see `git` plugin's `commit` skill).
