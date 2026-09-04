# Cutting and rendering a cast

What happens to a recording between the take and the file someone embeds.

## What a cast is

An asciinema v2 cast is a JSON header line followed by one JSON array per
write: `[time, "o", "<bytes the app wrote>"]`. Time is seconds since the
recording started; the header carries `width`, `height`, `timestamp` (unix
seconds when recording began) and whichever environment variables asciinema
was told to keep.

Two consequences worth internalising:

- **The stream is a terminal session, not a video.** There are no frames;
  a player reconstructs the screen by replaying writes into an emulator.
- **Early events matter disproportionately.** The app's first full paint is
  in there once. Everything after it is a diff against that paint.

Record with `-e TERM` so only `TERM` is stored: asciinema's default also
keeps `SHELL`, which is a small leak and a pointless one.

## Cutting

`tui-record compress` rewrites timestamps only:

- Every `NAME_start`/`NAME_end` pair left by `wait_span` is a stretch where
  the video was waiting, rescaled to `--span` seconds (default 1.5).
- Everything before `driver_start` is app startup, collapsed to a single
  instant so the video opens on the app already running.

**It never deletes an event, and neither should anything you write.**
Dropping the startup events removes the first full paint; the player then
applies the rest of the take to a blank screen and the output shows panels
missing that the live app clearly draws. The symptom looks like an app bug,
which is what makes it expensive: it sends you debugging the wrong thing.

Rescaling *within* a span is deliberate rather than cutting it out: a
spinner that keeps moving, sped up, reads as time passing. A hard cut reads
as a glitch.

Because the marks are wall-clock and the header's `timestamp` is the take's
start, a cast can be re-cut with different targets at any time — as long as
you kept the raw cast. `take` writes `<name>.raw.cast` for exactly that.

## Rendering

`tui-record render` wraps [agg](https://github.com/asciinema/agg) (install
from its repository — the `agg` crate on crates.io is unrelated and has no
binary).

| Option | Use |
|---|---|
| `--bg` | The app's own background colour. |
| `--fg`, `--palette` | The 16 ANSI colours; matters for the shells and agents inside the app, not the app's own truecolour drawing. |
| `--font-size` | 13-14 for a README; the pixel size of the output scales with it. |
| `--speed` | 1.0-1.4 reads as a person. Past ~1.5 it reads as fast-forward. |
| `--idle` | Caps gaps between writes. Useless while a spinner animates — that is what `compress` is for. |

The renderer paints the padding around the terminal in the theme
background, so a theme that is not the app's shows as a border in a colour
the app never uses. Take the value from the app's palette (a constant in its
source, usually) and verify from the output rather than by eye:

```
ffmpeg -loglevel error -i demo.gif -vf "select=eq(n\,0)" -vsync 0 corner.png
ffmpeg -loglevel error -i corner.png -vf "crop=4:4:0:0" -f rawvideo -pix_fmt rgb24 - | od -An -tu1 -N3
```

## Choosing a format

| Format | When | Cost |
|---|---|---|
| GIF | README, anywhere an image tag is all you get | ~0.5-1MB for 30-40s at 140x36 |
| mp4/webm | Docs sites, landing pages | Smaller and smoother; needs a video tag |
| `.cast` + asciinema player | Docs where readers may want to copy text | Smallest; text stays selectable |
| asciinema.org link | Sharing a repro quickly | Public unless you configure otherwise |

For mp4 from the same cast: render a GIF and convert
(`ffmpeg -i demo.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" demo.mp4`),
or point the renderer at a PNG sequence if you need more control.

If a GIF is too heavy, cut beats before cutting quality: shrinking the font
or the palette makes it look cheap, while removing a beat nobody needed
makes it better.

## Redacting

`tui-record redact` replaces every match with `x` of the **same length**, so
nothing on screen reflows — a shorter replacement moves every glyph after it
on that row, and the rest of the take then draws against a screen the app
never produced.

Redaction is a last resort. Anything that can be kept out of the take by
sandboxing should be, because redaction only fixes what you thought to
search for. Run `tui-record check` on the final cast either way; it looks
for the operator's username, home path and hostname, session URLs, `sk-`
tokens, bearer headers, private keys and private IPs, and it exits non-zero
when it finds one.

Two things it cannot judge, which are worth naming to whoever asked for the
video: what the app's own chrome reveals (a plan tier, a version, a model
name, a workspace title), and whether the demo content itself is fine to
publish.
