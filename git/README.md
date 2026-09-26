# git

Conventional Commits, and review requests named like the history they become.
No tooling: nothing here installs a hook, a linter or a changelog generator —
the convention lives in the message and the branch name, where a person and a
release tool both already read.

- `commit` — type, scope, a technical description; commit and push proactively
  once a unit of work is done and verified
- `pr` — a gitflow branch name, a Conventional Commit title, a body carrying
  only what a reviewer needs, assigned to its author at creation

A description is checkable against the diff or it is not written: one clause,
a verb describing the edit, an identifier a reviewer would grep for. No
metaphor, and no second clause welded on with `, and`.

Force-pushing, rewriting pushed history and merging your own request stay
outside the proactive default — they need the repo's convention or the user's
word, every time.

```bash
uze install git@ai -m   # machine-wide
uze git@ai              # this project only
```
