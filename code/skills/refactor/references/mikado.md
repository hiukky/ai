# The Mikado method

From Ellnestam and Brolund's *The Mikado Method*. It exists for the
refactoring whose prerequisites you cannot see from the start - which is
most refactorings bigger than a rename.

## The loop

1. Write the **goal** as the root of the graph: one sentence, stated as an
   outcome ("`Store` no longer knows about HTTP"), not an activity.
2. **Try the goal directly**, naively, in the working tree.
3. Run the gate. If it is green, commit - done for this node.
4. If it is red, read what broke. Each distinct thing the attempt needed
   becomes a **prerequisite node** under the one you tried.
5. **Revert** - `git restore .` / `git checkout -- .` back to the last green
   commit. Not "fix forward": the broken attempt was a probe, and its job
   was to produce the nodes, which it did.
6. Pick a **leaf** (a node with no unfinished prerequisites) and go to 2
   with it as the target.

The revert is the part people skip, and it is the part that makes the
method work: the tree is green between every two steps, so the run can be
stopped, resumed by somebody else, or handed off at any point.

## The graph file

Plain Markdown, nested lists, checked when the node is committed:

```markdown
# Goal: Store no longer knows about HTTP

- [ ] Store no longer knows about HTTP
  - [x] Fetcher trait exists in core (a1b2c3d)
  - [ ] Store takes a Fetcher instead of a Client
    - [x] HttpFetcher wraps Client (d4e5f6a)
    - [ ] every Store::new caller passes a Fetcher
      - [ ] cli/install.rs
      - [ ] tests/support.rs

## Attempts
- "Store takes a Fetcher" tried directly: 14 callers broke - added the
  caller nodes. reverted.
```

Rules:

- **A node is an outcome that can be committed green on its own.** "Fix
  callers" is not a node; each caller is.
- **Record each failed attempt** under `## Attempts`, one line: what was
  tried, what broke. Three attempts on one node is a stop condition, and
  this list is how a cold session counts them.
- **The sha goes on the checkbox** when the node lands, so the graph and
  the history can be read against each other.
- A node discovered to be **unnecessary** is struck through with the reason,
  not deleted - the reason is what stops the next session re-adding it.

## Where the file lives

- **Local refactor**: nowhere. The graph is small enough to hold in the
  session.
- **Spread refactor**: `$(git rev-parse --git-dir)/refactor/<topic>.md`.
  That directory belongs to this checkout, survives session restarts, is
  never committed, and is removed with the worktree.
- **Aggressive refactor with OpenSpec**: in the change's `design.md`, and
  the leaves become `tasks.md` in order.

## When the graph says stop

The graph is also a measurement. If it keeps growing wider without any
leaf landing, the goal is probably two goals, or the wrong one. Ten
prerequisites deep with nothing committed is a finding worth reporting by
itself.
