#!/usr/bin/env python3
"""Type-check the Python this repository ships, one file per mypy run.

A skill's script has no `.py` extension, so mypy names it `__main__`, and two
of them in one run are a duplicate module. Checking each file on its own is
the only way to cover them all.

With file arguments (what lefthook passes: the staged files), only the ones
that are Python here are checked; with none, every one is.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def discover() -> list[Path]:
    scripts = [
        path
        for path in ROOT.glob("*/skills/*/scripts/*")
        if path.is_file() and not path.name.startswith(("_", "."))
    ]
    tooling = list((ROOT / ".github" / "scripts").glob("*.py"))
    return sorted(scripts + tooling)


def main(argv: list[str]) -> int:
    known = set(discover())
    if argv:
        targets = [p for p in (Path(a).resolve() for a in argv) if p in known]
    else:
        targets = sorted(known)
    failed = []
    for path in targets:
        shown = path.relative_to(ROOT).as_posix()
        result = subprocess.run(
            [sys.executable, "-m", "mypy", "--config-file", str(ROOT / "mypy.ini"), str(path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            failed.append(shown)
            sys.stdout.write(result.stdout)
            sys.stderr.write(result.stderr)
        else:
            print(f"ok  {shown}")
    if failed:
        print(f"\nmypy failed on {len(failed)} of {len(targets)}: {', '.join(failed)}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
