#!/usr/bin/env python3
"""Check commit subjects against Conventional Commits (the `git` plugin's
`commit` skill is the standard; this only refuses what is plainly not it).

    commit_msg.py <file>           a message file: lefthook's commit-msg hook, and
                                   CI's check of a PR title (the squash subject)
    commit_msg.py --range A..B     every commit in a range
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

TYPES = (
    "feat",
    "fix",
    "docs",
    "refactor",
    "perf",
    "test",
    "build",
    "ci",
    "chore",
    "style",
    "revert",
)
SUBJECT = re.compile(rf"^(?:{'|'.join(TYPES)})(?:\([a-z0-9][a-z0-9-]*\))?!?: \S.*$")
# Subjects git writes itself: let them through rather than fight the tool.
GENERATED = re.compile(r'^(?:Merge |Revert "|fixup! |squash! |amend! )')
MAX_SUBJECT = 100


def problem(subject: str) -> str | None:
    if GENERATED.match(subject):
        return None
    if not SUBJECT.match(subject):
        return f"not `<type>(<scope>)?: <subject>`, with <type> one of {', '.join(TYPES)}"
    if len(subject) > MAX_SUBJECT:
        return f"subject is {len(subject)} characters; keep it under {MAX_SUBJECT}"
    return None


def subject_of(message: str) -> str:
    for line in message.splitlines():
        if line.strip() and not line.startswith("#"):
            return line.rstrip()
    return ""


def subjects_in(span: str) -> list[tuple[str, str]]:
    git = shutil.which("git")
    if not git:
        sys.exit("git not found")
    out = subprocess.run(
        [git, "log", "--no-merges", "--format=%h%x00%s", span],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [tuple(line.split("\0", 1)) for line in out.splitlines() if line]  # type: ignore[misc]


def main(argv: list[str]) -> int:
    if len(argv) == 2 and argv[0] == "--range":
        checked = subjects_in(argv[1])
    elif len(argv) == 1:
        text = Path(argv[0]).read_text(encoding="utf-8")
        checked = [("message", subject_of(text))]
    else:
        print(__doc__)
        return 2
    bad = [(ref, subject, why) for ref, subject in checked if (why := problem(subject))]
    for ref, subject, why in bad:
        print(f"{ref}: {subject!r}\n  {why}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
