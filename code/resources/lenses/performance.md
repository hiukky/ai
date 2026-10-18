# Lens: performance

No number, no claim. Code may be called faster or slower only if something
was measured; otherwise the report says "not measured", which is fine.
Reading the code finds *suspects*; a measurement turns one into a finding.
Asked of a change (compare before and after) or of code as it stands.

## Ask

- **Hot paths.** Does the code run per request, per item, per frame, per
  keystroke, at startup? Find out from a profile, a benchmark or the
  project's own docs - not from intuition. A suspect off the hot path is
  rarely worth a step.
- **Complexity.** A loop with an inner lookup, a linear scan where an index
  exists, a recursion without its memo, a quadratic built from two
  innocent-looking linear calls.
- **I/O.** A call that could be batched made once per item; a read inside a
  loop, or repeated on every call when it could be done once; a cache
  bypassed because its owner changed; the same file, process list or
  network resource read twice for one decision.
- **Allocation and copying.** Clones, conversions and intermediate
  collections that nothing needs; a value passed by copy that could be
  borrowed; strings built in a loop.
- **Concurrency.** A lock held across I/O or wider than the data it guards,
  an await that serializes work that could run in parallel, blocking work
  on a thread that must not block (a UI thread, an event loop).
- **Leaks.** Anything acquired and not released on every path - file
  handles, child processes, threads, subscriptions, listeners, caches that
  only grow.
- **Startup and size.** A new dependency, an eager import of something lazy,
  a larger binary or bundle.

## Measure

Use what the project already has, in this order: its benchmarks, its
profiling setup, its tracing; otherwise a timing of the specific operation
run several times, before and after, on the same machine, reporting the
spread and not only the best run. State in the report what was measured
and how, so the claim can be checked.

## Don't

- Optimize code that is not on a hot path because it looks slow.
- Trade readability for a gain nobody measured.
- Report "should be faster" or "no performance impact" without a number.
  Say "not measured" instead.
