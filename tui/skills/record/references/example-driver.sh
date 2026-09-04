#!/usr/bin/env bash
# A complete take, as a driver. Copy it next to your sandbox and rewrite the
# beats; the shape is what matters:
#
#   begin → gestures, each verified → wait_span around real latency →
#   one screen that shows breadth → quit the app
#
# Run through the runner, never directly — it owns the recording:
#
#   tui-record take --driver ./drive.sh --out demo.cast \
#     --cols 140 --rows 36 --title "demo" --reset ./reset.sh -- ./launch.sh

source "${SKILL_DIR:?point SKILL_DIR at the record skill}/scripts/driver-lib.sh"

PROJECT=/tmp/demos/demo-app          # the sandbox project this take drives
SIDEBAR=31                           # column where the sidebar ends
TUI_SIDEBAR_WIDTH=$SIDEBAR

# ── the app is already open; everything before this is startup ───────────
begin 1.0

# ── it is a real terminal on a real project ──────────────────────────────
type_line "git log --oneline -4"; p 2.2

# ── rename what the app named for you ────────────────────────────────────
read -r row col < <(sidebar_row_of "demo-app")
[ "$col" -gt 0 ] || { echo "the project row is missing" >&2; exit 3; }
dclick $((col + 3)) "$row" "project row"
require_row "the name editor opened" "demo-app▏" "$row" 5
clear_field 8; type_raw "api"; p 0.3; k Enter; p 0.8

# ── create something, and name it too ────────────────────────────────────
click "$(col_of '✦' 1 1)" 1 "new-agent button"; p 1.0
read -r prow pcol < <(pane_row_of "new agent")
[ "$prow" -gt 0 ] || { echo "the picker did not open" >&2; exit 3; }
read -r crow ccol < <(row_of "Claude Code" "$pcol" 9999)
click $((ccol + 4)) "$crow" "picker row"
require "it started" "Claude Code v" 20; p 1.5

old=$(active_tab_label)                       # ask, never assume
c=$(col_of "$old" 1 1); click $((c + 1)) 1 "tab"; p 0.5
c=$(col_of "$old" 1 1); dclick $((c + 1)) 1 "tab"; p 0.6
require_row "the tab editor opened" "▏" 1 5
clear_field "${#old}"; type_raw "ping"; p 0.3; k Enter
require_row "the tab is renamed" "ping" 1 6; p 0.6

# ── ask it for something real ────────────────────────────────────────────
type_line "add a /ping route to src/router.rs that answers pong, then commit"
require "it took the request" "esc to interrupt" 20
p 1.6

# ── the latency belongs in a span, not in the video ──────────────────────
checkout=$(git -C "$PROJECT" worktree list | tail -1 | awk '{print $1}')
wait_span first_edit 120 sh -c "git -C '$checkout' status --porcelain | grep -q ."
p 1.5

# ── show the result ──────────────────────────────────────────────────────
for attempt in 1 2 3; do
  gc=$(col_of '/' 1 1)
  [ "$gc" -gt 0 ] && press "$gc" 1
  p 1.2
  pane | grep -q CHANGES || { k C-g; p 1.2; }
  pane | grep -q CHANGES || continue
  pane | grep -q "no changes" || break      # opened on a read taken too early
  k Escape; p 2.5
done
require "the diff is on screen" "CHANGES" 4
refuse "the diff is not empty" "no changes"
p 2.4; k Escape; p 0.8

# ── one screen that shows breadth ────────────────────────────────────────
click_text "Manage" 2 1 "$SIDEBAR"; p 1.4
for route in Plugins Extensions Integrations Profiles Overview; do
  click_text "$route" 2 1 "$SIDEBAR"; p 1.1
done
click_text "Work" 1 1 "$SIDEBAR"; p 1.2

# ── quit the way a user would, so asciinema writes the cast ──────────────
k C-q; p 2.0
