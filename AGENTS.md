# AGENTS.md

## Overview
Personal hub for AI resources, published for other people to install — a **UZE marketplace** (`marketplace.json`) cataloging self-contained plugins at the repo's top level. Opinionated by design, portable by rule: the standards here are one person's, the plugins that carry them are not tied to one person's machine (see Conventions). Only two things here aren't themselves plugins: `marketplace.json`, and `web/` (the documentation site). Register once with `uze market add hiukky/ai`, then `uze plugin install <name>@ai` (machine-wide) or `uze <name>@ai` (current project only); on dotfiles-managed machines the repo is cloned locally and `uze setup` picks it up.

## Structure
```
marketplace.json     Catalog (same shape as UZE official marketplace)
web/                 Documentation site (Fumadocs on Next.js) — see web/AGENTS.md
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
- `tui` — terminal UI media: the `record` skill generates a demo video (asciinema cast → GIF) from a **spec** — one YAML (or TOML) file, next to the video it produces, saying what the video shows in order plus everything needed to make it again: the disposable sandbox it is recorded in, the fixtures the app acts on, and the numbers it is cut with. Never the operator's own machine; every gesture verified before the next one runs; waiting cut by rescaling timestamps rather than dropping events; publishing gated on a leak scan. Entry point: `scripts/tui-record` (`init`/`validate`/`beats`/`seed`/`probe`/`run`/`recut`), a spec interpreter — the format reference is `references/spec.md`. See `tui/skills/record/SKILL.md`.
- `env` — machine/environment management: a machine is a build product of its dotfiles repo (a chezmoi source directory), so installing or configuring anything means writing it into the source and letting `chezmoi apply` perform it, never by hand; `add`/`re-add` are an import path for what already happened, not a workflow. the `sync` skill opens by *reading* the setup it is pointed at (`chezmoi source-path`, the lanes that exist, the source dir's own docs, which package/version managers it actually uses) and then classifies the change by kind — OS package, declarative version manager, guarded `run_once_` installer, host-machine script, `.chezmoitemplates` for files outside the target dir, untracked generated state. Auditing sync means all four axes (machine vs source, source vs committed, committed vs pushed, installed vs never provisioned); only three have commands. Model-discoverable, so "instala o X" routes through the repo by default. See `env/skills/sync/SKILL.md`.

Deliberately *not* split into their own plugins yet - the current inventory doesn't need it and premature separation is easy to regret: an `architecture`/`specification` split of `openspec` (OpenSpec and ADR/LikeC4 are one coupled workflow today; split only when one needs to evolve independently of the other), a standalone `project` plugin (there's only one bootstrap entry point, the `init` skill; split out only if a second, non-OpenSpec bootstrap concern shows up), and an `adapters/` layer for per-harness translation (UZE itself already detects/provisions claude-code/codex/opencode/gemini - confirm it doesn't already cover this before duplicating it here).

## Build / Test / Lint
No build, test, or lint commands at repo root — the root is a marketplace catalog, not a runnable app. Validate marketplace/plugin shape with UZE tooling when needed (`uze list`, `uze context inspect`).

`web/` is the one runnable thing here: `bun install`, then `bun run dev` / `bun run build` / `bun run types:check` from inside it. Its catalog is generated from this repository at build time (`bun run catalog` → `web/lib/catalog.json`), so the site is built from a checkout, never from a copy of `web/` alone.

## Conventions
- **Nothing is keyed to one machine or one person.** These plugins are published for others to install, so a skill *discovers* the environment it runs in instead of describing the author's: resolve locations at runtime (`chezmoi source-path`, the installed-plugin manifest, what is actually on disk), read the target repo's own docs and let them win over the skill, and classify by **kind** (an OS package manager, a declarative version manager, a host machine) rather than naming the one in use here. Opinionated is fine — that is what a personal standard is — hardcoded is not: details from the author's setup appear as labelled examples, never as the contract. This prevents two failures at once — a fork on a different OS or toolchain getting confidently wrong instructions, and a copy of state that lives in another repo (filenames, numbering schemes, tool lists) going stale in silence.
- Keep `marketplace.json` in sync when adding/removing plugins (`name`/`source`/`description`/`keywords`). The docs site's catalog is generated from it plus each `plugin.json` and `SKILL.md` frontmatter — an unregistered plugin is invisible there. A new plugin still needs one hand-written page: `web/content/docs/plugins/<name>.mdx` and an entry in that folder's `meta.json`. Never restate a skill list in MDX; the catalog components read the live data.
- Keep each plugin self-contained under `<name>/` at the repo root; don't leak plugin files into `marketplace.json`-adjacent shared space, and don't nest plugins inside each other.
- Don't hand-edit UZE-managed regions (`<!-- uze:begin -->` / `<!-- uze:end -->`); run `uze context reconcile` for those.
- For changes that touch `openspec` plugin resources, mirror upstream expectations: `openspec/schemas/adr-driven/` (in a project that adopted the standard) mirrors `openspec/resources/openspec/schema/` (in this repo) — don't hand-edit per-project copies.
- Commit messages follow Conventional Commits (see `git` plugin's `commit` skill).
