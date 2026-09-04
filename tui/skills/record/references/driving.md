# Driving a TUI deterministically

How the interpreter performs a beat on a running terminal app, and the
failure modes each rule prevents. The keys are in `spec.md`; this is why they
are shaped the way they are — and what to reach for when a selector will not land.

## The setup

`tui-record run` starts a tmux session sized to the recording and runs
`asciinema rec -c <the app>` inside it. Beats read the screen with `tmux
capture-pane` and write gestures with `tmux send-keys`. asciinema records the
inner pty, so tmux's own status bar never appears in the video.

`probe` is the same session without the recording — the way to try a selector
before spending a take on it:

```
tui-record probe .                    # start
tui-record probe . --screen           # the frame, as text
tui-record probe . --find 'Manage'    # where that selector lands, per band
tui-record probe . --stop
```

## Reading the screen

```yaml
click: Manage
in: sidebar        # screen | sidebar | pane | strip
occurrence: last   # first (default) | last | a number
offset: 2          # columns from the hit
```

**Always band the search.** A shell prompt reading `demo-app $` sits in the
pane; a sidebar entry named `demo-app` sits in the sidebar; an unbanded
search finds whichever comes first, and clicking the pane instead of the
sidebar is a silent no-op that derails everything after it.

**Never assume a label the app generates.** Tab names, item names and
generated ids are the app's to choose, and they depend on what else exists —
a second tab is only called "tab 2" if the first is still called "tab 1".

## Mouse

Many TUIs put real actions behind a click and offer no key for them. A beat's
`click`, `dclick` and `rclick` write SGR (1006) mouse reports straight into
the pty.

An app that enabled mouse reporting (`\e[?1000h` and friends, which the
recorded stream shows at startup) cannot distinguish these from a hand.

**The affordance you want is often the last one, not the first.** A tab whose
label carries the same glyph as a toolbar button means `occurrence: first`
finds the tab and `occurrence: last` finds the button. Some targets are a
single cell with no label at all — a status mark, a badge — which is what
`glyph:` is for.

**And some glyphs are not affordances at all.** A separator between a tab
strip and its buttons looks exactly like a button; clicking it does nothing,
forever. When a click will not land anywhere near a glyph, check the app's
own hit-testing before adding retries: the real target may be a badge
somewhere else, or there may be a keyboard path (`key: C-g`) that is both
reliable and more honest about how the feature is used.

Three traps, all of which produce a *plausible-looking* wrong video:

1. **A miss plus an offset.** "Not found" is column 0, and `0 + 2` is column
   2 — the top-left corner, which is a tab bar or a menu in most layouts. The
   click "works", the view changes, and the next beat runs on the wrong
   screen. The interpreter ends the take instead; anything you write by hand
   must refuse a non-positive column before offsetting it.
2. **Redraw between the two clicks of a double-click.** Selecting a tab
   changes the strip (bold, a prefix glyph, different widths), so a second
   click at the first click's column lands past the label. `dclick` selects,
   lets the frame settle, re-reads the column, and only then double-clicks.
3. **A gesture that opens an editor.** Renaming in place puts a cursor in a
   label; if it did not open, the characters you type next go to the pane —
   often to an input box in the pane. Assert on the editor's own glyph (a
   cursor bar in the label) before typing.

## Keyboard

`key` takes a tmux key name, or a list of them: `Enter`, `Escape`, `C-g`,
`Down`, `BSpace`.

**Alt chords are unreliable through tmux.** `send-keys M-i` may arrive as
`Esc` then `i`, which most apps read as two events and forward to the focused
pane. Sending the raw two-byte sequence in one write is not reliable either.
If a beat depends on an Alt chord, prefer the mouse affordance for the same
action, or verify with `require` and fall back.

Typing is `type:`, with `submit: false` to leave the line unsent and
`clear: N` (or `clear: all`) to empty a field first — a label the app
generated has a length nobody can know in advance.

The per-character delay is jittered and the occasional space gets a longer
pause. Uniform delays read as a machine; big jitter reads as a bad
connection. The default (26-66ms) is a fast, confident typist.

## Asserting

```yaml
expect: ready to edit      # a regex the screen must show
expect_in: strip           # where to look for it
expect_timeout: 20
refuse: Do you want to proceed
```

`expect` polls until the pattern shows or the timeout passes; on timeout the
take is spoiled and the runner resets and repeats. Use one after every
gesture whose failure would be silent — creating something, opening a picker,
submitting a prompt.

Prefer the **narrowest** proof available. `expect: docs` will happily match
`docs/lifecycle.md` in a file listing and report a tab renamed when it was
not; `expect_in: strip` proves the tab strip.

Assert on something the app only draws in the state you want: a pane's
version banner, an interrupt hint that only appears while work is running,
an editor's cursor glyph.

**A readiness proof belongs to the thing being opened.** If the take starts
more than one kind of tool inside the app — two editors, two vendor CLIs —
each has its own first screen and its own "working" hint, so each beat needs
its own `expect` rather than a copy of the one that worked first.

**Typing can trigger the app's own popup.** A `/` inside a prompt opens a
command palette in several TUIs, and the `Enter` that was meant to submit
then picks a menu item instead — the text just sits there. Either keep the
trigger character out of what you type, or dismiss the popup (`k Escape`)
before submitting, and assert that the submission actually happened.

## Waiting

```bash
wait: shell
until: test -s /tmp/demos/project/out/report.json
```

Waits for the condition, and brackets it with marks that `tui-record
compress` uses to squeeze exactly that stretch. Keep the condition specific
to the thing you are about to show — "some file changed somewhere" is
satisfied by a part of the app the viewer is not looking at, and the beat
that follows then opens an empty panel.

If you cannot express it as a shell condition, wait on the screen instead
(`wait: screen`) rather than sleeping a guess.

## Ending a take

The `end` beat quits the app the way a user would (`end: C-q`). asciinema
writes the cast when the recorded command exits; a take that leaves the app
running has to be killed, and a killed asciinema writes nothing at all.

It also marks where the video stops, which is what keeps the app's own exit
out of it. That exit is the write that blanks the screen, and a blank last
frame shows at both ends of a looping GIF.

## Housekeeping while driving

- **Never `pkill -f <pattern>`** in a `reset` command. The pattern matches
  the shell running it, and the take dies with the recording. Kill by pid,
  after confirming it through `/proc/<pid>/cmdline`.
- Put state cleanup in the spec's `reset`/`clear`, not in your hands: three
  takes into an iteration, leftovers from the first are what make the third
  look wrong.
- Watch a take while it runs with `tmux capture-pane -t tuirec -p | head -20`
  from another shell. It reads the live frame without touching the take.
