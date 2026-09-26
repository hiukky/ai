<div align="center">

# ai

**Personal AI tooling. Portable by default.**

[![Marketplace](https://img.shields.io/badge/uze-marketplace-8fd19e?style=flat-square&labelColor=1e1f20)](https://uze.sh/docs/plugins/marketplaces)
[![Plugins](https://img.shields.io/badge/plugins-4-7d97c9?style=flat-square&labelColor=1e1f20)](marketplace.json)
[![Skills](https://img.shields.io/badge/skills-8-e0b567?style=flat-square&labelColor=1e1f20)](#plugins)
[![Spec](https://img.shields.io/badge/agent_plugins-1.0-a9a4c4?style=flat-square&labelColor=1e1f20)](https://agent-plugins.org)
[![Docs](https://img.shields.io/badge/docs-web-e0b567?style=flat-square&labelColor=1e1f20)](web/)

A [uze](https://uze.sh) marketplace of self-contained plugins: an
engineering standard, git conventions, a toolkit for recording terminal
UIs, and a machine kept as a build product of its dotfiles. Install a
plugin once and Claude Code, Codex, OpenCode and Antigravity each receive
its skills through their own most native surface.

```sh
uze market add hiukky/ai
```

</div>

## Plugins

| | Skills | |
|---|---|---|
| [`openspec`](openspec/) | `init` · `auto` · `adr` | Spec-driven change workflow (proposal → specs → design → tasks), run unattended by `auto`, with ADRs written only at archive time and Mermaid diagrams kept current per change |
| [`git`](git/) | `commit` · `pr` | [Conventional Commits](https://www.conventionalcommits.org/) and gitflow-named pull requests, committed proactively once a unit of work is done, not only when asked |
| [`tui`](tui/) | `record` | A TUI turned into a demo video, generated from a spec: one file says what the video shows and how to rebuild the sandbox it was recorded in |
| [`env`](env/) | `sync` · `reclaim` | The machine as a build product of its dotfiles, installed by writing its lane in the chezmoi source and never by hand, with its disks kept in check: prune what regenerates, decide the rest, shrink the WSL disk last |

Every skill declares who may invoke it in its own frontmatter. The default
is model **and** user, so an agent can reach for it and a person can call it
by name. `init` is deliberately user-only.

## Install

Needs [uze](https://uze.sh) on the machine:

```sh
curl -fsSL https://uze.sh/i | sh
```

Into a project, so everyone who clones it gets the same plugins. uze writes
`agents.yaml` (what the project wants) and `agents.lock` (the commit it
resolved to); commit both.

```sh
uze openspec@ai
uze git@ai
```

On a fresh clone, `uze install` rebuilds the same set; `uze update` is what
moves it forward.

Or on this machine only, for every project and none. This is the natural
scope for `env`, which is about the machine itself:

```sh
uze install env@ai -m
uze install tui@ai -m
```

`uze inspect <plugin>` shows what a plugin carries and how each agent
receives it; `uze status` (or `-m`) shows what is installed where.

## Developing

Link the marketplace to a checkout and installs read its working tree,
uncommitted files included, so there is no publish step while iterating:

```sh
uze market link ai ~/ai
uze agent plugin check env      # the parsers an install runs, offline
uze agent market check .
uze update env -m               # re-deliver after an edit
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

The site under [`web/`](web/) is the catalog with prose around it: what each
plugin carries, what each skill does, and what makes it fire.

```sh
cd web && bun install && bun run dev
```

Its catalog is **generated from this repository** at build time:
`marketplace.json` for the roster, each `plugin.json` for the manifest, each
`SKILL.md`'s frontmatter for the capability and its invocation policy. A skill
renamed here is renamed there on the next build, and no page can describe one
that no longer exists.

How uze itself installs, delivers and updates plugins is documented at
[uze.sh/docs](https://uze.sh/docs).

---

Author: [Romullo Sousa (hiukky)](https://github.com/hiukky)

<p align="center">
  <sub>Built with 🖤 by <a href="https://hiukky.com">Hiukky</a>
  <br/>
</p>
