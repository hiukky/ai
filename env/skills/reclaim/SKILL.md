---
name: reclaim
description: Find what is filling a machine's disks and give the space back - measure the Linux side, the WSL virtual disks and the Windows host in one pass, prune what regenerates (docker build cache and unused images, package-manager caches, cargo target/ and node_modules/), put everything that needs a decision in front of the person, and finish with the exact commands that shrink a WSL disk on the host. Use whenever someone asks what is taking up space, why a disk (C:, the home dir, the WSL distro) is full or almost full, to free or clean up disk space, to prune docker or old builds, or whether and how to compact, shrink or optimize a WSL vhdx. Machine-scoped - applies in any project, or in none. Not for deleting a project's source or a user's documents, not for provisioning (that is `sync`), and not for a one-off `du` on a single directory.
compatibility: Linux with python3, du, find and df. Under WSL2 it also measures the Windows host through powershell.exe and prints the host-side compaction; elsewhere those sections are simply absent. docker, git and each package manager are used only if present.
---

# Reclaim disk space

Finding space is two jobs that must not be mixed. **Measuring and removing
are deterministic**: the same machine gives the same numbers, and a cache a
tool rebuilds on its own can go without anyone deciding anything. **Choosing
is not**: an open worktree, a downloaded model, a VM image and a game all look
like large directories, and only the person knows which one they still need.

`scripts/reclaim` (next to this file) does the deterministic half and hands
the other half back as data. Read its output; do not re-derive it with ad-hoc
`du` calls.

```
reclaim scan    [--json] [--no-host] [--top N]   measure everything, change nothing
reclaim prune   docker [--all]         [--yes]   build cache, dangling (or all unused) images
reclaim prune   caches [NAME ...]      [--yes]   each regenerable cache, through its own tool
reclaim prune   build  PATH ...        [--yes]   cargo target/ (CACHEDIR.TAG) or node_modules/
reclaim compact [--distro NAME]                  print the commands that shrink a WSL disk
```

`prune` is a dry run until `--yes`. `compact` only prints.

## 1. Scan first, and let it finish

```sh
reclaim scan            # human report; --json for the same data, structured
```

Under WSL the Windows folder walk runs in the background and takes a minute or
two; `--no-host` skips only that walk (drives and virtual disks are still
measured). Never start acting on half a scan: the biggest item is often on the
side you have not seen yet.

Every finding carries one of three kinds, and the kind decides who acts:

| Kind | Examples | Who decides |
| --- | --- | --- |
| **regenerable** | docker build cache, unused images, `uv`/`pip`/`npm`/`pnpm`/`bun`/`go` caches, cargo `target/`, `node_modules/`, host temp older than a week, recycle bin | the script, once the person has seen the total |
| **judgement** | git worktrees, docker volumes, downloaded models, gradle and cargo registries, emulator/VM images, the hibernation file, games, `Downloads` | the person, item by item |
| **needs root / elevation** | journal, OS package cache, Windows component store, `powercfg` | the person runs the printed command |

## 2. Report before touching anything

Lead with where the space is, not with a list of everything scanned: the two
or three items that explain most of the full disk, then the regenerable total,
then the judgement list. Give sizes, and for judgement items the facts that
make the decision easy — for a worktree, its branch, whether it is merged, how
many uncommitted files, how old.

Two facts routinely surprise people and are worth saying plainly:

- **Build output dominates developer machines.** One Rust worktree's
  `target/` is often 5–30 GB; twenty worktrees each with their own is the
  usual reason a home directory is huge.
- **A WSL virtual disk never shrinks on its own** unless it is sparse. Space
  freed inside the distro stays allocated on the host. The scan's
  "free inside, still held on the host" number is what compaction returns
  *today*; everything pruned in this session adds to it.

## 3. Prune the regenerable, with one confirmation

Show the dry run, get one yes for the batch, then run it:

```sh
reclaim prune docker           # add --all to also drop every image no container uses
reclaim prune caches           # or name them: reclaim prune caches uv pip
reclaim prune build <path> ... # paths taken from the scan
```

Choosing which build dirs to prune *is* a judgement, just a cheap one: a
`target/` in a worktree that is being built right now costs its owner a full
rebuild. Prefer, in order: build output of merged or abandoned worktrees, then
of repos not touched in weeks, then the rest. Never prune while a build is
running in that tree.

`--all` on docker and a volume prune are not regenerable — an image a stopped
container needs, or a volume holding a database, is data. Ask.

## 4. Judgement items: facts, not verdicts

For each, state what it is and what removing it costs, then let the person
choose. Rules that hold everywhere:

- **Worktrees.** "Merged" from the scan means the branch is an ancestor of the
  default branch. A squash- or rebase-merged branch reads as *open*; check the
  forge (`gh pr list --head <branch> --state merged`) before calling it
  abandoned. Any `dirty` count means uncommitted work. Remove through the tool
  that created the worktree (`git worktree remove`, or the orchestrator that
  owns it) so its bookkeeping stays consistent — never `rm -rf` a worktree.
- **Another tool's cache.** Use that tool's own clean/delete command — it
  knows its layout and its locks. `rm` is for build dirs only.
- **The host's system files.** The hibernation file, page file and component
  store are managed by Windows; each has a command (printed by the scan) and
  none is deleted by hand.
- **Personal files** (`Downloads`, videos, VM images, games) are only ever
  pointed at, never removed on the agent's initiative.

## 5. Rescan, then hand over compaction last

After pruning, run `reclaim scan --no-host` again and report what actually
changed. Then, under WSL:

```sh
reclaim compact
```

It prints the sequence with this machine's distro name and disk path filled
in: `fstrim` inside the distro, `wsl --shutdown`, a one-time
`wsl --manage <distro> --set-sparse true` if the disk is not sparse yet, and the
compaction itself: `Optimize-VHD -Mode Full` when the host has it (the Hyper-V
module, on Pro/Enterprise with Hyper-V enabled), `diskpart` otherwise. Both
give the same result; the script asks the host which one exists, so pass its
output through rather than swapping one for the other. **Print it; never run
it.** `wsl --shutdown` stops every distro, including the one this agent runs
in, and the compaction needs an elevated prompt on the host. End the session with those commands as the final thing the
person reads, plus the expected result (the scan's slack number).

A disk made sparse gives space back on its own from then on, so the manual
compaction is a one-time catch-up. If the setup is managed by dotfiles, making
new distros sparse by default (`sparseVhd=true` under `[experimental]` in the
host's `.wslconfig`) is a change for the `sync` skill, not a command to run
here.

## Guardrails

- **Nothing outside a known build dir is removed with `rm`.** `prune build`
  refuses any path that is not a cargo `target/` with `CACHEDIR.TAG` or a
  `node_modules/`, and that is deliberate.
- **Nothing is removed without the person having seen it.** The dry run is the
  confirmation surface; show it.
- **Never run `wsl --shutdown`, `diskpart`, `Optimize-VHD` or anything
  elevated from inside the session.** Print it.
- **Numbers from the machine, not from memory.** Rescan rather than
  subtracting estimates; `du`, `df` and the host's own view disagree for good
  reasons (sparse files, reserved blocks, hard links).
