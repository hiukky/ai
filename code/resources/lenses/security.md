# Lens: security

A refactoring changes no behavior, which is exactly why it can open a hole
nobody looks for: the check still exists, it just runs in the wrong place
now. Look at where trust is decided, before and after.

## Ask

- **Order of checks.** Is every validation, authorization and sanitization
  still performed *before* the value is used? Extracting a function or
  reordering calls can move a check after the use, or onto one path but not
  another.
- **Every path.** When code is split, duplicated or given a new entry point,
  does each path still go through the check? A new public wrapper around an
  internal function is a new door.
- **Untrusted input.** Where does outside data enter - a request, a file, an
  environment variable, an argument, another repository, a model's output?
  Did any of it start flowing somewhere it did not reach before: a shell
  command, a query, a file path, a template, a deserializer, a log line?
- **Processes and paths.** Commands built as one string for a shell instead
  of an argument list; paths joined from input without normalising or
  confining them; temporary files with predictable names.
- **Secrets.** Did a secret move into a log, an error message, a debug
  print, a test fixture, a commit? Did a field that was redacted stop being
  redacted because its type changed?
- **Defaults.** Does a changed default fail closed (deny, refuse, error) the
  way the old one did?
- **Visibility.** Did anything become public, exported or reachable that was
  private before?

## Verify

If the project runs a security scanner or audit in its gate, it runs here
too. If it doesn't, a security finding is reported, not fixed in passing -
fixing it changes behavior, so it is a separate `fix:` step.

## Don't

- Weaken or delete a check to make a refactoring compile, even
  "temporarily".
- Mark a security question as checked because the tests are green. Tests
  pin what the code does, which includes the hole.
