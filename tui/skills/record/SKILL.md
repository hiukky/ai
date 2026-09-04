---
name: record
description: Record a terminal UI as a demo video worth publishing - an asciinema cast driven by a scripted, verified take, then cut and rendered to a GIF. Use whenever someone asks to record, film, capture or demo a TUI or CLI; to produce a README hero, a docs landing animation, a release-notes clip or a bug repro; or to redo a recording that is too long, too slow, robotic, visually off, or that leaked personal data. Also use when a recording driver misclicks, a beat silently does nothing, a long-running operation inside the app makes the video wait, or a rendered GIF comes out blank, padded in the wrong colour, or too heavy to embed. Not for editing existing video files, screen-recording a GUI, or writing docs prose to accompany a demo.
compatibility: bash, tmux, asciinema (2.x or 3.x) and python3 for recording and cutting; agg for GIF rendering; ffmpeg optional, for inspecting frames and for mp4.
---

# Record a TUI

A demo video is a **take**, not a screen capture. Someone scripts it, a
machine performs it the same way every time, and every gesture is checked
before the next one runs. That is the difference between a recording that
sells a tool and one that shows an app being poked at.

Everything here is built around three claims:

- **The subject is a sandbox.** A terminal shows the operator's home
  directory, prompt, hostname, repository, branches and open work. A demo
  is published; none of that should be.
- **Nothing addresses the screen by a coordinate typed in advance.** Tab
  strips shift, sidebars grow, labels are named by the app. Read the frame
  that is on screen right now.
- **A beat that silently did nothing spoils the take.** The next beat types
  into whatever has focus and the video ends up looking like the app
  misbehaving. Verify each gesture; abort and retry rather than ship it.

## The pipeline

`scripts/tui-record` is one stage per subcommand, each reading the previous
stage's file, so a take can be re-cut and re-rendered without recording
again.

| Stage | Command | Keep |
|---|---|---|
| Check tools | `tui-record doctor` | — |
| Perform the take | `tui-record take --driver D --out demo.cast -- <app>` | `demo.raw.cast` (the negative) |
| Prove it is safe | `tui-record check demo.cast` | — |
| Redact what is left | `tui-record redact demo.cast --pattern '<regex>'` | — |
| Cut the waiting | `tui-record compress demo.cast --span 1.5` | — |
| Render | `tui-record render demo.cast demo.gif --bg <app bg>` | `demo.gif` |

`scripts/driver-lib.sh` is what a driver sources: screen reads, mouse and
keyboard gestures, typing with human cadence, per-beat assertions, and the
marks that tell `compress` which stretches were only waiting.

## 1. Decide the cut before recording

Length is a function of where it will live. Pick one and hold it — a hero
that runs two minutes is not a long hero, it is an unwatched one.

| Destination | Length | Shape |
|---|---|---|
| README hero, docs landing | 20-40s | One arc, no dead time, loops cleanly |
| README "how it works" | 30-60s | Three or four beats, each legible |
| Docs walkthrough | 1-3 min | Chapters; consider several short clips instead |
| Bug repro | as short as the bug | No polish; the raw cast is often enough |

Then size the terminal. GitHub scales an embedded image to roughly 900px
wide, so **fewer columns means bigger text**: 140x36 reads well in a README,
160x40 is for a walkthrough where layout matters more than legibility. Check
that the app's layout does not truncate at your chosen width before
recording a full take.

Write the beat list before writing any script, in the order a viewer should
understand the tool — usually: the thing exists → the user does one real
thing with it → the result appears → one screen that shows breadth. Every
beat you cannot state a reason for is a beat to cut.

## 2. Record a sandbox, never your own machine

Build a throwaway environment and record that. The checklist, in the order
these actually leak:

- **A `HOME` of its own**, exported through `env -i` along with an explicit
  `PATH`, `TERM`, `SHELL` and `LANG`. Nothing inherited: `env -i` is what
  keeps the operator's variables — and those of whatever launched the
  recording — out of the take.
- **A runtime dir of its own** (`XDG_RUNTIME_DIR`) so the app's sockets
  don't collide with the operator's own running instance — and keep the
  path short: a UNIX socket path over ~100 bytes fails with
  `path must be shorter than SUN_LEN`, which a deep scratch directory
  exceeds easily.
- **Fake projects in a dedicated parent directory.** Not `/tmp` itself: any
  file picker that lists the parent will show every other tenant of `/tmp`,
  including paths containing the operator's username. `/tmp/demos/<project>`
  lists only what you put there.
- **A prompt with no identity in it.** Point `SHELL` at a wrapper that execs
  `bash --norc --noprofile` with your own `PS1` exported; otherwise the
  prompt prints `user@host`.
- **A git identity for the demo** (`~/.gitconfig` in the sandbox home).
  Otherwise commits are authored by the operator, or tools complain that no
  identity is set — on camera.
- **Seed a believable history.** A repo with five commits, a couple of
  dirty files and a real `README` reads as a project; an empty repo reads as
  a test fixture. Backdate with `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`, and
  keep every date in the past — "in the future" in a timeline is a tell.
- **Silence first-run noise.** Onboarding wizards, tips, update banners and
  trust prompts are all state in the sandbox home; set them as already-seen
  before the take rather than clicking through them on camera.
- **Grant permissions with an allowlist, not a bypass mode.** A tool's
  "skip all prompts" mode usually opens a consent screen of its own, which
  is then the first thing in your video; an explicit allow list gets the
  same silence with nothing to click.

If the app under test drives another tool that needs credentials (a cloud
CLI, a database client, an AI harness), decide deliberately: either the demo runs
unauthenticated and shows a login screen, or the operator grants access on
purpose. **Never copy a credential file into a sandbox on your own
initiative** — ask, and prefer a symlink to the real one (nothing is
duplicated, and removing the link ends the grant) over a copy that outlives
the recording.

## 3. Write the take as a driver

A driver is a bash script that sources `driver-lib.sh` and calls one
function per gesture. `tui-record take` runs it against the recorded pty.

```bash
#!/usr/bin/env bash
source /path/to/tui/skills/record/scripts/driver-lib.sh   # absolute path

begin 1.0                                   # marks where startup ends

type_line "git log --oneline -5"; p 2.0     # human cadence, then Enter

click_text "+ new" 2 1 31                   # sidebar band: cols 1..31
require "the picker opened" "at /tmp" 6

new_tab=$(active_tab_label)                 # never assume the app's label
```

The vocabulary is in `references/driving.md`, which also covers driving a
**mouse-driven** TUI: many terminal apps put real actions behind clicks, and
`press`/`click`/`dclick` write SGR mouse events straight into the pty, which
the app cannot tell from a hand. Reach for the mouse when the app does — a
keyboard-only take of a pointer-driven app is what makes a video look
robotic.

Rules that earn their place:

- **Read coordinates from the current frame, and re-read them after
  anything that redraws.** Selecting a tab changes the strip's widths, so a
  double-click that reads the column once lands on nothing.
- **A column of 0 means "not found".** Adding an offset to it clicks column
  2 — the top-left corner, which in most TUIs is a different screen. The
  library refuses instead; keep it that way in your own helpers.
- **Ask the app what things are called.** A second tab is not necessarily
  "tab 2" — the label depends on what the other tabs are named.
  `active_tab_label` reads it.
- **Verify in the right region.** `require` scans the whole screen, which
  will happily match a filename in a file list; `require_row` scans one row.
  A tab rename is only proven by the tab strip.

## 4. Run it, and let it fail loudly

```
tui-record take --driver ./drive.sh --out demo.cast \
  --cols 140 --rows 36 --title "demo" \
  --reset "./reset.sh" -- ./launch.sh
```

`--reset` runs before every attempt: put the sandbox back to the state the
take assumes: delete what the previous attempt created, restore the fixture
data, clear the app's own state. A take that starts from the previous take's leftovers records a
different video than the one you scripted.

A driver that loses a beat exits `3`; `take` reports it and runs the whole
thing again. Some apps also lose their terminal during startup for reasons
that have nothing to do with the take — the retry loop absorbs that too.

## 5. Cut the waiting, not the events

Real software takes real time: a build runs, an index rebuilds, a request
flies, a model answers. Wrap exactly those stretches in `wait_span`, which polls a shell
condition and brackets it with marks:

```bash
wait_span build 120 test -f "$fixture/dist/app.js"
```

`tui-record compress` then rescales those spans to `--span` seconds and
collapses everything before the first beat, so the video opens on the app
already running.

A GIF loops, so a blank final frame reads as a pause at *both* ends: the
cut also drops the app's exit — the write that blanks the screen — so the
last frame is the last thing worth looking at.

**Compression rescales timestamps; it never drops events before the end.** The startup
frames carry the terminal's first full paint — drop them and the player
draws the rest of the take onto a blank screen, which looks exactly like a
broken sidebar that renders nowhere else. If a rendered GIF is missing
panels the live app clearly draws, this is the cause.

Prefer real time where a viewer is learning something (typing, a menu
opening, a diff appearing) and compress only latency. A global `--speed`
above ~1.5 at render time starts to read as a fast-forward rather than a
person.

## 6. Render to match the app

```
tui-record render demo.cast demo.gif --bg 0a0c0d --speed 1.3 --font-size 14
```

`--bg` must be the colour the app actually paints, not a theme you like:
the renderer paints the frame's padding in the theme background, so a
mismatch shows up as a border in a colour the app never uses. Take it from
the app's own palette constant, and verify from the output rather than by
eye:

```
ffmpeg -i demo.gif -vf "select=eq(n\,40)" -vsync 0 frame.png   # then look at it
```

Weight matters where it is embedded: a 30-40s GIF at 140x36 lands around
500KB-1MB, which is fine for a README. If it does not, cut beats before
cutting quality. For a docs site, an mp4 (via ffmpeg) or the asciinema
player embedding the `.cast` both beat a heavier GIF — and the `.cast` keeps
the text selectable.

## 7. Prove it is publishable

`tui-record check` is not advisory. Run it on the final cast, before
handing anything over:

```
tui-record check demo.cast --forbid 'internal\.example\.com'
```

It reports size and duration and scans for the operator's username, home
path and hostname, session URLs, `sk-` style tokens, bearer headers, private
keys and private IPs. Anything it finds gets redacted with same-length
replacements (`tui-record redact`), so nothing on screen reflows — a
redaction that shortens a string moves every glyph after it on that row.

Tell the person what remains visible that a scanner cannot judge: a plan
name, a version number, a model name, a workspace title. Those are theirs to
decide, but only if they are told.

## What it costs

Measured, so a plan can be made against it rather than a guess:

| Stage | Time |
|---|---|
| One successful take | the take's own length + ~12s (settle, then asciinema closing the file) |
| A lost beat | that attempt's time again — the runner resets and repeats |
| `compress`, `check` | well under a second each |
| `render` | ~16s for a 45s cast at 152 columns |
| Re-cut and re-render from the raw cast | ~20s, no recording |

What dominates is the app's own latency inside the video (an operation that
takes two minutes is two minutes of wall clock even when `wait_span` keeps
it out of the cut), and then lost beats. Writing and debugging a driver for an
app nobody has recorded before costs far more than any of this — budget it
as the real work, and keep the driver afterwards.

## When a take goes wrong

| Symptom | Cause |
|---|---|
| A second of black at the start or the end | The app's exit is still in the cut. A GIF loops, so a blank last frame shows at both ends. |
| A prompt was typed into the shell instead of the app | A gesture missed and the driver kept going. Add `require` after it. |
| The driver clicked something unrelated | A coordinate was 0 and an offset was added to it. |
| A double-click did nothing | The strip redrew between the two clicks; select, settle, re-read, then double-click. |
| A rename typed into the pane | The rename editor never opened. Assert on the editor's own cursor glyph before typing. |
| An assertion passed but the beat did not happen | The pattern matched elsewhere on screen. Use `require_row`. |
| The GIF has blank panels the app draws | Startup events were dropped instead of collapsed. |
| The GIF has a coloured border | The render theme's background is not the app's. |
| The video is right but far too long | Waits were not wrapped in `wait_span`. |
| The take is flaky at startup only | Let the retry loop handle it, and check whether the app kills its terminal (a stale pid file plus PID reuse is one real cause). |

## Also worth knowing

- Never `pkill -f <pattern>` while driving: the pattern matches the very
  shell running the driver, and the recording dies with it. Kill by pid,
  after confirming the pid through `/proc/<pid>/cmdline`.
- Recording an app that spawns another tool means that tool's own first-run
  UI is part of your video. Check what it prints before the take,
  not after.
- Keep the driver, the reset script and the sandbox around. The next
  version of the tool needs the same video, and reproducing the environment
  is most of the work.
