# Lens: architecture

Where things live and which way they depend. The project's own architecture
docs and rules come first; these questions are for what they do not say.

## Ask

- **Direction.** Which way do the dependencies point, before and after?
  A refactoring that makes a lower layer import a higher one has moved the
  problem, not removed it.
- **Boundaries.** Did anything cross a module, package or service boundary
  that it did not cross before? Is something now reachable from outside
  that used to be private?
- **One reason to change.** After the change, does each module still change
  for one kind of reason? Two unrelated reasons in one place (divergent
  change), or one reason spread across many places (shotgun surgery), are
  the two shapes worth fixing.
- **Where the knowledge sits.** Is a rule now stated in exactly one place,
  or did the refactoring copy it? Is code that knows a detail (a vendor, a
  format, a path) still the only code that knows it?
- **The rule as a test.** If the change establishes or relies on an
  architectural rule ("core never imports the CLI"), does a test or a lint
  enforce it? A rule that only lives in a doc is a rule the next change
  breaks. Projects that already have such tests (fitness functions, import
  linters, layering checks) must keep them green - never loosen one to
  pass.
- **The diagram.** If the project keeps architecture diagrams and the
  change moved a boundary they draw, the diagram changes in the same run.

## Don't

- Introduce an abstraction with one implementation and no second one in
  sight. Indirection is a cost paid on every read; it needs a reason.
- Move code to a "shared" or "utils" module because two callers use it.
  Shared by two callers in one area belongs to that area.
- Rename the architecture in the same step as moving it.
