# Which decisions are yours

Autonomy is bought with the record: decide, write it down, keep going. What
you may decide depends on how hard it is to undo.

**Two-way doors - decide and record in one line** (commit body or report):
names, extracting or inlining, moving code inside a module boundary, the
order of steps, which of two equivalent shapes to use, which tool performs
a mechanical change, which of two fixes for a confirmed bug to apply when
both keep every caller working.

**One-way doors - never taken alone:**

- a persisted format: anything written to disk, a database, a cache key, a
  wire protocol, a config file a person edits;
- a public surface: an exported API, a CLI flag or command, an HTTP route,
  an event name - anything a caller outside this repository may depend on;
- a new dependency;
- removing behavior someone could rely on, even behavior that looks
  accidental;
- moving a trust boundary - where input is validated, where a privilege is
  checked;
- anything the project's own docs say needs approval.

A one-way door is taken only when the person decided it - while planning,
or in the request itself. Met any other way, it is not taken: take the path
that does not need it, and list it in the report as pending with your
recommendation.
