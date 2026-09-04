<h1 align="center">🤖 ai</h1>

<p align="center">Personal hub for AI-focused resources: agents, skills, MCPs, and UZE plugins.</p>

<br>

## Structure

This repo is a **UZE marketplace** (`marketplace.json`, the same shape UZE's
own official marketplace uses) that catalogs one or more plugins, each
self-contained at the repo's top level - `marketplace.json` is the only thing
here that isn't itself a plugin:

```
marketplace.json   Marketplace catalog
<name>/
  plugin.json     Plugin manifest (Agent Plugins 1.0)
  agents/         Custom subagents
  skills/         Skill packages - agent-discoverable capabilities
  skills/         Skill packages (agent-discoverable; invocation policy in frontmatter)
  hooks/          Hook configurations
  resources/      Bundled files a plugin's skills read at runtime
  .mcp.json       MCP server definitions
```

Only what's actually in use exists at any given time; empty categories
above are simply not created for a given plugin until needed. Plugins
are grouped by domain, not by how a capability is invoked - invocation
semantics live in each SKILL.md's `invoke:` block (ADR-030): absent =
model+user, `model: false, user: true` = explicit user-only action (the
former Command), `model: true, user: false` = background-only. No
`commands/` directory; integrations derive vendor surfaces from that one
policy.
entry doesn't reimplement its skill, it just points the harness at it.

## Plugins

### `openspec`

Personal engineering standard, portable across projects: **OpenSpec**
(proposal/specs/design/tasks) with **ADRs** formalized at archive time
for durable, hard-to-reverse decisions that held up through
implementation, plus **LikeC4** for living architecture diagrams.

```
init (user-only)  Apply the standard to a new or existing project
adr               Record one ADR ad hoc, outside an OpenSpec change
```

The `adr` skill also triggers proactively - when a
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
commit (model+user)   Commit (and push) the current changes - proactively and on demand
```

See `git/`.

### `tui`

Terminal UI media. The `record` skill produces a demo video of a TUI that
is actually publishable: it records a **disposable sandbox** rather than
the operator's machine, performs the take through a driver script where
every gesture is verified before the next one runs (a beat that silently
misses is what makes a recording look like the app misbehaving), cuts the
waiting by rescaling timestamps instead of dropping events, and refuses to
call a cast finished until a leak scan passes.

```
record (model+user)   Record a TUI as a demo video - sandbox, take, cut, render
```

Ships `scripts/tui-record` (`doctor`/`take`/`check`/`redact`/`compress`/`render`)
and `scripts/driver-lib.sh`, the gesture library a take is written in.

See `tui/`.

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
uze plugin install tui@ai
```

Or scoped to just the current project instead (adds to that project's
`agents.lock`):

```
uze openspec@ai
uze git@ai
uze tui@ai
```

(dotfiles-managed machines: this repo is cloned/updated locally by that
setup - `uze setup` picks up installed plugins from there once it's on
disk.)
