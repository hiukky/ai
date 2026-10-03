# Lens: performance

No number, no claim. A refactoring may say it improved performance only if
something was measured before and after; otherwise it says nothing about
performance, which is fine.

## Ask

- **Hot paths.** Does the change touch code that runs per request, per item,
  per frame, per keystroke, at startup? Find out from a profile, a
  benchmark or the project's own docs - not from intuition.
- **Complexity.** Did a loop gain an inner lookup, a linear scan replace an
  index, a recursion lose its memo? Extracting a function inside a loop is
  free; extracting one that re-reads a file is not.
- **I/O.** Did a call that was batched become one per item? Did a read move
  inside a loop, or from startup to every call? Did something cached stop
  being cached because its owner changed?
- **Allocation and copying.** New clones, conversions, intermediate
  collections, or a value passed by copy that was passed by reference.
- **Concurrency.** Did a lock widen, an await serialize what ran in
  parallel, work move onto a thread that must not block (a UI thread, an
  event loop)?
- **Startup and size.** A new dependency, an eager import of something lazy,
  a larger binary or bundle.

## Measure

Use what the project already has, in this order: its benchmarks, its
profiling setup, its tracing; otherwise a timing of the specific operation
run several times, before and after, on the same machine, reporting the
spread and not only the best run. State in the report what was measured
and how, so the claim can be checked.

A regression found this way in a refactoring is a stop-and-fix inside the
run: a refactoring was supposed to change nothing, and slower is a change.

## Don't

- Optimize in a refactoring step. Making it fast is a behavior change of
  its own, with its own measurement, in its own commit.
- Report "should be faster" or "no performance impact" without a number.
  Say "not measured" instead.
