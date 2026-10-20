<div align="center">

# ai

**Personal AI tooling. Portable by default.**

[![uze](https://img.shields.io/badge/uze-marketplace-3a3b3c?style=flat-square&labelColor=1e1f20)](https://uze.sh/docs/plugins/marketplaces)
[![plugins](https://img.shields.io/badge/plugins-5-3a3b3c?style=flat-square&labelColor=1e1f20)](marketplace.json)
[![skills](https://img.shields.io/badge/skills-10-3a3b3c?style=flat-square&labelColor=1e1f20)](#plugins)
[![spec](https://img.shields.io/badge/agent_plugins-1.0-3a3b3c?style=flat-square&labelColor=1e1f20)](https://agent-plugins.org)

A [uze](https://uze.sh) marketplace of self-contained plugins. Install one
once and Claude Code, Codex, OpenCode and Antigravity each receive its
skills through their own most native surface.

```sh
uze market add hiukky/ai
```

</div>

## Plugins

| Plugin | Skills | What it does |
|---|---|---|
| [`openspec`](openspec/) | `init` · `auto` · `adr` | Spec-driven changes (proposal → specs → design → tasks), ADRs at archive time, Mermaid diagrams kept current |
| [`git`](git/) | `commit` · `pr` | [Conventional Commits](https://www.conventionalcommits.org/) and well-named pull requests, committed as work gets done |
| [`code`](code/) | `polish` · `refactor` | Independent review and fixes before a PR; behavior-preserving refactors in small green steps |
| [`tui`](tui/) | `record` | Terminal UI demo videos generated from a spec, recorded in a disposable sandbox |
| [`env`](env/) | `sync` · `reclaim` | The machine as a build product of its dotfiles, and its disks kept in check |

Skills are invocable by both model and user unless their frontmatter says
otherwise — `init` is user-only.

## Install

Needs [uze](https://uze.sh):

```sh
curl -fsSL https://uze.sh/i | sh
```

**Per project** — writes `agents.yaml` and `agents.lock`; commit both.

```sh
uze openspec@ai
uze git@ai
```

**Per machine** — for every project; the natural scope for `env`.

```sh
uze install env@ai -m
```

`uze inspect <plugin>` shows what a plugin carries; `uze status` shows what
is installed where.

## Developing

Link the marketplace to a checkout and installs read its working tree:

```sh
uze market link ai ~/ai
uze agent plugin check env
uze agent market check .
uze update env -m
```

Each plugin lives in `<name>/` with a `plugin.json`, its `skills/`, and
`agents/`, `hooks/`, `resources/` or `.mcp.json` only when used.

## Docs

The site in [`web/`](web/) is generated from this repository at build time,
so it never describes a skill that no longer exists.

```sh
cd web && bun install && bun run dev
```

How uze installs and updates plugins: [uze.sh/docs](https://uze.sh/docs).

---

<p align="center"><sub>Built by <a href="https://hiukky.com">hiukky</a></sub></p>
