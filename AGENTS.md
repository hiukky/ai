# AGENTS.md

## Overview
Personal hub for AI resources — a **UZE marketplace** (`marketplace.json`) cataloging self-contained plugins at the repo's top level: `marketplace.json` is the only thing here that isn't itself a plugin. Register once with `uze market add hiukky/ai`, then `uze plugin install <name>@ai` (machine-wide) or `uze <name>@ai` (current project only); on dotfiles-managed machines the repo is cloned locally and `uze setup` picks it up.

## Structure
```
marketplace.json     Catalog (same shape as UZE official marketplace)
<name>/
  plugin.json         Manifest (Agent Plugins 1.0)
  skills/             Skill packages (agent-discoverable; invocation policy in frontmatter)
  agents/             Custom subagents (when present)
  hooks/              Hook configs (when present)
  resources/          Bundled files read at runtime
  .mcp.json           MCP servers (when present)
```
Only categories actually in use are created.

Plugins are grouped by **domain** (what the capability is about), not by how it's invoked. A capability's canonical logic lives in its `skills/<name>/SKILL.md`, and its invocation semantics live in the same file's `invoke:` block (ADR-030): absent means model+user (discoverable and human-invocable), `model: false, user: true` is an explicit user-only action (the former `Command`), `model: true, user: false` is background-only. There is no `commands/` directory anymore - the UZE integrations derive each vendor's surface (slash command, `$name`, auto-discovery) from that one policy. Every skill layer that would benefit from agent discovery keeps the default policy; a rare, deliberate action (like project bootstrap) declares user-only so the model never auto-triggers it.

Current plugins:
- `openspec` — engineering standard: OpenSpec (`proposal`/`specs`/`design`/`tasks`) with ADR (`docs/adr/`, Nygard style) formalized at archive time via `operations.archive` guidance, for a decision flagged in design.md that held up through implementation, + LikeC4 (`docs/architecture/likec4/`, `model.c4`/`views.c4`/`specification.c4`). the `init` skill bootstraps a project (user-only - deliberate, one-time). the `adr` skill records one ADR ad hoc, proactively when a decision clears the bar. See `openspec/`.
- `git` — git workflow: Conventional Commits (`feat:`/`fix:`/`docs:`/`chore:`...) via the `commit` skill — commit+push proactively when a unit of work is done and verified, no force-push without confirmation. the `commit` skill is model+user (proactive and explicit). See `git/skills/commit/SKILL.md`.
- `tui` — terminal UI media: the `record` skill turns a TUI into a demo video worth publishing (asciinema cast → GIF), and is opinionated about the three things that decide whether one is usable: the subject is a disposable sandbox (never the operator's own machine), the take is a driver script whose every gesture is verified before the next one runs, and the waiting is cut by rescaling timestamps rather than dropping events. Entry point: `scripts/tui-record` (`doctor`/`take`/`check`/`redact`/`compress`/`render`), plus `scripts/driver-lib.sh` that a take sources. See `tui/skills/record/SKILL.md`.

Deliberately *not* split into their own plugins yet - the current inventory doesn't need it and premature separation is easy to regret: an `architecture`/`specification` split of `openspec` (OpenSpec and ADR/LikeC4 are one coupled workflow today; split only when one needs to evolve independently of the other), a standalone `project` plugin (there's only one bootstrap entry point, the `init` skill; split out only if a second, non-OpenSpec bootstrap concern shows up), and an `adapters/` layer for per-harness translation (UZE itself already detects/provisions claude-code/codex/opencode/gemini - confirm it doesn't already cover this before duplicating it here).

## Build / Test / Lint
No build, test, or lint commands at repo root — this repo is a marketplace catalog, not a runnable app. No `package.json` scripts or CI workflows to run. Validate marketplace/plugin shape with UZE tooling when needed (`uze list`, `uze context inspect`).

## Conventions
- Keep `marketplace.json` in sync when adding/removing plugins (`name`/`source`/`description`/`keywords`).
- Keep each plugin self-contained under `<name>/` at the repo root; don't leak plugin files into `marketplace.json`-adjacent shared space, and don't nest plugins inside each other.
- Don't hand-edit UZE-managed regions (`<!-- uze:begin -->` / `<!-- uze:end -->`); run `uze context reconcile` for those.
- For changes that touch `openspec` plugin resources, mirror upstream expectations: `openspec/schemas/adr-driven/` (in a project that adopted the standard) mirrors `openspec/resources/openspec/schema/` (in this repo) — don't hand-edit per-project copies.
- Commit messages follow Conventional Commits (see `git` plugin's `commit` skill).
