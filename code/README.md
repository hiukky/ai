# code

Working on code that already exists. Today that is one skill, `refactor`:
change the structure without changing what the code does, in steps small
enough that a red gate points at the one that broke it.

- `refactor` - read the project's own rules and gate, pin the behavior,
  plan with the Mikado method, move in green steps, and report in the same
  shape every time: what changed, what was decided, what is waiting for
  you, what was found and left alone

The four lenses in `resources/lenses/` (architecture, security,
performance, quality) are the questions asked of every change, once while
planning and once on the final diff. They live at the plugin level, not
inside the skill, because they are not specific to refactoring.

Language-agnostic by rule: the skill classifies the safety net the code
has (strict types, partial types, none, dispatch by name) instead of naming
a language, and uses whatever the project and machine already have for
mechanical edits.

Boundaries: behavior changes go in their own step, never in a refactoring
one. A large refactoring is planned here and, when the `openspec` plugin is
present, run unattended by its `auto` skill. Committing is the `git`
plugin's `commit`.

```bash
uze install code@ai -m   # machine-wide
uze code@ai              # this project only
```
