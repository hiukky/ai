<h1 align="center">🤖 ai</h1>

<p align="center">Personal hub for AI-focused resources: agents, skills, MCPs, and UZE plugins.</p>

<br>

## Structure

This repo is a **UZE marketplace** (`agents.json`, the same shape UZE's
own official marketplace uses) that catalogs one or more plugins, each
self-contained at the repo's top level - `agents.json` is the only thing
here that isn't itself a plugin:

```
agents.json   Marketplace catalog
<name>/
  plugin.json     Plugin manifest (Agent Plugins 1.0)
  agents/         Custom subagents
  skills/         Skill packages - agent-discoverable capabilities
  commands/       Slash commands - thin, human-invoked wrappers around a skill
  hooks/          Hook configurations
  resources/      Bundled files a plugin's commands/skills read at runtime
  .mcp.json       MCP server definitions
```

Only what's actually in use exists at any given time; empty categories
above are simply not created for a given plugin until needed. Plugins
are grouped by domain, not by how a capability is invoked - a `commands/`
entry doesn't reimplement its skill, it just points the harness at it.

## Plugins

### `openspec`

Personal engineering standard, portable across projects: **OpenSpec**
(proposal/specs/design/tasks) extended with an optional **ADR** artifact
for durable, hard-to-reverse decisions, plus **LikeC4** for living
architecture diagrams.

```
/openspec:init   Apply the standard to a new or existing project
/openspec:adr    Record one ADR ad hoc, outside an OpenSpec change
```

The `adr` skill behind `/openspec:adr` also triggers proactively - when a
decision made during other work clears the ADR bar, not only when
explicitly asked.

See `openspec/`.

### `git`

Personal git workflow conventions - starting with a `commit` skill
that commits (and pushes) finished work in [Conventional Commits](https://www.conventionalcommits.org/)
format (`feat:`, `fix:`, `docs:`, ...) **proactively**, once a unit of
work is genuinely done - not only when explicitly asked. Force-push and
rewriting pushed history stay outside that default and still need
confirmation.

```
/git:commit   Commit (and push) the current changes
```

See `git/`.

### `coordination`

Multi-agent coordination on top of Git worktrees: the
`git-worktree-coordinator` skill gives multiple agents exclusive,
verified ownership of a worktree - an atomic claim registry plus a
`verify` check that proves which agent, if any, actually owns the
worktree a process is standing in before it edits anything. Delegates
worktree mechanics (creation, path templating, hooks, safe branch
cleanup) to [worktrunk](https://worktrunk.dev) (`wt`) rather than
reimplementing them.

```
/coordination:worktree   Create/verify/list/finish/remove a worktree
```

See `coordination/`.

## Install

Register this repo as a marketplace once:

```
uze market add hiukky/ai
```

Then, machine-wide (works from any project, matches how these are
actually used - personal dev-workflow tooling, not a per-project
dependency):

```
uze plugin install openspec@ai
uze plugin install git@ai
uze plugin install coordination@ai
```

Or scoped to just the current project instead (adds to that project's
`agents.lock`):

```
uze openspec@ai
uze git@ai
uze coordination@ai
```

(dotfiles-managed machines: this repo is cloned/updated locally by that
setup - `uze setup` picks up installed plugins from there once it's on
disk.)
