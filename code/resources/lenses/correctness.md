# Lens: correctness

Whether the code does what it claims, on every input and every path - not
only the one the author ran. The bugs worth finding here are the ones the
tests did not, so a green gate answers none of these questions. Asked of a
change or of code as it stands.

## Ask

- **The contract.** What does the function, command or endpoint promise -
  its name, its docs, its types, the spec or issue it implements? Does the
  code keep that promise, or a narrower one?
- **Edges.** Empty, one, many, the maximum; zero and negative; missing,
  null, duplicated; the first and the last iteration; Unicode, whitespace
  and case where text is compared; time zones and clock changes where time
  is.
- **Error paths.** What happens when each fallible call fails - the read,
  the parse, the spawn, the network call? Is the failure reported, retried
  or swallowed? Is state left half-written: a file truncated, a lock or
  temporary file left behind, a record updated without its index?
- **State and order.** Can two callers, threads, processes or retries
  interleave here? Is there a check-then-act that another actor can race,
  a value read twice that can change between reads, an operation that is
  not idempotent but can run twice?
- **Resources.** Is everything acquired released on every path, including
  the error ones and early returns?
- **Platforms.** Every platform the project says it supports: path
  separators and case sensitivity, line endings, shell and process
  semantics, file locking, permissions, encodings. Code that only works on
  the author's machine is a finding even if CI runs on one platform.
- **Assumptions.** Every `unwrap`, assert, cast, index and "this cannot
  happen" is a claim. Is it proved by the types or the code above it, or
  only by the inputs the author tried?

## Prove it

A correctness finding is not a finding until it has a concrete scenario:
this input, in this state, produces this wrong result or this crash. When
it can be shown by a test, the test comes first and fails, then the fix
makes it pass - the test is the evidence and stays as the regression guard.
A suspicion with no scenario goes in the report as one, never as a fix.

## Don't

- Fix a bug in the same step as anything else. A bug fix is a behavior
  change, with its own test and its own commit.
- Call a path correct because it is covered. Coverage says the line ran,
  not that its result was checked.
