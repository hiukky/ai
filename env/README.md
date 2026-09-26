# env

A machine is a build product of its dotfiles repo, not a place where things
accumulate. Installing or configuring anything means writing it into the
chezmoi source and letting `chezmoi apply` perform it; `add` and `re-add` are
an import path for what already happened, not a workflow to plan around.

- `sync` — classify a change by kind, write it into the source, apply it
- `reclaim` — find what fills the disks, prune what regenerates, print how to shrink a WSL disk

The skill reads the setup in front of it before changing anything — where the
source is, which provisioning lanes exist, what the source's own docs say,
which package and version managers it actually uses — and that setup's
conventions win over anything written in the skill. It names no package
manager of its own.

Auditing sync means four axes: machine vs source, source vs committed,
committed vs pushed, and installed vs never provisioned. Only three of them
have a command; the fourth is why a fresh machine comes out different.

`reclaim` splits measuring and removing, which are deterministic, from
choosing, which is not. Its script (`skills/reclaim/scripts/reclaim`) scans the
Linux side, the WSL virtual disks and the Windows host in one pass, prunes only
what a tool rebuilds on its own (docker build cache, package-manager caches,
cargo `target/`, `node_modules/`), and returns everything else — worktrees,
models, volumes, VM images — as a list for a person to decide. Compacting a WSL
disk means stopping WSL, so that part is printed, never run.

```bash
uze install env@ai -m   # machine-wide, which is the only scope that makes sense here
```
