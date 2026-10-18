# code

Working on code that already exists. Two skills with opposite contracts,
sharing the same questions:

- `polish` - make code ready for review. A branch (by default), a module or
  the whole codebase goes through the six lenses with reviewers that did
  not write it; each finding is proved or rejected on evidence, and the
  confirmed ones are fixed one per green commit. It may change behavior -
  a bug found is a bug fixed, with the test that shows it. It can also
  only assess, when asked not to change anything.
- `refactor` - change the structure without changing what the code does,
  in steps small enough that a red gate points at the one that broke it.
  Planning stays with the person; a larger run is executed by a fresh
  subagent given only the plan, and the final diff goes to an independent
  reviewer.

Use `polish` when the question is "is this ready for someone else to
read?", and `refactor` when it is "I want this part to have a different
shape". A large structural finding in `polish` becomes a recommendation to
run `refactor`, never a change made in passing.

Shared resources, at plugin level because they belong to neither skill:

- `resources/lenses/` - correctness, security, architecture, performance,
  quality and tests: the questions asked of every change, so they never
  have to go into a prompt again;
- `resources/project.md` - read the project's rules, adopt its gate, run
  the baseline;
- `resources/review.md` - who reviews, the brief they get without the
  author's reasoning, and how findings are judged;
- `resources/doors.md` - the decisions an agent takes alone and the
  one-way ones it does not.

Two agents, started by the skills with a brief and never with the
conversation: `agents/reviewer.md` (judges code it did not write, edits
nothing) and `agents/refactor-executor.md` (works a planned Mikado graph,
starts no subagents). Where a harness did not install them, the skills
hand the same file to a general-purpose subagent instead.

`$PLUGIN_ROOT` in the skills is the installed plugin's directory (the one
two levels above a skill's `SKILL.md`, where the harness does not expand
it); it is resolved to an absolute path before anything is handed to a
subagent.

Language-agnostic by rule: the project's own rules and gate decide what is
wrong and what green means, and the skills use whatever the project and
machine already have.

Boundaries: committing is the `git` plugin's `commit`, opening the request
is its `pr`. A large refactoring is planned here and, when the `openspec`
plugin is present, run unattended by its `auto` skill.

```bash
uze install code@ai -m   # machine-wide
uze code@ai              # this project only
```
