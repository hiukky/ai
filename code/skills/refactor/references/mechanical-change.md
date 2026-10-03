# Mechanical changes

A change that is the same edit in many places: a rename, a signature
change, an import path, an API replaced by another. The danger is not
difficulty, it is *coverage* - the place that was missed.

## Pick the tool by what understands the code

Use the first one available that can express the edit:

1. **The language server** - rename symbol, find references. It resolves
   scope, so it does not rename an unrelated local with the same name.
   Best for one symbol.
2. **A structural rewriter** - `ast-grep` (tree-sitter, many languages) or
   `comby` (pattern-based, no grammar needed). Best for a *shape*: every
   `foo(a, b)` becoming `foo(Options { a, b })`.
3. **The project's own codemod tooling**, if it has one - it wins over the
   two above, it already knows the project's quirks.
4. **Search, then edit by hand** - `git grep -n` (or `rg`) for every
   spelling, then edit. Last resort, never skipped as a cross-check.

Check what is installed rather than assuming; installing a tool for one
refactoring is a two-way door, but say so in the report.

Whatever performed the edit, **finish with a text search for the old name**
across the whole repository, including what no tool parses: config files,
templates, docs, scripts, CI, fixtures, string literals. The structural
tool tells you what it changed; the search tells you what it missed.

## Large changes go in batches

When an edit touches many files (Google's *Large-Scale Changes*):

- split it by **ownership boundary** - a package, a crate, a directory a
  team owns - so each batch can be reviewed and reverted on its own;
- each batch is green on its own and is its own commit;
- the transformation is a script or a pattern, so batch N+1 is the same
  edit as batch N, not a hand-written variation of it. Keep that pattern in
  the commit body of the first batch.

## Expand, migrate, contract

Any change to something with callers you do not edit in the same step - an
interface, a schema, a file format, a function used across modules - goes
in three phases, each green on its own (also called *parallel change*):

1. **Expand** - add the new shape beside the old one. Old callers untouched,
   still green.
2. **Migrate** - move callers to the new shape, in batches. Both shapes work
   the whole time.
3. **Contract** - once nothing uses the old shape (prove it with the search
   above), delete it.

For something persisted - on disk, in a database, on the wire - the old
shape keeps existing in data written before the change. Contract is then a
one-way door: removing the reader for the old shape is deciding that no
such data survives. Follow the project's own migration rule if it has one;
if it does not, that is a decision for the plan, not the run.

## Branch by abstraction

For replacing an implementation that is too big to swap in one step: put an
abstraction in front of the old implementation (callers now go through it -
green), build the new implementation behind the same abstraction, switch
callers or a flag over to it, then delete the old one. The *strangler fig*
is the same idea at the scale of a system: route around the old one piece
by piece until nothing reaches it.
