<h1 align="center">🤖 ai</h1>

<p align="center">Personal hub for AI-focused resources: agents, skills, MCPs, and Claude Code plugins.</p>

<br>

## Structure

This repo is a **Claude Code marketplace** (`.claude-plugin/marketplace.json`)
that catalogs one or more plugins, each self-contained under `plugins/<name>/`:

```
.claude-plugin/marketplace.json   Marketplace catalog
plugins/
  <name>/
    .claude-plugin/plugin.json    Plugin manifest
    agents/                       Custom subagents
    skills/                       Skill packages
    commands/                     Custom slash commands
    hooks/                        Hook configurations
    resources/                    Bundled files a plugin's commands/skills read at runtime
    .mcp.json                     MCP server definitions
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
that writes every commit in [Conventional Commits](https://www.conventionalcommits.org/)
format (`feat:`, `fix:`, `docs:`, ...), triggered automatically whenever
a commit is requested, no explicit invocation needed.

See `plugins/flow/`.

## Install

```
/plugin marketplace add hiukky/ai
/plugin install std@ai
/plugin install flow@ai
```

(dotfiles-managed machines: this repo is cloned/updated locally by that
setup - the two commands above just enable it inside Claude Code once
it's on disk.)
