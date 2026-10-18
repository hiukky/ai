# Independent review

A review by the agent that wrote the code is the weakest review there is:
it already knows why every line is right. So the lenses are put to the code
by a reviewer that has not seen the reasoning behind it - only the code,
the project's rules and the questions.

## Who reviews

When the harness can start subagents, the review runs in fresh ones, each
given the brief below and nothing from the conversation. Group the six
lenses by what they need to read, up to three reviewers in parallel:

| Reviewer | Lenses |
| --- | --- |
| trust | `correctness`, `security` |
| shape | `architecture`, `performance` |
| craft | `quality`, `tests` |

Fewer reviewers when the person set a smaller budget or the scope is small
(one reviewer with all six lenses for a diff of a few files); a lens the
person asked to emphasise ("principally performance") may get a reviewer of
its own. A reviewer may be given a stronger or cheaper model only when the
person asked for it.

When the harness cannot start subagents, run the review in the same
session, one lens at a time, and say so in the report: "review not
independent". The brief still applies - re-read the code from the diff, not
from memory of writing it.

## The brief

Hand each reviewer exactly this, filled in, and no summary of how the code
came to be:

```markdown
You are reviewing code you did not write. Judge it only through the
lenses below. Do not edit anything.

Scope: <the exact diff command, e.g. `git diff <merge-base>...HEAD`, or the
paths to read>
Repository: <path>
Project rules that apply: <the list written down while reading the project,
with the file each comes from>
Gate: <the commands, and their result on the baseline>
Lenses: <$PLUGIN_ROOT/resources/lenses/<lens>.md for each - read them first>
Emphasis: <what the person asked to weigh most, or "none">

Return every finding in this shape, most severe first, and nothing else:

- id: <lens>-<n>
  where: <file>:<line>
  claim: <one sentence: what is wrong>
  scenario: <the input, state or sequence that shows it - for a suspicion
    with no scenario, say "suspected" and what would confirm it>
  severity: <breaks something | risk | cost | taste>
  kind: <behavior | structure>

Read the surrounding code, callers and tests as needed; a finding about a
line you did not read in context is not a finding. An empty list is a
valid answer.
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

A finding of severity `taste` is not acted on unless the project's rules
make it a rule.
