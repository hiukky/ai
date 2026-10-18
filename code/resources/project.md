# Read the project first

Before planning or judging anything, find out what this project already
decided. Its docs win over any skill in this plugin wherever they disagree.

- **The rules** - `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING`, the architecture
  docs and decision records they point at. Layering rules, placement rules
  ("platform code lives in one module"), dependency policy, naming
  conventions and "never do X" lists live there. Write down the ones that
  apply to the code at hand: they are checked by name later, not
  remembered.
- **The gate** - what actually blocks a merge. Read CI first
  (`.github/workflows`, `.gitlab-ci.yml`, whatever exists), then the task
  runner it calls (Makefile, justfile, `package.json` scripts, `pyproject`,
  `Cargo.toml`, `go.mod`...). Write down the exact commands: build, tests,
  lint, type check, and the platforms CI runs them on. That list *is*
  "green" for this run - say which one you adopted in the report. A gate
  step that cannot run on this machine is named in the report as not run,
  never silently dropped.
- **The baseline** - run the gate once before the first edit. A step that is
  already red is not yours to explain later; record it, and do not count
  it against your own steps.

A project with no runnable gate is not a reason to stop. The first task is
building one: the tests that pin the behavior you are about to touch.
