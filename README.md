<h1 align="center">🤖 ai</h1>

<p align="center">Personal hub for AI-focused resources: agents, skills, MCPs, and UZE plugins.</p>

<br>

## Structure

This repo is a **UZE marketplace** (`marketplace.json`, the same shape UZE's
own official marketplace uses) that catalogs one or more plugins, each
self-contained under `plugins/<name>/`:

```
marketplace.json   Marketplace catalog
plugins/
  <name>/
    plugin.json     Plugin manifest (Agent Plugins 1.0)
    agents/         Custom subagents
    skills/         Skill packages
    commands/       Custom slash commands
    hooks/          Hook configurations
    resources/      Bundled files a plugin's commands/skills read at runtime
    .mcp.json       MCP server definitions
```

Only what's actually in use exists at any given time; empty categories
above are simply not created for a given plugin until needed.

## Plugins

### `std`

Personal engineering standard, portable across projects: **OpenSpec**
(proposal/specs/design/tasks) extended with an optional **ADR** artifact
for durable, hard-to-reverse decisions, plus **LikeC4** for living
architecture diagrams.

```
/std:init   Apply the standard to a new or existing project
/std:adr    Record one ADR ad hoc, outside an OpenSpec change
```

See `plugins/std/`.

### `flow`

Personal git/dev workflow conventions - starting with a `commit` skill
that commits (and pushes) finished work in [Conventional Commits](https://www.conventionalcommits.org/)
format (`feat:`, `fix:`, `docs:`, ...) **proactively**, once a unit of
work is genuinely done - not only when explicitly asked. Force-push and
rewriting pushed history stay outside that default and still need
confirmation.

See `plugins/flow/`.

## Install

```
uze add https://github.com/hiukky/ai#plugins/std
uze add https://github.com/hiukky/ai#plugins/flow
```

(dotfiles-managed machines: this repo is cloned/updated locally by that
setup - `uze setup` picks up installed plugins from there once it's on
disk.)
