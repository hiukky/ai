# tui

A terminal UI recorded as a **take**, not a screen capture: somebody writes
what it shows, a machine performs it the same way every time, and every
gesture is verified before the next one runs.

- `record` — asciinema cast → cut → leak scan → GIF, all from one spec

The spec is the source of truth — one `demo.yml` beside the video it produces,
naming the disposable sandbox it is recorded in, the fixtures the app acts on,
and the numbers it is cut with. Changing the video means editing that file,
never reverse-engineering the pixels. Never the operator's own machine, and
waiting is cut by rescaling timestamps rather than dropping events.

```text
tui-record init      scaffold a spec
tui-record validate  parse, resolve, complain
tui-record beats     read it back as prose
tui-record seed      build the sandbox and fixtures
tui-record probe     the app live, to try a selector out
tui-record run       record → cut → leak-check → render → poster
tui-record recut     cut and render the last take again
```

`skills/record/references/spec.md` is the key-by-key format reference.

```bash
uze install tui@ai -m   # machine-wide
uze tui@ai              # this project only
```
