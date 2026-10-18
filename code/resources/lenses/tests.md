# Lens: tests

Whether the tests would catch the code breaking. A suite exists to fail
when behavior changes and to stay green when only structure does; a test
that does neither is cost without protection, however much coverage it
adds. Asked of a change's tests or of a suite as it stands.

## Ask

- **Would it fail?** For each test, imagine the code under it broken - a
  wrong value returned, a branch inverted, the call removed. Does the test
  fail? When in doubt, break it on purpose and run it. A test that stays
  green is not testing that code, whatever its name says.
- **Behavior, through the surface.** Does it call the code the way its
  callers do and assert what they would observe? A test that reaches into
  private state, asserts call counts on internals, or must change whenever
  the code is restructured pins the implementation, not the behavior.
- **Padding.** Tests that exist for the coverage number: no assertion, or
  only "did not throw"; an assertion that restates the setup; a mock
  configured to return X and then asserted to return X; the same case
  copied with different literals and no different path; a snapshot nobody
  reads, regenerated whenever it fails.
- **What is missing.** Is the behavior the change introduced tested -
  including its error paths and edges (see `correctness.md`)? A test suite
  that only follows the happy path the author ran is the finding.
- **Doubles.** Is each mock or fake standing in for a real boundary (the
  network, the clock, another process), or for code that could simply be
  called? Mocking the thing under test, or most of its collaborators,
  leaves nothing tested.
- **Deterministic.** Does it depend on time, ordering, randomness, the
  machine it runs on, a real network or a sleep? A test that can fail
  without the code changing will be ignored, and then it protects nothing.
- **Names and place.** Does the name say the behavior and the condition
  ("rejects a path outside the root"), not the method? Does the test live
  where the project keeps tests for that code, and is a test file small
  enough to find things in?

## Don't

- Delete a weak test without putting a real one in its place when the
  behavior it pretended to cover matters.
- Add tests to raise coverage. Add them to pin behavior someone relies on.
- Loosen an assertion to make a test pass. A test that fails after a change
  that was meant to keep behavior is telling you the behavior changed.
