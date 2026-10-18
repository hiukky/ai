# Independent review

A review by the agent that wrote the code is the weakest review there is:
it already knows why every line is right. So the lenses are put to the code
by a reviewer that has not seen the reasoning behind it - only the code,
the project's rules and the questions.

## Who reviews

The reviewer is the `reviewer` agent this plugin ships
(`$PLUGIN_ROOT/agents/reviewer.md`): its fixed instructions and the shape
of its findings live there, and the skill hands it only the brief below.
In order of preference:

1. **The plugin's `reviewer` agent**, where the harness installed it.
2. **A fresh general-purpose subagent**, where the harness can start
   subagents but the plugin's agent is not available: hand it the body of
   `agents/reviewer.md` followed by the brief.
3. **This session**, where the harness cannot start subagents: one lens at
   a time, re-reading the code from the diff, not from memory of writing
   it. The report then says "review not independent".

Group the six lenses by what they need to read, up to three reviewers in
parallel:

| Reviewer | Lenses |
| --- | --- |
| trust | `correctness`, `security` |
| shape | `architecture`, `performance` |
| craft | `quality`, `tests` |

- **Budget.** A budget the person sets ("up to three subagents") counts
  reviewers per round. Fewer when the scope is small - one reviewer with
  all six lenses for a diff of a few files. A lens the person asked to
  emphasise may get a reviewer of its own, inside the budget. The review
  of a run's own fixes is one more reviewer, after the round.
- **A whole codebase** is too much for one reviewer to read. Split it by
  area - a package, a crate, a top-level directory - with all six lenses
  per area, up to the budget at a time.
- **A model** is chosen for reviewers only when the person asked for one.
- **Hands off.** While reviewers read, nobody edits the tree: the scope is
  a command they run, and an edit mid-review changes what they see.

## The brief

`$PLUGIN_ROOT` is the installed plugin's directory - where the harness
does not expand it, the directory two levels above the running skill's
`SKILL.md`. Resolve it, and every other placeholder, to absolute paths
before handing anything over - a subagent cannot resolve them. Hand each reviewer this, filled in, and no
summary of how the code came to be:

```markdown
Scope: <the exact command, e.g. `git diff <merge-base>` for a branch with
its uncommitted work, `git diff <first>^..<last>` for a run's own commits,
or the paths to read>
Repository: <absolute path>
Claim: <behavior preserved | behavior may change>
Project rules: <each rule that applies, with the file it comes from>
Gate: <the commands, and their result on the baseline>
Lenses: <absolute path of each lens file this reviewer judges through>
Emphasis: <what the person asked to weigh most, or "none">
```

## Judging the findings

The findings come back to the agent that runs the skill, which judges each
one, and the judgement is evidence, never preference:

- **confirmed** - the scenario holds: reproduced, shown by a failing test,
  or plain from the code read in context;
- **rejected** - the scenario does not hold, with the reason in one line
  (the check exists at `file:line`, the input cannot reach here because...).
  "It is fine" is not a reason. Every rejection is listed in the report, so
  the person sees what the author dismissed;
- **unproven** - plausible, but no scenario could be built; reported as a
  suspicion, never fixed.

A confirmed finding of severity `taste` is not acted on unless the
project's rules make it a rule; it goes in the report under found, out of
scope.
