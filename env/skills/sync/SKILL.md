---
name: sync
description: Keep a machine and its dotfiles repo the same thing - install and configure through the dotfiles source directory, never by hand. Use whenever someone asks to install or set up anything on their machine (a CLI, a package, a runtime, a font, a desktop app - "instala o X", "poe o Y na maquina", "set this up"), whenever a config file in the home directory needs changing, and whenever they ask whether the environment is in sync, what drifted, or why a fresh machine would not come out the same. Also use right after something was installed by hand, to write it back before it is forgotten. Machine-scoped - applies in any project, or in none.
compatibility: chezmoi 2.x with its source directory under version control. Any platform chezmoi runs on - the package managers, script names and numbering are read from the source directory being managed, never assumed by this skill.
---

# Sync the machine with its dotfiles

A machine is a **build product** of its dotfiles repo, not a place where things
accumulate. A tool installed by hand exists exactly until the next machine, and
nobody finds out which ones those were until they are setting one up.

So the direction of every change is fixed: **write it into the source
directory, then let `chezmoi apply` perform it on the machine.** That is
chezmoi's own documented daily flow (`chezmoi edit --apply`). The opposite
direction — `chezmoi add` / `chezmoi re-add` — is an *import path* for what
already happened on disk, not a workflow to plan around.

Everything below is how to **classify** a change and where to look. The actual
paths, filenames, numbering and package managers come from the source directory
in front of you. Read it first; never assume it looks like anyone else's.

## 0. Read the setup before changing it

```sh
SRC="$(chezmoi source-path)"                 # the location is configurable; never hardcode it
ls -A "$SRC"                                 # dotfiles, and which chezmoi directories exist
ls "$SRC"/.chezmoiscripts 2>/dev/null        # the provisioning lanes, and their numbering
cat "$SRC"/.chezmoiignore 2>/dev/null        # what is repo-only and never applied
chezmoi data | head -40                      # template variables and OS facts this setup has
chezmoi managed | head -40                   # what is actually tracked
```

Then read the source directory's **own** documentation — `CLAUDE.md`,
`AGENTS.md`, `README.md`, comments at the top of its scripts. If it states a
convention, that convention wins over anything in this file; a setup's own
reasoning is never something to override from the outside. If it states none,
follow chezmoi's documented naming and *write down* the convention you
established, so the next change has something to follow.

Three facts decide almost everything that comes next, and all three are read,
not assumed:

- **What manages packages here** — whichever managers the existing scripts
  actually invoke (`apt`, `brew`, `pacman`, `winget`, `nix`, …).
- **Whether a declarative version manager is in play** — a config listing
  runtimes (mise, asdf, a nix flake) means new runtimes are a line there, not a
  script.
- **Whether this machine provisions anything outside itself** — a VM or WSL
  guest that installs software on its host is a lane with its own probe.

## 1. What "by hand" means

`sudo apt install`, `brew install`, `npm i -g`, `curl … | sh`, `winget
install`, opening a shell rc in an editor: none of these are how a tool *gets
onto* a machine. Running one to try something out is fine. The task is not done
until the same thing is expressed in the source and would be reproduced by an
apply on a clean machine.

If the user installed something by hand before asking, don't undo it — write
the lane, apply, and confirm the new step is a no-op against what is already
there. That is what the idempotency guards are for.

## 2. Pick the lane

Match the change to a kind, then find that kind's existing home in the source
directory. Add to an existing lane before creating a new one.

| Kind of change | Where it belongs | How to recognise the lane |
| --- | --- | --- |
| OS package | the existing package-list script — a package is a **line**, not a new script | an early `run_once_before_` script calling the OS package manager once for many packages |
| a runtime or tool a declarative version manager can install | that manager's config | a tracked config listing tools/versions (mise, asdf, nix) |
| tool with an official installer or a release binary | a **new** guarded `run_once_before_NN-<tool>.sh` | per-tool scripts, each guarded, each from one vendor domain |
| tool that needs an applied dotfile, or a runtime installed earlier in the same apply | a new `run_once_after_NN-<tool>.sh` | `after_` scripts, numbered past whatever installs their prerequisite |
| software for another OS or a host machine (guest → host) | that host's existing script, behind a platform probe | a script that shells out to the host (`powershell.exe`, an SSH hop) and exits early elsewhere |
| a file that lives outside chezmoi's target directory | `.chezmoitemplates/` + a `run_onchange_` script that writes it | chezmoi only writes inside its target dir; anything else is a script's job |
| a config file the tool reads from the home directory | `chezmoi add <path>` — `.tmpl` when it carries machine-specific values | let chezmoi encode the name instead of guessing its `dot_`/`private_`/`executable_` prefixes |
| generated state: caches, plugin installs, files with absolute paths or credentials baked in | nowhere — stays untracked, with a line in the repo's docs saying why | tracking it makes the next machine wrong, not reproducible |

**Ordering is dependency order.** Read the neighbouring numbers and slot in by
what must exist first — a script runs after everything it needs and before
everything that needs it. Don't invent a numbering scheme where one already
exists, and don't renumber existing scripts to make room; the gaps are there
for this.

`run_onchange_` instead of `run_once_` when the thing being written is also
edited outside the repo (a GUI's settings file): it only re-runs when the
tracked content changes, so day-to-day tweaks are not silently reverted.

## 3. Write the script so re-running is boring

Match the interpreter and shape of the scripts already there — chezmoi runs
whatever the shebang (or the setup's `scriptTempDir`/`.ps1` convention) says.
The shape, in shell:

```bash
#!/bin/bash
set -euo pipefail

if ! command -v <tool> >/dev/null 2>&1; then
  <install, from the tool's own official source>
fi
```

- **Guard everything.** `run_once_` is tracked by a hash of the script's
  contents, so editing one re-arms it — it will run again, whole. Idempotency
  is what makes that safe, and it is a chezmoi requirement, not a style choice.
- **`PATH` is not what an interactive shell has.** chezmoi runs scripts without
  sourcing shell rc files, so a binary installed earlier in the same apply may
  not resolve. Resolve it explicitly:
  `BIN="$(command -v <tool> || echo "<the path its installer uses>")"`.
- **Probe before doing anything platform-specific**, and exit `0` when the
  probe fails, so the same script is safe on every machine that shares the repo.
  Use what `chezmoi data` already exposes (`.chezmoi.os`, `.chezmoi.osRelease`)
  in templates rather than re-deriving it.
- **Install only from the tool's own official source.** These scripts run
  unattended during an apply, and a dotfiles repo is often public.
- **Say when effects are not machine-local.** A script that writes to a shared
  host (fonts, a terminal emulator's settings, a hypervisor) affects every
  guest, not just the one that ran it. Note it in the script.

## 4. Apply, verify, commit

```sh
chezmoi diff          # read it, especially the removals
chezmoi apply -v
chezmoi status        # expect it clean
```

Never apply without reading the diff: apply is destructive toward machine-side
edits (§6). To make an already-run `run_once_` script run again, drop its
recorded state — `chezmoi state delete-bucket --bucket=scriptState` re-arms all
of them, which is only safe because every script is guarded.

Then **verify the thing actually works** (`command -v`, `--version`, run it)
before saying it is done, and commit in the source directory — it is a git repo
like any other, so the `git:commit` skill applies. An applied change that is
never committed is drift with extra steps.

## 5. "Is it in sync?" is four questions

A green answer to one is not an answer to the others.

```sh
SRC="$(chezmoi source-path)"
chezmoi status                     # 1. machine vs source (and pending scripts)
git -C "$SRC" status -sb           # 2. source vs committed
git -C "$SRC" log --oneline @{u}.. # 3. committed vs pushed
chezmoi unmanaged | head -40       # 4. what lives in the home dir that nothing tracks
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
| `M ` or `MM` | the machine drifted — a hand edit, or an installer appended to a managed file | decide which side is right: `chezmoi re-add <path>` keeps the machine's version, apply discards it |
| ` R` | a provisioning script is pending | fine; read it first if it needs sudo or touches a shared host |
| clean status, dirty `git status` | the change is applied but exists only on this machine | commit and push |
| on `PATH`, but no lane installs it | the real gap this skill exists for | write the lane, apply, confirm it no-ops |
| a lane installs it, but it is not there | provisioning is lying about itself | fix the script, re-arm it, apply |

The fourth axis — **installed vs provisioned** — has no single command, because
it depends on what this machine uses. Ask each manager the setup actually has
for what was installed deliberately (an explicitly-installed package list, the
version manager's installed set, global packages of each language runtime,
whatever sits in the user's local `bin`), and compare that against what the
lanes install. Present the leftovers as a list rather than acting on them: from
the outside, an abandoned experiment and a load-bearing tool look identical.

## 6. What an apply quietly deletes

The most common way an environment regresses: an installer appends a line to a
file chezmoi manages — a `PATH` export written into a shell rc, a block added
to an editor config. The source knows nothing about it, so `chezmoi apply`
removes it, silently, as part of doing its job correctly.

So scan `chezmoi diff` for **removals** before applying. Anything that should
survive belongs in the tracked file, not on the machine — and if a tool's
installer is known to edit a managed file, that edit is part of its lane.

## 7. Guardrails

- **Assume the source repo is public.** `chezmoi add` copies content verbatim
  with no idea what is sensitive. Before adding anything, read it for tokens,
  keys and passwords, and check the credential locations of whatever tools this
  setup installs (package-manager auth files, CLI config with OAuth tokens,
  key material, shell history). When a secret must be referenced, use a runtime
  environment variable, chezmoi's encryption, or a template pulling from an
  ignored local file — never an inlined value.
- **Never run `chezmoi init` on an already-provisioned machine.** It rewrites
  the chezmoi config from `.chezmoi.toml.tmpl`, which typically defines only
  `[data]` — any key set by hand (a non-default `sourceDir`, for one) is lost,
  and chezmoi silently falls back to its defaults and clones a second,
  divergent copy of the repo. `chezmoi update` is the command for an existing
  machine.
- **Don't edit a managed file in place.** `chezmoi edit --apply <path>` edits
  the source and applies in one step; anything else creates drift on purpose.
- **Anything that needs a human stays human.** Key generation, browser OAuth
  logins, a first-boot account, a UAC prompt: these belong at the *end* of
  provisioning, announced, not scripted around.
