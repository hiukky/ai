# Lens: quality

Whether the next person can read it, change it and trust it. The project's
own style rules come first; this is for what they leave open.

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
  - dead code, unused parameters, speculative generality.
- **Comments.** Do the remaining ones explain *why* - a constraint, a
  workaround, a non-obvious decision? Comments that restate the code go;
  comments that went stale with the move are updated or removed.
- **Errors.** Are failures still reported with the context a reader needs,
  or did a refactoring swallow an error, widen a catch, or lose the cause?
- **Tests.** Do they test behavior through the public surface, or did they
  pin implementation details so tightly that this refactoring had to
  rewrite them? Tests rewritten in a refactoring are a signal worth
  reporting: either they were testing the wrong thing, or the refactoring
  changed behavior.
- **Consistency.** Does the new code look like the code around it - its
  idioms, error style, module layout? A refactoring that introduces a
  second way of doing something the project already does one way has made
  it worse.

## Don't

- Reformat code you did not otherwise touch - it buries the real change in
  the diff. If the project has a formatter, run it on what you touched.
- Chase every smell. Act on those that stand between the code and the
  run's goal; report the rest.
