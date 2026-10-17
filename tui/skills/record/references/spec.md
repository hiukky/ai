# The spec

One file says what a video shows and everything needed to make it again.
`tui-record` reads it; nothing about a finished video lives in a shell
history. YAML is the format to write (a list of beats is a list of small
maps, and file contents want block scalars); TOML is accepted too, because
its parser is in the standard library and some machines have no PyYAML.

```
tui-record init     specs/demo.yml     scaffold
tui-record validate .                  parse, resolve, complain
tui-record beats    .                  read it back as prose
tui-record seed     .                  build the sandbox and fixtures
tui-record probe    .                  the app, live, to try a selector
tui-record run      .                  record → cut → check → render → poster
tui-record recut    .                  cut and render the last take again
```

A directory argument finds `demo.yml`, `demo.yaml` or `demo.toml` inside it.

## `video`

| Key | Meaning |
|---|---|
| `title` | Recorded into the cast header |
| `out` | The rendered GIF, relative to the project root. Rendered on every take — it is how a take is reviewed — and beside the cast (`<cast>.gif`) when left out |
| `publish` | What is copied where once the leak scan passes: a list of `{from, to}`, `from` one of `cast` (the cut take, never the `.raw.cast`), `out` (the GIF, the default) or `poster`; `to` is relative to the project root. A site plays the `cast` with asciinema-player — text stays sharp, the file is small; the GIF is for places with no JavaScript (a GitHub README, social previews, release notes) |
| `poster` | A still, for a site that shows one before playing |
| `poster_when` | What must be on screen in that still — a regex, matched against the cast. Survives a re-cut; `poster_at` (seconds) does not |
| `cast` | Where the take is kept. `.raw.cast` beside it is the negative |
| `cols`, `rows` | Terminal size. Fewer columns = bigger text wherever it embeds |
| `speed` | 1.0–1.4 reads as a person; past ~1.5 as fast-forward |
| `background`, `foreground`, `palette` | The renderer paints the frame's padding in the background, so it must be the app's own or it shows as a border |
| `font_family` | The font the renderer draws with, by family name. An app that uses a patched font needs one here too — the default list asks for `JetBrains Mono`, which does not find `JetBrainsMono Nerd Font`, and every icon then lands as a blank cell. A name that is not installed is reported, because the renderer falls back silently |
| `font_dir` | A directory (or a list) the renderer loads fonts from besides the system's — for a font that was downloaded but never installed, which fontconfig cannot match by name. `~` is expanded |
| `font_size`, `idle_limit` | Passed to the renderer |
| `renderer` | The renderer's drawing backend: `swash` (its default) or `resvg`. `resvg` strokes box-drawing characters heavier and joins them at corners, the way a terminal draws them itself — the one to pick for an app made of borders, rules or diagrams. Left out, the renderer's own default |
| `line_height` | Row height as a multiple of the font size. The renderer's default leaves air between rows that a terminal does not, so a screen reads looser and taller than the one it was drawn for; `1.0` is the terminal's own spacing |
| `wait_collapse` | What a `wait` beat's stretch collapses to |
| `sidebar` | Column where the sidebar band ends, for `in: sidebar` |
| `settle` | Seconds to let the app start before the first beat |
| `forbid` | Extra regexes the leak scan must not find |

## `sandbox`

The recording never runs in the operator's environment: an inherited
variable is how a video ends up with somebody's name in it.

| Key | Meaning |
|---|---|
| `root` | The sandbox home's parent. Never on screen |
| `fixtures` | Where fixture repositories are built. **On screen** — keep it out of `$HOME`, or the path carries a username |
| `cwd`, `command` | What gets recorded, and where |
| `path`, `env`, `shell` | The whole environment, built rather than inherited |
| `binaries` | Names symlinked into the sandbox from the real `PATH` |
| `write` | Files the sandbox needs (a prompt with no identity, a git identity, pre-answered onboarding) |
| `link`, `copy` | Credentials and configs. Links, never copies: deleting the link ends the grant |
| `provision` | Commands run inside the sandbox environment, in order |
| `patch_json` | Keys merged into a JSON file *after* provisioning, for files a provisioned tool writes itself |
| `reset` | Extra commands run before every attempt |
| `clear` | Paths deleted before every attempt |
| `author`, `author_email` | Who the fixture commits belong to |

Placeholders in any string: `{project}`, `{root}`, `{home}`, `{runtime}`,
`{fixtures}`. Anything else in braces is left alone, so a fixture may contain
code.

## `fixtures`

Repositories with a believable past — an empty repo reads as a test fixture.

```yaml
fixtures:
  - name: demo-app
    commits:
      - message: "chore: initial commit"
        days_ago: 7
        files:
          README.md: "# demo-app"
```

Dates are relative and always in the past: "in the future" in a timeline is
a tell. The HEAD of each fixture is remembered, and `reset` rewinds to it
before every attempt.

Both the repository (`{fixtures}/<name>`) and its remembered HEAD
(`{root}/base-<name>.sha`) are keyed by the fixture's **name**, not by the
spec that built it. Two specs sharing a sandbox and naming the same fixture
share one repository: whichever seeded last rebuilt it, and wrote the HEAD
that both rewind to. That is only right when both define it identically,
which is what `include` is for:

```yaml
fixtures:
  - include: ../_shared/demo-api.yml     # relative to this file
  - name: scratch                        # beside a fixture of its own
    commits: [...]
```

The included file holds one fixture (a mapping with a `name`) or a list of
them. A name defined twice in one composed spec fails `validate`.

## `beats`

One gesture each, in the order the video shows them. `say` is the line that
appears in `beats` output and in the failure message when that beat is lost.

| Key | Action |
|---|---|
| `type` | Types it with a human cadence, then Enter unless `submit: false`. `clear: N` or `clear: all` empties a field first |
| `key` | A tmux key name, or a list of them (`Escape`, `C-g`, `BSpace`) |
| `click`, `dclick`, `rclick` | Mouse, by the text to aim at |
| `glyph` | Aim at the first cell holding any of these characters instead of at text |
| `wait` | `screen`, `file` or `shell`, with `until`. The stretch is collapsed by the cut |
| `end` | Quits the app. The cut stops here, so its exit never reaches the video |

Targeting: `in` picks the band (`sidebar`, `pane`, `strip`, `screen`),
`occurrence` picks which hit (`first`, `last`, or a number — a toolbar button
is often the *last* of a glyph the tabs also carry), and `offset` shifts
columns from the hit. A target that is not on screen ends the take rather
than clicking somewhere plausible.

Proving it happened: `expect` (a regex the screen must show), `expect_in`,
`expect_timeout`, and `refuse` (what it must *not* show — an empty panel, an
approval dialog). `validate` warns about a click with no `expect`, because a
miss there is silent and the next beat then acts on the wrong screen.

```yaml
beats:
  - say: the space is renamed — it is yours, not the directory's
    dclick: demo-app
    in: sidebar
    offset: 3
    expect: "demo-app▏"        # the rename editor's own cursor
  - type: api
    clear: 8
  - say: wait for the agent's first edit — the only stretch the cut squeezes
    wait: shell
    until: grep -qs Routes /tmp/demos/demo-app/.worktrees/*/README.md
    timeout: 150
  - say: and out
    end: C-q
```

## Composing specs

Specs for one app share most of what they are. Three keys put the shared
part in one place; the interpreter composes before anything else reads the
spec, so `validate`, `beats`, `run` and the failure messages all see the
result.

`extends: <path>` (or a list) at the top level: each base is composed the
same way, recursively, then this file is merged over it. A base reached
twice through two others is merged once; a cycle is an error naming the
chain. Paths are relative to the file that names them.

| Value in the spec | Over the base's |
|---|---|
| mapping | merged key by key |
| list | appended, base first |
| scalar | replaces it |
| `{replace: value}` | `value`, and the base's is discarded |

Two lists replace rather than append, because each is one value:
`sandbox.command` (an argv) and `sandbox.path` (an order). So does a macro
redefined under the same name. `{replace: ...}` is a plain mapping, not a
YAML tag, so it reads the same in TOML; it works on mappings too
(`env: {replace: {TZ: UTC}}`). Placeholders resolve after the merge, against
the spec being run: `{project}` in a base is the project of the spec that
extends it.

`macros:` maps a name to a list of beats; a beat `use: <name>` with
`with: {param: value}` stands for them, expanded inline before validation:

```yaml
macros:
  launch:
    - say: a new agent, on {harness}
      click: New
      in: sidebar
      expect: Harness
    - say: "{harness} is up"
      click: "{harness}"
      expect: "{ready}"
      expect_in: pane
beats:
  - use: launch
    with: {harness: claude, ready: "Welcome"}
```

Parameters use the same braces as placeholders and are substituted first,
only for the names `with` gives; a parameter may not be named after a
placeholder (`project`, `root`, `home`, `runtime`, `fixtures`), so `{home}`
in a macro always means the sandbox home. A brace name left unfilled is an
error, and a value that is a whole string of one parameter keeps its type
(`offset: "{nudge}"` stays a number). A `use` beat takes nothing but
`with`; macros may use other macros, and may live in a base.

`validate` lists every file it composed, in merge order.

## Writing one

Author beats against a live app rather than by guessing:

```
tui-record probe .                       # the app, in its sandbox, no recording
tui-record probe . --screen              # the frame as text
tui-record probe . --find 'Manage'       # where that selector lands, per band
tui-record probe . --stop
```

Then `validate`, then `run`. A beat that misses ends the take with the line
from `say`, and the runner resets and tries again — so a flaky app costs
time, not a wrong video.
