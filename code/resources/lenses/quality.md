# Lens: quality

Whether the next person can read it, change it and trust it. The project's
own style rules come first; this is for what they leave open. Asked of a
change or of code as it stands. Tests have a lens of their own - see
`tests.md`.

## Ask

- **Names.** Does each name say what the thing means, in the project's own
  vocabulary? A name that needs a comment to explain it is the thing to
  fix, not the comment to write.
- **Smells** (Fowler's, the ones worth acting on):
  - a function that does several things you could name separately;
  - a function more interested in another module's data than its own;
  - the same group of values always passed together, that wants to be one
    type;
  - a primitive (string, int, bool flag) standing for a domain concept;
  - a conditional on a type or mode repeated in several places;
  - duplicated logic that must change together - not merely similar code
    that happens to look alike;
  - speculative generality: parameters, options and extension points with
    one caller and no second one in sight.
- **Dead code.** Functions, branches, flags, exports and files nothing
  reaches - prove it with a search for every spelling, including config,
  templates and other entry points, before calling it dead. Commented-out
  code goes; history keeps it.
- **Workarounds.** Code that treats a symptom instead of the cause:
  a platform guard or a skipped test hiding a failure instead of fixing it,
  a sleep or a retry standing in for synchronization, a special case for
  one input, a catch that swallows the error to make a path "work", a
  `TODO` that has become permanent. Each is either justified - a comment
  says what constraint forces it and when it can go - or a finding.
- **Comments.** Do the remaining ones explain *why* - a constraint, a
  workaround, a non-obvious decision? Comments that restate the code go;
  comments gone stale are updated or removed.
- **Errors.** Are failures reported with the context a reader needs? An
  error swallowed, a catch widened, a cause lost, or a panic where the
  caller could have handled it, is a finding.
- **Consistency.** Does the code look like the code around it - its idioms,
  error style, module layout? A second way of doing something the project
  already does one way makes it worse, however good the second way is.

## Don't

- Reformat code you did not otherwise touch - it buries the real change in
  the diff. If the project has a formatter, run it on what you touched.
- Chase every smell. Act on those that stand between the code and the
  run's goal; report the rest.
