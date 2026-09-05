---
name: sync
description: Keep the machine and its dotfiles repo the same thing - install and configure through the chezmoi source directory, never by hand. Use whenever someone asks to install or set up anything on the machine (a CLI, an apt package, a runtime, a font, a desktop app - "instala o X", "poe o Y na maquina", "configura o Z"), whenever a config file under $HOME needs changing, and whenever they ask whether the environment is in sync, what drifted, or why a fresh machine would not come out the same. Also use right after something was installed by hand, to write it back before it is forgotten. Machine-scoped - applies in any project, or in none.
compatibility: chezmoi 2.x with its source directory on a git remote. Linux/WSL, with Windows-host steps shelling out through powershell.exe.
---

# Sync the machine with its dotfiles

The machine is a **build product** of the dotfiles repo, not a place where
things accumulate. A tool installed by hand exists exactly until the next
machine, and nobody finds out which ones those were until they are setting one
up.

So the direction of every change is fixed: **write it into the source
directory, then let `chezmoi apply` perform it on the machine.** This is also
chezmoi's own documented daily flow (`chezmoi edit --apply`). The reverse
direction - `chezmoi add` / `chezmoi re-add` - is an *import path* for what
already happened on disk, not a workflow to plan around.

Locate the source with `chezmoi source-path`; never hardcode it. This setup
points chezmoi at `~/dotfiles` via `sourceDir` in `~/.config/chezmoi/chezmoi.toml`
instead of the default `~/.local/share/chezmoi`, and that line is load-bearing
(see Guardrails). The source dir's own `CLAUDE.md` carries the per-script
history and gotchas - read it before changing a script that already exists.

## What "by hand" means

`sudo apt install`, `npm i -g`, `curl ... | sh`, `winget install`, opening
`~/.zshrc` in an editor: none of these are how a tool *gets onto* this machine.
Running one to try something out is fine. The task is not done until the same
thing is expressed in the source and reproduced by an apply on a clean machine.

If the user installed something by hand before asking, don't undo it - write
the lane, apply, and confirm the script is a no-op against what is already
there. That is what the idempotency guards are for.

## Where a change goes

Find the existing lane before inventing one. This source dir's lanes, with the
current filenames as examples:

| What arrived | Lane | Why there |
| --- | --- | --- |
| apt package (WSL side) | the apt list script (`run_once_before_00-apt-packages.sh`) | one `apt-get install` for everything; a package is a line, not a script |
| something mise has a backend for (runtimes, `rust`, `bun`, `glow`, `rtk`) | `dot_config/mise/config.toml` `[tools]` | no curl installer to maintain; version policy in one file |
| tool with an official installer or a release binary | a new `run_once_before_NN-<tool>.sh` | needs its own guard, its own source domain |
| tool that needs an applied dotfile, or a runtime mise installed (npm/bun globals) | a new `run_once_after_8N-<tool>.sh` | `after_` runs once dotfiles are on disk and `mise install` has run |
| Windows-host desktop app | the windows-apps script (`run_once_before_18-windows-apps.sh`) | Store first, winget as fallback, from WSL via `powershell.exe` |
| Windows-side file outside `$HOME` (`.wslconfig`, Windows Terminal settings) | `.chezmoitemplates/` + a `run_onchange_before_0N-*.sh.tmpl` | chezmoi only targets `$HOME`; `run_onchange_` leaves UI-made tweaks alone |
| a config file the tool reads from `$HOME` | `chezmoi add <path>` (`.tmpl` if it carries machine-specific values) | let chezmoi encode the name rather than guessing `dot_`/`private_` |
| generated state (plugin caches, baked-in absolute paths, credentials) | nowhere - stays untracked | tracking it makes the next machine wrong, not reproducible |

**Numbering is dependency order, not taste.** Roughly: `before_00-49` packages,
runtimes, then heavy SDKs; `before_65-71` the agent CLIs; `after_80-83` anything
that needs mise or an already-applied file; `after_85-95` machine defaults and
the interactive account setup, which runs last because a human has to click.
Pick the number by what must exist first.

## Writing the script

```bash
#!/bin/bash
set -euo pipefail

if ! command -v <tool> >/dev/null 2>&1; then
  curl -fsSL https://<the tool's own domain>/install.sh | sh
fi
```

- **Guard everything.** `run_once_` is tracked by content hash, so editing a
  script makes it eligible to run again, whole, on the next apply. Idempotency
  is what makes that safe.
- **`PATH` is not what you think.** chezmoi runs scripts without sourcing
  `.zshrc`/`.profile`, so a tool installed into `~/.local/bin` earlier in the
  same apply may not resolve. Use the established pattern:
  `BIN="$(command -v npm || echo "$HOME/.local/share/mise/shims/npm")"`.
- **WSL-only work exits early elsewhere:** `grep -qi microsoft /proc/version`
  and `command -v powershell.exe`, both before doing anything.
- **`curl | sh` only from the tool's own official domain.** These scripts run
  unattended during an apply, and the repo is public.
- A Windows-host script's effects are **host-wide, not per-distro**: fonts,
  Terminal settings and winget apps hit the one shared Windows user.

## Applying

```sh
chezmoi diff          # read it, especially the removals
chezmoi apply -v
chezmoi status        # expect it clean
```

Never apply without reading the diff first: apply is destructive toward
machine-side edits (see below). To force an already-run `run_once_` script to
run again, drop its state - `chezmoi state delete-bucket --bucket=scriptState`
re-arms all of them, which is only safe because every script is guarded.

Then **verify the thing actually works** (`command -v`, `--version`, run it)
before saying it is done, and commit in the source dir with Conventional
Commits (the `git:commit` skill). An applied change that is never committed is
drift with extra steps.

## Checking sync

"Is the environment in sync?" is four questions, and a green answer to one is
not an answer to the others:

```sh
SRC="$(chezmoi source-path)"
chezmoi status                                  # 1. machine vs source (and pending scripts)
git -C "$SRC" status -sb                        # 2. source vs committed
git -C "$SRC" log --oneline @{u}..              # 3. committed vs pushed
chezmoi unmanaged | head -40                    # 4. what lives in $HOME that nothing tracks
```

Plus `chezmoi verify` for a cheap yes/no (exit 1 if anything is off), `chezmoi
diff` for what an apply would change, and `chezmoi diff --reverse` to read the
same drift from the machine's side.

`chezmoi status` prints two columns: the first is the machine against the state
chezmoi last wrote, the second is what `apply` will do. `A` added, `D` deleted,
`M` modified, `R` a script will run.

| Signal | What it means | What to do |
| --- | --- | --- |
| ` M` | source is ahead; apply has not run | `chezmoi diff` the path, then apply |
| `M ` or `MM` | the machine drifted - a hand edit, or an installer appended to a managed file | decide which side is right: `chezmoi re-add <path>` to keep the machine's version, apply to discard it |
| ` R` | a provisioning script is pending | fine; read it first if it touches the Windows host or needs sudo |
| clean status, dirty `git status` | the change is applied but exists only on this machine | commit and push |
| tool on `PATH` that no script installs | the real gap this skill exists for | write the lane, apply, confirm it no-ops |
| script installs it, `command -v` fails | provisioning is lying about itself | fix the script, re-arm it, apply |

The fourth axis - **installed vs provisioned** - has no single command. Sweep
`~/.local/bin`, `mise ls`, `apt-mark showmanual`, and the global bun/npm
packages, and compare against what the scripts and `config.toml` actually
install. Present the leftovers as a list and ask: from here, an abandoned
experiment and a load-bearing tool look identical.

## What an apply quietly deletes

The most common way this environment regresses is an installer appending to a
file chezmoi manages. `~/.zshrc` has collected `PATH` lines written by tool
installers that the source knows nothing about; `chezmoi apply` removes every
one of them, silently, as part of doing its job correctly.

So: scan `chezmoi diff` for **removals** before applying, and `chezmoi re-add`
(or better, move the line into the source properly) anything that should
survive. When a tool's installer is known to edit a shell rc file, that edit
belongs in the tracked `dot_zshrc`, not in the machine's copy.

## Guardrails

- **The repo is public.** `chezmoi add` copies content verbatim with no idea
  what is sensitive. Check for tokens, keys and passwords before adding
  anything. Already confirmed excluded and staying that way: `~/.npmrc`,
  `~/.config/gh/hosts.yml`, everything under `~/.ssh` and `~/.gnupg`, shell
  histories.
- **Never run `chezmoi init` on an already-provisioned machine.** It rewrites
  `~/.config/chezmoi/chezmoi.toml` from the template, which defines `[data]`
  and not `sourceDir` - that is how this machine once ended up with a second,
  divergent clone at `~/.local/share/chezmoi`. Use `chezmoi update` (or the
  repo's `setup.sh`, which checks before choosing) instead.
- **Don't edit a managed file in `$HOME`.** `chezmoi edit --apply <path>` edits
  the source and applies in one step; anything else creates drift on purpose.
- **Anything interactive stays interactive.** SSH keys, `gh`/`glab`/`claude`
  logins and the WSL first-run account are deliberately human steps at the end
  of provisioning; do not try to script around them.
