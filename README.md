<div align="center">

# ai

**Personal AI tooling. Portable by default.**

[![Marketplace](https://img.shields.io/badge/uze-marketplace-8fd19e?style=flat-square&labelColor=1e1f20)](https://github.com/hiukky/uze)
[![Plugins](https://img.shields.io/badge/plugins-3-7d97c9?style=flat-square&labelColor=1e1f20)](marketplace.json)
[![Skills](https://img.shields.io/badge/skills-5-e0b567?style=flat-square&labelColor=1e1f20)](#plugins)
[![Spec](https://img.shields.io/badge/agent_plugins-1.0-a9a4c4?style=flat-square&labelColor=1e1f20)](https://agent-plugins.org)
[![Docs](https://img.shields.io/badge/docs-web-e0b567?style=flat-square&labelColor=1e1f20)](web/)

A [UZE](https://github.com/hiukky/uze) marketplace of self-contained
plugins — an engineering standard, git conventions, and a toolkit for
recording terminal UIs. Each capability is a skill an agent discovers on
its own, delivered to Claude, Codex, OpenCode and Antigravity through
whatever surface each one calls native.

```sh
uze market add hiukky/ai
```

</div>

## Plugins

| | Skills | |
|---|---|---|
| [`openspec`](openspec/) | `init` · `adr` | Spec-driven change workflow (proposal → specs → design → tasks), with ADRs formalized at archive time and LikeC4 for living diagrams |
| [`git`](git/) | `commit` · `pr` | [Conventional Commits](https://www.conventionalcommits.org/) and gitflow-named pull requests — committed proactively once a unit of work is done, not only when asked |
| [`tui`](tui/) | `record` | A TUI turned into a demo video, generated from a spec: one file says what the video shows and how to rebuild the sandbox it was recorded in |
| [`env`](env/) | `sync` | The machine as a build product of its dotfiles: a tool is installed by writing its lane in the chezmoi source and applying, never by hand, and "is it in sync?" is answered on all four axes |

Every skill declares who may invoke it in its own frontmatter — the default
is model **and** user, so an agent can reach for it and a person can call it
by name. `init` is deliberately user-only.

## Install

Machine-wide, from any project:

```sh
uze plugin install openspec@ai
uze plugin install git@ai
uze plugin install tui@ai
uze plugin install env@ai
```

Or scoped to one project, written into its `agents.lock`:

```sh
uze openspec@ai
```

## Layout

```
marketplace.json    Catalog ┐ the only two things here
web/                Docs    ┘ that aren't plugins
<name>/
  plugin.json       Manifest (Agent Plugins 1.0)
  skills/           Capabilities, one SKILL.md each
  agents/           Subagents          ┐
  hooks/            Hook configs       ├ created only when used
  resources/        Runtime files      │
  .mcp.json         MCP servers        ┘
```

## Docs

The site under [`web/`](web/) is the catalog with prose around it — what each
plugin carries, what each skill does, and what makes it fire.

```sh
cd web && bun install && bun run dev
```

Its catalog is **generated from this repository** at build time —
`marketplace.json` for the roster, each `plugin.json` for the manifest, each
`SKILL.md`'s frontmatter for the capability and its invocation policy. A skill
renamed here is renamed there on the next build, and no page can describe one
that no longer exists.

---

Author: [Romullo Sousa (hiukky)](https://github.com/hiukky)

<p align="center">
  <sub>Built with 🖤 by <a href="https://hiukky.com">Hiukky</a>
  <br/>
</p>
