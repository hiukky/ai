# Lens: security

Look at where trust is decided. A hole rarely announces itself: the check
usually still exists, it just runs in the wrong place, on one path but not
another, or after the value was already used. Asked of a change (compare
before and after) or of code as it stands.

## Ask

- **Order of checks.** Is every validation, authorization and sanitization
  performed *before* the value is used? Extracting a function or reordering
  calls can move a check after the use.
- **Every path.** When code is split, duplicated or given a new entry point,
  does each path still go through the check? A new public wrapper around an
  internal function is a new door.
- **Untrusted input.** Where does outside data enter - a request, a file, an
  environment variable, an argument, another repository, a model's output?
  Does any of it flow into a shell command, a query, a file path, a
  template, a deserializer, a log line?
- **Processes and paths.** Commands built as one string for a shell instead
  of an argument list; paths joined from input without normalising or
  confining them (`..`, absolute paths, symlinks); temporary files with
  predictable names; a check on a path followed by a use of it that
  another process can race.
- **Secrets.** Is a secret in a log, an error message, a debug print, a test
  fixture, a commit? Did a field that was redacted stop being redacted
  because its type changed?
- **Defaults.** Does every default fail closed (deny, refuse, error)? A new
  option whose absence means "allow" is a finding.
- **Visibility.** Is anything public, exported or reachable that does not
  need to be?
- **Resource exhaustion.** Can outside input make the code read, allocate or
  loop without a bound - an unbounded read, a size taken from the input, a
  regex on attacker-controlled text?

## Verify

If the project runs a security scanner or audit in its gate, it runs here
too. A security finding is a behavior change: it is fixed in a step of its
own with a test that shows the hole, never in passing inside another step.

## Don't

- Weaken or delete a check to make something compile or pass, even
  "temporarily".
- Mark a security question as checked because the tests are green. Tests
  pin what the code does, which includes the hole.
