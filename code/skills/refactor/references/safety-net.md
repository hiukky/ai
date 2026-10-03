# The safety net

What tells you a step broke something. Ask what *kind* of net the code has,
not which language it is written in - two codebases in one language can
have very different nets.

## Classify the net

| The code has | It catches | So steps may be |
| --- | --- | --- |
| A compiler with strict static types | every renamed, moved or re-typed symbol, at build time | larger: a rename across the repository is one step |
| Types that are optional, partial or erasable (gradual typing, `any`, casts) | only what is annotated | medium: trust the checker where it is strict, search where it is not |
| No static types | nothing until the code runs | small: every move is followed by the tests that exercise it |
| Dispatch by name: reflection, dependency injection by string, templates, serializers, routes, config keys, dynamic imports | nothing - no tool sees these | smallest: search the name as text everywhere, including config, templates, docs and other repositories you know call it |

Most real codebases are mixed: a strictly typed core with a serializer at
the edge. Classify the part you are touching.

## Tests decide the rest

Beyond the type checker, the net is the tests that actually *execute* what
you are moving. Before the first edit, find them:

- run the suite with coverage if the project has it configured, and look at
  the files you will touch;
- otherwise, break the target on purpose (return a wrong value), run the
  tests, and see which fail. None failing means nothing pins it.

## Characterization tests

When the behavior you are about to move is not pinned, pin it first
(Feathers). A characterization test records what the code **does**, not
what it should do:

1. Call the code the way its callers do.
2. Assert something you are sure is wrong (`expected = "???"`).
3. Run it; the failure tells you the real output.
4. Put the real output in the assertion. Green.

Bugs included: if the current output is wrong, the test pins the wrong
output, with a comment naming it as such. Fixing it is a separate, later,
`fix:` step that changes that test on purpose.

For output too large to assert by hand (rendered text, generated files, a
whole report), use a **golden master**: capture it to a file once, assert
equality afterwards. Whatever the project already uses for snapshot
testing wins over rolling your own.

These tests land in their own commit, green against the old code, before
the first structural step. If they only pass after the refactoring, they
did not pin anything.

## What the net cannot catch

Say these in the report rather than claiming them covered:

- performance, unless the project has benchmarks in its gate - see the
  performance lens;
- concurrency and ordering, unless a test exercises the race;
- callers outside this repository.
