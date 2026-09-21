# Descriptions, before and after

Real commit lines that failed the five rules in `SKILL.md`, and what each
should have been. The pattern to notice is not the wording - it is that
every line on the right names something you could grep for, and every line
on the left describes an intention instead.

| instead of | write |
|---|---|
| `feat(observability): keep a journal nobody has to turn on` | `feat(observability): enable the session journal by default` |
| `feat(plugins): say whether an installed plugin is the one that exists` | `feat(plugins): flag installed plugins missing from the catalogue` |
| `feat(marketplace): skip what this machine cannot reach, and say access is access` | `feat(marketplace): report unreachable marketplaces as an access error` |
| `fix(ui): read the strip's right end as three zones, not a row of chips` | `fix(ui): render the status bar's right side as three fixed zones` |
| `fix(terminal): never end a live server that can still serve the client` | `fix(terminal): keep the server alive while a client is attached` |
| `feat!: carry every record across a version, and give every agent its work's state` | `feat!: migrate persisted records on version change` + a second commit for the agent state |

What went wrong, by column:

- *keep a journal nobody has to turn on* - narrates what the product is like,
  names nothing. The diff added a default to the session journal.
- *say whether an installed plugin is the one that exists* - a riddle. The
  reader cannot tell it is about catalogue membership.
- *skip what this machine cannot reach, and say access is access* - two
  half-statements welded with `, and`, neither finished.
- *read the strip's right end as three zones, not a row of chips* - coined
  imagery for something the code calls a status bar.
- *never end a live server that can still serve the client* - narration; the
  edit was keeping the server alive while a client is attached.
- *carry every record across a version, and give every agent its work's
  state* - two changes in one line, which is two commits.
