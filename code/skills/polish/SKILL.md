---
name: polish
description: Make code ready for review - put a branch, a module or a whole codebase through six lenses (correctness, security, architecture, performance, quality, tests) with reviewers that did not write it, prove each finding, and fix the confirmed ones in small verified steps. Use before opening a merge or pull request, after finishing an implementation, when asked to review an implementation and fix what turns up, or to hunt hidden bugs, dead code, workarounds, performance or security problems and tests that only pad coverage - "analisa a implementação", "revisa essa branch", "vê se tem gambiarra", "pente fino", "limpa essa parte", "seja chato". Also assesses without changing anything, when asked to. The project's own rules and gate decide what is wrong and what green means. Not for a deliberate restructuring with a goal of its own (that is `refactor`), not for writing the feature, and not for committing or opening the request (the `git` plugin's `commit` and `pr`).
compatibility: >-
  A git repository, any language. Runs its reviewers as subagents where the
  harness can start them, and in the same session, saying so, where it
  cannot.
---

# Polish

Polish raises code to the bar it should meet before someone else reads it.
It may change behavior - a bug found is a bug fixed - so it keeps two
other promises instead:

1. **Nothing is fixed without proof** - every finding has a concrete
   scenario, and a behavior fix lands with the test that shows it.
2. **Every step is small enough to undo** - one finding, one green gate,
   one commit. The sha is the undo.

The author of the code is the worst judge of it, so the finding is done by
reviewers that never saw how the code came to be, and the agent running
this skill judges what they found on evidence.

## Scope, mode and emphasis

Read them from the request before anything else:

- **Scope.** Default: the current branch against its base - the diff from
  `git merge-base HEAD <default branch>` (find the default branch from the
  remote's HEAD, not by assuming its name) to the working tree, uncommitted
  work included. Otherwise the paths named, or the whole codebase when the
  person asks for a sweep ("pente fino", "o projeto todo").
- **Mode.** Default: **apply** - fix what is confirmed. **Assess** when the
  person asks only for a review or an opinion ("só avalia", "não mexe",
  "o que você acha"): everything up to judging, then the report, no edits.
- **Emphasis and budget.** "Be picky", "mostly performance", "focus on the
  tests", "up to three subagents", a model to use - each changes the review
  below, never the promises above.

On a branch, a finding in code the branch did not touch is in scope only
if the branch makes it worse or depends on it. The rest goes in the
report as found, out of scope.

## The process

1. **Read the project** - rules, gate, baseline:
   `$PLUGIN_ROOT/resources/project.md`.
2. **Review independently** - `$PLUGIN_ROOT/resources/review.md`: who
   reviews, the brief they get, the findings they return. The lenses are
   in `$PLUGIN_ROOT/resources/lenses/`.
3. **Judge** every finding as confirmed, rejected or unproven, on evidence
   (same file). In **assess** mode, go to the report.
4. **Sort the confirmed ones:**

   | Finding | Becomes |
   | --- | --- |
   | behavior: a bug, a hole, a leak, a wrong result | a test that fails, then the fix that makes it pass - one `fix:` commit |
   | weak or missing tests | the real test, replacing the padding - one `test:` commit |
   | structure, local: a name, an extraction, dead code, a workaround with a cause you can fix in one module | one step with `refactor`'s discipline - `refactor:` commit, behavior untouched |
   | structure, larger: crosses modules or a boundary, or needs a plan | not done here - a recommendation in the report to run `refactor` on it |
   | a one-way door | not taken - pending, with your recommendation (`$PLUGIN_ROOT/resources/doors.md`) |
   | measured performance problem | a fix with the before and after numbers in the commit body - `perf:` commit |

   Order the work so a fix never lands on top of code that is about to
   move: behavior fixes first, then tests, then structure.
5. **Apply in steps** - one finding, the gate, a commit through the `git`
   plugin's `commit` (or the project's own convention). A step that goes
   red is fixed or reverted before the next one starts; three failed
   attempts at the same finding, and it moves to the report as pending
   with what was tried.
6. **Review the fixes** - once, with a fresh reviewer, on the diff of this
   run's own commits only, with the same brief. A finding there is judged
   and fixed like any other; there is no third round - what is left goes
   in the report.
7. **Report** - see the end of this file. If the scope was a branch, the
   next step is the `git` plugin's `pr`.

## When to stop - a closed list

Stop and hand back **only** when:

1. The baseline gate is red in a way that makes every step unverifiable -
   say which step is red and why it blocks the rest.
2. A destructive action outside the scope is needed - deleting what the
   scope never named, rewriting pushed history.
3. A credential is needed, or a secret turns up in the working tree.

Not reasons to stop: a finding that failed three times (it goes to the
report), a one-way door (pending), a large structural finding (a
recommendation), a question the codebase answers, finishing a step.

## Report

```markdown
## Polish: <scope>

**Mode**: <apply | assess> - **Emphasis**: <what was asked, or none>
**Gate**: <the exact commands adopted> - baseline <green | red, which> -
final <green | red, with output>
**Review**: <reviewers and their lenses | not independent, and why>

### Fixed
- <finding id> - <claim> - <sha>

### Rejected
- <finding id> - <claim> - <why the scenario does not hold>

### Suspected, unproven
- <finding id> - <claim> - <what would confirm it>

### Pending your call
- <one-way door, or finding that failed three attempts> - <recommendation>

### Recommended refactors
- <the structural finding> - <what `refactor` should make easy>

### Found, out of scope
- <finding> - <where>

### Stopped because   (only if it did)
- <condition from the closed list> - <evidence>
```

In **assess** mode, *Fixed* becomes *Confirmed*, without shas. An empty
section is written as `none`, not left out.
