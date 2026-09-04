#!/usr/bin/env bash
# Driver library for TUI recordings: the gestures a take is written in.
#
# A driver is a plain bash script that sources this file and calls these
# functions in the order the video should read. `tui-record take` runs it
# against a tmux session that holds the recorded pty.
#
# Two rules the whole library exists to enforce:
#
#   1. Nothing addresses the screen by a column typed in advance. A tab
#      strip shifts when a tab is added or renamed, a sidebar shifts when a
#      row appears; a coordinate is read from the frame that is on screen
#      right now, and read again after anything that could move it.
#   2. A beat that silently did nothing is worse than a failed take — the
#      next beat types a prompt into whatever has focus, and the recording
#      looks like the app misbehaving. Every gesture that can miss is
#      verified, and a take that loses one aborts (exit 3) so the runner
#      can retry it.

# bash only: the library defines one-letter helpers (`k`, `p`) that a zsh
# with an alias of the same name refuses to redefine, and the gestures rely
# on bash string slicing.
[ -n "${BASH_VERSION:-}" ] || {
  printf 'driver-lib.sh: source me from bash (the driver needs a bash shebang)\n' >&2
  return 1 2>/dev/null || exit 1
}

set -uo pipefail

: "${TUI_SESSION:=tuirec}"
: "${TUI_MARKS:=${TMPDIR:-/tmp}/tui-record-marks.txt}"

# Exit code the runner reads as "this take is spoiled, run it again".
TUI_ABORT=3

_die() { printf '%s\n' "$*" >&2; exit "$TUI_ABORT"; }

# ── reading the screen ───────────────────────────────────────────────────

pane() { tmux capture-pane -t "$TUI_SESSION" -p; }

# row_of TEXT [MIN_COL] [MAX_COL] -> "ROW COL" (1-based), "0 0" when absent.
#
# The column band is what keeps a sidebar row apart from a pane that says
# the same thing: a shell prompt reading "demo-app $" sits in the pane, the
# space called "demo-app" sits in the sidebar, and an unbanded search picks
# whichever comes first.
row_of() {
  pane | python3 -c '
import sys
text, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
for row, line in enumerate(sys.stdin.read().splitlines(), 1):
    col = line.find(text, lo - 1, hi)
    if col != -1:
        print(row, col + 1)
        break
else:
    print(0, 0)
' "$1" "${2:-1}" "${3:-9999}"
}

sidebar_row_of() { row_of "$1" 1 "${TUI_SIDEBAR_WIDTH:-31}"; }
pane_row_of()    { row_of "$1" $(( ${TUI_SIDEBAR_WIDTH:-31} + 1 )) 9999; }

# col_of GLYPH [ROW] [NTH] -> column of the NTH occurrence on ROW, 0 if none.
col_of() {
  pane | sed -n "${2:-1}p" | python3 -c '
import sys
line = sys.stdin.readline().rstrip("\n")
glyph, nth = sys.argv[1], int(sys.argv[2])
col = -1
for _ in range(nth):
    col = line.find(glyph, col + 1)
    if col == -1:
        break
print(col + 1 if col != -1 else 0)
' "$1" "${3:-1}"
}

# col_of_last GLYPH [ROW] — the rightmost occurrence. Toolbar buttons live
# at the right end of a strip whose tabs may carry the same glyph, so "the
# first ✦" is often the wrong ✦.
col_of_last() {
  pane | sed -n "${2:-1}p" | python3 -c '
import sys
print(sys.stdin.readline().rstrip("\n").rfind(sys.argv[1]) + 1)
' "$1"
}

# cell_of GLYPHS [MIN_COL] [MAX_COL] -> "ROW COL" of the first cell holding
# any of GLYPHS. For one-cell affordances — a status mark, a badge — where
# the target is the glyph itself rather than a label.
cell_of() {
  pane | python3 -c '
import sys
glyphs, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
for row, line in enumerate(sys.stdin.read().splitlines(), 1):
    for col, ch in enumerate(line[lo - 1:hi], lo):
        if ch in glyphs:
            print(row, col)
            raise SystemExit
print(0, 0)
' "$1" "${2:-1}" "${3:-9999}"
}

# The label of the active tab, read off the strip rather than assumed: the
# name an app gives a new tab depends on what the other tabs are called.
# Override TUI_TAB_PATTERN for a strip this regex does not fit.
: "${TUI_TAB_PATTERN:=^\\s*[✦●○*]\\s+(.+?)(?:\\s+[±⇧…!✕↑≡])?(?:\\s\\s|\\s*$)}"
active_tab_label() {
  pane | sed -n 1p | python3 -c '
import re, sys
line = sys.stdin.readline()
strip = line.split("│")[1] if "│" in line else line
m = re.match(sys.argv[1], strip)
print(m.group(1).strip() if m else "")
' "$TUI_TAB_PATTERN"
}

# ── gestures ─────────────────────────────────────────────────────────────

send() { tmux send-keys -t "$TUI_SESSION" "$@"; }
key()  { send "$@"; }
k()    { send "$@"; }

# Mouse, as SGR (1006) press/release written straight into the pty. A TUI
# that enables mouse reporting cannot tell this from a hand.
press() {
  local col="$1" row="$2" button="${3:-0}"
  send -l "$(printf '\033[<%d;%d;%dM' "$button" "$col" "$row")"
  sleep 0.07
  send -l "$(printf '\033[<%d;%d;%dm' "$button" "$col" "$row")"
}

# click COL ROW [LABEL] — a column of 0 means "not found", and clicking
# 0 + an offset lands in the top-left corner, which in most TUIs is a
# different screen. That mistake is silent, so it ends the take instead.
click() {
  local col="${1:-0}" row="${2:-1}" label="${3:-alvo}"
  [ "$col" -gt 0 ] 2>/dev/null || _die "click: $label is not on screen"
  press "$col" "$row"
}
rclick() {
  local col="${1:-0}" row="${2:-1}" label="${3:-alvo}"
  [ "$col" -gt 0 ] 2>/dev/null || _die "rclick: $label is not on screen"
  press "$col" "$row" 2
}
# A double-click has to survive the redraw the first click causes: select,
# let the frame settle, read the column again, then click twice.
dclick() {
  local col="${1:-0}" row="${2:-1}" label="${3:-alvo}"
  [ "$col" -gt 0 ] 2>/dev/null || _die "dclick: $label is not on screen"
  press "$col" "$row"
  sleep 0.11
  press "$col" "$row"
}

click_text() {  # click_text TEXT [COL_OFFSET] [MIN_COL] [MAX_COL]
  local text="$1" offset="${2:-2}" lo="${3:-1}" hi="${4:-9999}" row col
  read -r row col < <(row_of "$text" "$lo" "$hi")
  [ "$col" -gt 0 ] || _die "click_text: '$text' is not on screen"
  click $((col + offset)) "$row" "$text"
}

# ── typing ───────────────────────────────────────────────────────────────

# Human cadence: a fixed delay per character reads as a machine. The jitter
# is small on purpose — legibility first, realism second.
: "${TUI_TYPE_MIN:=0.026}"
: "${TUI_TYPE_JITTER:=0.040}"
type_raw() {
  local text="$1" i char delay
  for (( i = 0; i < ${#text}; i++ )); do
    char="${text:i:1}"
    send -l "$char"
    delay=$(awk -v seed=$RANDOM -v min="$TUI_TYPE_MIN" -v jit="$TUI_TYPE_JITTER" \
      'BEGIN { srand(seed); printf "%.3f", min + rand() * jit }')
    [ "$char" = " " ] && [ $((RANDOM % 7)) -eq 0 ] && delay=0.18
    sleep "$delay"
  done
}
type_line() { type_raw "$1"; sleep 0.4; send Enter; }
clear_field() { local n="${1:-0}" _; for _ in $(seq 1 "$n"); do send BSpace; sleep 0.045; done; }

# ── verification ─────────────────────────────────────────────────────────

# require LABEL PATTERN [TIMEOUT] — the screen must show PATTERN, or the
# take is spoiled. Use it after every gesture whose failure would be silent.
require() {
  local label="$1" pattern="$2" limit=$((SECONDS + ${3:-12}))
  until pane | grep -q -- "$pattern"; do
    [ "$SECONDS" -gt "$limit" ] && _die "beat lost: $label"
    sleep 0.4
  done
}
# Same, restricted to one row — a tab label matched anywhere on screen is
# not proof the tab was renamed.
require_row() {
  local label="$1" pattern="$2" row="${3:-1}" limit=$((SECONDS + ${4:-12}))
  until pane | sed -n "${row}p" | grep -q -- "$pattern"; do
    [ "$SECONDS" -gt "$limit" ] && _die "beat lost: $label"
    sleep 0.4
  done
}
refuse() {  # refuse LABEL PATTERN — the screen must NOT show PATTERN
  pane | grep -q -- "$2" && _die "unwanted state ($1): $2"
  return 0
}

# ── time ─────────────────────────────────────────────────────────────────

p() { sleep "$1"; }
mark() { printf '%s %s\n' "$1" "$(date +%s.%N)" >> "$TUI_MARKS"; }

# wait_span NAME TIMEOUT_S CONDITION... — waits for a shell condition and
# brackets it with marks, so `tui-record compress` can squeeze exactly this
# stretch out of the video. Everything a viewer should watch happens outside
# a span; everything that is just latency happens inside one.
wait_span() {
  local name="$1" timeout="${2:-120}" ; shift 2
  mark "${name}_start"
  local limit=$((SECONDS + timeout))
  until "$@"; do
    if [ "$SECONDS" -gt "$limit" ]; then
      mark "${name}_end"
      _die "wait_span($name): the condition never held within ${timeout}s"
    fi
    sleep 1
  done
  mark "${name}_end"
}

# The first beat: everything recorded before it is app startup, which
# `compress` collapses so the video opens on the app already there.
begin() { : > "$TUI_MARKS"; mark driver_start; p "${1:-1.0}"; }

# The last beat: marks the end, then quits the app the way a user would, so
# asciinema closes the file. `compress` cuts from the mark, which keeps the
# app's own exit — the write that blanks the screen — out of the video.
end_take() { mark driver_end; p "${2:-0.6}"; k "${1:-C-q}"; p 2.0; }
