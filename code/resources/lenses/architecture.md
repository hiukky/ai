# Lens: architecture

Where things live and which way they depend. The project's own architecture
docs and rules come first; these questions are for what they do not say.
Asked of a change (compare before and after) or of code as it stands.

## Ask

- **The project's own rules.** Read the layering, placement and dependency
  rules the project states (`AGENTS.md`, architecture docs, decision
  records) and check the code against each one by name. "Platform-specific
  code lives only in the platform module" is checked by searching for
  platform-specific code everywhere else, not by trusting the module name.
- **Direction.** Which way do the dependencies point? A lower layer that
  imports a higher one has the problem, whether the change introduced it or
  moved it there.
- **Boundaries.** Does anything cross a module, package or service boundary
  it did not need to? Is something reachable from outside that should be
  private?
- **One reason to change.** Does each module change for one kind of reason?
  Two unrelated reasons in one place (divergent change), or one reason
  spread across many places (shotgun surgery), are the two shapes worth
  fixing.
- **Where the knowledge sits.** Is a rule stated in exactly one place, or
  copied? Is the code that knows a detail (a vendor, a format, a path) the
  only code that knows it?
- **Hidden reach.** Does domain code reach out to the environment on its own
  - the clock, the filesystem, the process table, the network, an
  environment variable - instead of receiving what it needs from its
  caller? That is a boundary crossed inside a function, and it is usually
  why a test needed a real process or a real directory to run.
- **The rule as a test.** If the code establishes or relies on an
  architectural rule ("core never imports the CLI"), does a test or a lint
  enforce it? A rule that only lives in a doc is a rule the next change
  breaks. Checks the project already has (fitness functions, import
  linters, layering tests) stay green - never loosen one to pass.
- **The diagram.** If the project keeps architecture diagrams and the code
  moved a boundary they draw, the diagram changes with it.

## Don't

- Introduce an abstraction with one implementation and no second one in
  sight. Indirection is a cost paid on every read; it needs a reason.
- Move code to a "shared" or "utils" module because two callers use it.
  Shared by two callers in one area belongs to that area.
- Rename the architecture in the same step as moving it.
