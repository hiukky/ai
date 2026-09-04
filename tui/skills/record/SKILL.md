---
name: record
description: Record a terminal UI as a demo video worth publishing - an asciinema cast driven by a scripted, verified take, then cut and rendered to a GIF. Use whenever someone asks to record, film, capture or demo a TUI or CLI; to produce a README hero, a docs landing animation, a release-notes clip or a bug repro; or to redo a recording that is too long, too slow, robotic, visually off, or that leaked personal data. Also use when a recording driver misclicks, a beat silently does nothing, a long-running operation inside the app makes the video wait, or a rendered GIF comes out blank, padded in the wrong colour, or too heavy to embed. Not for editing existing video files, screen-recording a GUI, or writing docs prose to accompany a demo.
compatibility: bash, tmux, asciinema (2.x or 3.x) and python3 for recording and cutting; agg for GIF rendering; ffmpeg optional, for inspecting frames and for mp4.
---

# Record a TUI

A demo video is a **take**, not a screen capture: someone writes what it
shows, a machine performs it the same way every time, and every gesture is
checked before the next one runs.

The spec is the source of truth. One file — `demo.yml` next to the video it
produces — says what the video shows, in order, and everything needed to
make it again: the sandbox it is recorded in, the fixtures the app acts on,
and the numbers it is cut with. Nothing about a finished video lives in a
shell history, and changing the video means editing that file, never
reverse-engineering the pixels.

```
tui-record init     .demo/demo.yml   scaffold a spec
tui-record validate .demo            parse, resolve, complain
tui-record beats    .demo            read it back as prose
tui-record seed     .demo            build the sandbox and fixtures
tui-record probe    .demo            the app live, to try a selector out
tui-record run      .demo            record → cut → leak-check → render → poster
tui-record recut    .demo            cut and render the last take again
```

`references/spec.md` is the key-by-key reference. Read it before writing a
spec; the rest of this file is the judgment the keys cannot carry.

## 1. Decide the cut before writing beats

Length is a function of where the video lives. Pick one and hold it — a hero
that runs two minutes is not a long hero, it is an unwatched one.

| Destination | Length | Shape |
|---|---|---|
| README hero, docs landing | 20-40s | One arc, no dead time, loops cleanly |
| README "how it works" | 30-60s | Three or four beats, each legible |
| Docs walkthrough | 1-3 min | Chapters; consider several short clips |
| Bug repro | as short as the bug | No polish; the raw cast is often enough |

Then size the terminal: an embedded image is scaled to its column (~900px on
GitHub), so **fewer columns means bigger text**. Check the app does not
truncate at that width before spending a take on it.

Write the beat list as `say:` lines first, in the order a viewer should
understand the tool — usually *the thing exists → someone does one real thing
with it → the result appears → one screen that shows breadth*. `tui-record
beats` reads those lines back; if that reading does not sell the tool, no
amount of gesture polish will.

## 2. The subject is a sandbox, never your machine

A terminal shows the operator's home directory, prompt, hostname, repository
and open work. A demo is published; none of that should be. The `sandbox`
section of the spec builds a disposable one, and `seed` runs it — on a fresh
machine, or after `/tmp` is wiped and the fixtures go with it.

What matters, in the order these actually leak:

- **A `HOME`, `PATH` and `TERM` of its own**, entered through `env -i`.
  Inherited variables are how a recording ends up with somebody's name in it.
- **Fixtures outside `$HOME`.** Their path is on screen. `/tmp/demos/x` shows
  no username; a directory under `$HOME` does. Nothing precious lives there —
  the spec rebuilds them.
- **A prompt with no identity**, and a git identity of the demo's own, or the
  commits on screen belong to the person recording.
- **A believable past.** Five dated commits read as a project; an empty repo
  reads as a test fixture. Keep every date in the past.
- **Silence the first run.** Onboarding, tips, update banners and trust
  prompts are state in the sandbox home; pre-answer them with `write` and
  `patch_json` rather than clicking through them on camera.
- **Grant permissions with an allow list, not a bypass mode.** A tool's "skip
  all prompts" mode usually opens a consent screen of its own, which then
  *is* the first frame of your video.

**Credentials are a deliberate grant.** If the app drives something that
needs one, `link` it (a symlink, never a copy: deleting the link ends the
grant), and say so out loud — the video costs whatever that account spends.
Never wire one up on your own initiative.

## 3. Author beats against the live app

Guessing selectors costs a take each. `probe` runs the app in its sandbox
with no recording:

```
tui-record probe .                    # start it
tui-record probe . --screen           # the frame, as text
tui-record probe . --find 'Manage'    # where that selector lands, per band
tui-record probe . --stop
```

The interpreter reads coordinates from the frame that is on screen at that
moment, never from numbers written in advance — strips shift when a tab
appears, sidebars shift when a row does. `references/driving.md` covers what
that means for targeting, and the failure modes each rule prevents.

Two things the spec asks of every beat that can miss:

- `expect` — a regex the screen must show afterwards. Prefer the narrowest
  proof: `expect: docs` matches a filename in a listing; `expect_in: strip`
  proves the tab was renamed.
- `refuse` — what must *not* be there: an empty panel, an approval dialog, a
  stale read.

A beat with no proof is the expensive kind of bug: the gesture misses
silently, the next beat types into whatever has focus, and the video looks
like the app misbehaving. `validate` warns about exactly that.

## 4. Cut the waiting, not the events

Real software takes real time. Wrap those stretches — and only those — in a
`wait` beat: it polls a condition and marks the span, and the cut squeezes it
to `wait_collapse` seconds.

Keep the condition specific to the thing you are about to show. "Some file
changed somewhere" is satisfied by a part of the app nobody is looking at,
and the beat after it then opens an empty panel.

**The cut rescales time; it never drops an event before the end.** Dropping
the startup events removes the terminal's first full paint, and the player
draws the rest onto a blank screen — panels missing that the live app clearly
draws, which reads as an app bug and sends you debugging the wrong thing.
Trailing events are the exception: the `end` beat marks where the video
stops, so the app's own exit — the write that blanks the screen — never
reaches it. A GIF loops, and a blank final frame shows at *both* ends.

## 5. Render to match the app

The renderer paints the frame's padding in the theme background, so
`background` must be the colour the app actually paints — take it from the
app's palette constant, and verify from the output:

```
ffmpeg -i demo.gif -vf "select=eq(n\,40)" -vsync 0 frame.png
```

Speed 1.0-1.4 reads as a person; past ~1.5 it reads as fast-forward. If the
file is too heavy for where it embeds, cut beats before cutting quality.

Point `poster_when` at what has to be on screen rather than `poster_at` at a
second: a re-cut moves every timestamp, and a poster pinned to a number
silently becomes a half-drawn frame.

## 6. Publishing is gated, not advised

`run` refuses to finish when the leak scan finds the operator's username,
home path or hostname, a session URL, an `sk-` token, a bearer header, a
private key or a private IP. `forbid` adds project-specific patterns.

Redaction (`tui-record redact`) replaces with same-length text so nothing
reflows, and it is a last resort: it only fixes what you thought to search
for, while the sandbox fixes what you did not.

Two things the scan cannot judge, worth naming to whoever asked for the
video: what the app's own chrome reveals (a plan tier, a version, a model
name), and whether the demo content itself is fine to publish.

## What it costs

Measured, so a plan can be made against it:

| Stage | Time |
|---|---|
| One successful take | the take's own length + ~12s |
| A lost beat | that attempt again — the runner resets and repeats |
| `compress`, `check` | well under a second |
| `render` | ~16s for a 45s cast at 152 columns |
| `recut` (re-cut and re-render, no recording) | ~20s |
| `seed` (whole sandbox from nothing) | ~20s, plus whatever it downloads |

What dominates is the app's own latency inside the video — an operation that
takes two minutes is two minutes of wall clock even when the cut hides it —
and then lost beats. Writing the first spec for an app nobody has recorded
costs far more than any of this; that is the work, and the spec is what makes
it a one-time cost.

## When a take goes wrong

| Symptom | Cause |
|---|---|
| Text typed into the wrong place | A gesture missed and the take carried on. Add `expect`. |
| A click landed somewhere unrelated | The target was not on screen; only ever offset a real hit. |
| A double-click did nothing | The strip redrew between the two clicks (the interpreter re-reads; a hand-written driver must too). |
| An `expect` passed but the beat did not happen | The pattern matched elsewhere. Narrow it with `expect_in`. |
| A rendered GIF has blank panels | Startup events were dropped instead of collapsed. |
| A coloured border around the frame | `background` is not the app's own. |
| A second of black at either end | The app's exit is still in the cut — the take needs an `end` beat. |
| The video is right but far too long | Latency was not wrapped in `wait` beats. |
| Flaky only at startup | Let the retries absorb it; check whether the app kills its own terminal (a stale pid file plus PID reuse is one real cause). |

## Leave it reproducible

What the next person needs is not the cast — it is everything that produced
it, in the project it demos. That is the whole point of the spec: `.demo/`
holds the spec and the output, and nothing else. No scripts to read, no
parameters that live in someone's history.

Three properties keep it that way:

- **The sandbox is built by the spec, not by hand.** Whatever you did
  interactively to make the app look right belongs in `write`, `link`,
  `provision` or `patch_json`, or it is lost the first time the machine
  changes.
- **The fixtures are disposable and the spec says how to rebuild them.**
- **Every parameter is a decision with a reason** — write the reason as a
  comment beside it. That is the difference between changing a video and
  re-deriving one.
