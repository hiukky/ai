# Driving a TUI deterministically

How a take actually performs gestures on a running terminal app, and the
failure modes each helper exists to prevent. Everything here is provided by
`scripts/driver-lib.sh`; this file explains what to reach for and why.

## The setup

`tui-record take` starts a tmux session sized to the recording, runs
`asciinema rec -c <app>` inside it, and then executes the driver with
`TUI_SESSION` pointing at that session. The driver reads the screen with
`tmux capture-pane` and writes gestures with `tmux send-keys`. asciinema
records the inner pty, so tmux's own status bar never appears in the video.

Two environment knobs a driver can set before sourcing the library:

| Variable | Meaning |
|---|---|
| `TUI_SIDEBAR_WIDTH` | Where the sidebar band ends (default 31), used by `sidebar_row_of`/`pane_row_of` |
| `TUI_TAB_PATTERN` | Regex that extracts the active tab's label from row 1 |
| `TUI_TYPE_MIN`, `TUI_TYPE_JITTER` | Typing cadence in seconds |

## Reading the screen

```bash
read -r row col < <(row_of "Manage" 1 31)   # text, within a column band
col=$(col_of '✦' 1 2)                        # 2nd occurrence on row 1
label=$(active_tab_label)                    # what the app called the tab
```

**Always band the search.** A shell prompt reading `demo-app $` sits in the
pane; a sidebar entry named `demo-app` sits in the sidebar; an unbanded
search finds whichever comes first, and clicking the pane instead of the
sidebar is a silent no-op that derails everything after it.

**Never assume a label the app generates.** Tab names, agent names and slot
ids are the app's to choose, and they depend on what else exists — a second
tab is only called "agent 2" if the first is still called "agent 1".

## Mouse

Many TUIs put real actions behind a click and offer no key for them. The
library writes SGR (1006) mouse reports straight into the pty:

```bash
press  COL ROW [BUTTON]   # 0 left, 1 middle, 2 right
click  COL ROW [LABEL]    # refuses COL=0
rclick COL ROW [LABEL]    # context menus
dclick COL ROW [LABEL]    # rename-in-place, "open" gestures
click_text TEXT [OFFSET] [MIN_COL] [MAX_COL]
```

An app that enabled mouse reporting (`\e[?1000h` and friends, which the
recorded stream shows at startup) cannot distinguish these from a hand.

Three traps, all of which produce a *plausible-looking* wrong video:

1. **`col=0` plus an offset.** "Not found" is 0, and `0 + 2` is column 2 —
   the top-left corner, which is a tab bar or a menu in most layouts. The
   click "works", the view changes, and the next beat runs on the wrong
   screen. `click` refuses a non-positive column for exactly this reason;
   any helper you add must do the same before adding an offset.
2. **Redraw between the two clicks of a double-click.** Selecting a tab
   changes the strip (bold, a prefix glyph, different widths), so the second
   click can land past the label. Select first, let the frame settle,
   re-read the column, then `dclick`.
3. **A gesture that opens an editor.** Renaming in place puts a cursor in a
   label; if it did not open, the characters you type next go to the pane —
   often to an agent's prompt box. Assert on the editor's own glyph (a
   cursor bar in the label) before typing.

## Keyboard

`k` / `key` forward to `tmux send-keys`, so tmux key names work: `k Enter`,
`k Escape`, `k C-g`, `k Down`, `k BSpace`.

**Alt chords are unreliable through tmux.** `send-keys M-i` may arrive as
`Esc` then `i`, which most apps read as two events and forward to the focused
pane. Sending the raw two-byte sequence in one write is not reliable either.
If a beat depends on an Alt chord, prefer the mouse affordance for the same
action, or verify with `require` and fall back.

Typing:

```bash
type_raw  "text"     # no Enter
type_line "text"     # Enter, after a beat
clear_field 8        # 8 backspaces, for replacing a field's contents
```

The per-character delay is jittered and the occasional space gets a longer
pause. Uniform delays read as a machine; big jitter reads as a bad
connection. The default (26-66ms) is a fast, confident typist.

## Asserting

```bash
require     "the agent opened" "Claude Code v" 20
require_row "tab renamed"      "ping" 1 6
refuse      "no approval box"  "Do you want to proceed"
```

`require` polls the whole screen until the pattern shows or the timeout
passes; on timeout it exits `3` and the runner retries the take. Use it
after every gesture whose failure would be silent — creating something,
opening a picker, submitting a prompt.

Prefer the **narrowest** proof available. `require "docs"` will happily
match `docs/lifecycle.md` in a file listing and tell you a tab was renamed
when it was not; `require_row "docs" 1` proves the tab strip.

Assert on something the app only draws in the state you want: an agent
pane's version banner, an interrupt hint that only appears while a task
runs, an editor's cursor glyph.

## Waiting

```bash
wait_span agent_edit 120 test -n "$(git -C "$dir" status --porcelain)"
```

Waits for the condition, and brackets it with marks that `tui-record
compress` uses to squeeze exactly that stretch. Keep the condition specific
to the thing you are about to show — "some worktree is dirty" is satisfied by
a different agent than the one on screen, and the beat that follows then
opens an empty diff.

If you cannot express the wait as a condition, wait on the screen instead
(`require` with a long timeout) rather than sleeping a guess.

## Ending a take

Finish by quitting the app the way a user would (its quit key). asciinema
writes the cast when the recorded command exits; a take that leaves the app
running has to be killed, and a killed asciinema writes nothing at all.

## Housekeeping while driving

- **Never `pkill -f <pattern>`.** The pattern matches the shell that is
  running the driver, and the take dies with the recording. Kill by pid,
  after confirming it through `/proc/<pid>/cmdline`.
- Reset state between attempts with `--reset`, not by hand: three takes into
  an iteration, leftovers from attempt one are what make attempt three look
  wrong.
- Watch a take while it runs with `tmux capture-pane -t tuirec -p | head -20`
  from another shell. It reads the live frame without touching the take.
