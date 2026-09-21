# openspec

The engineering standard: what is being changed now, why the system is the way
it is, and how it is organized. Extends OpenSpec's schema with a fourth
per-change artifact and a harder bar for records; owns no diagram format and
ships no renderer.

- `init` — adopt the standard in a project (user-invoked; deliberate, one-time)
- `auto` — work a change's `tasks.md` to the end without stopping for approval
- `adr` — write one record out of band, or backfill one predating the convention

An ADR is written only when a change is archived, and only if four questions
are all yes — the default is no record. A decision taken *while* implementing
goes to that change's `decisions.md` with the alternative it beat and the
commit that holds it, so overturning one is a revert rather than an argument,
and it is judged for a record at archive like any other candidate.

Architecture is Mermaid under the directory the project declares. This plugin
owns **when** a view must change — inside the change that moved the boundary,
never as a follow-up — and never how to draw one.

```bash
uze plugin install openspec@ai   # machine-wide
uze openspec@ai                  # this project only
```

See [the plugin page](../web/content/docs/plugins/openspec.mdx) for the long form.
