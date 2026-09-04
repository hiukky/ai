#!/usr/bin/env bash
# A complete take, as a driver.
#
# The app here is invented — a TUI with a sidebar of items, a tab strip, a
# detail overlay and a settings screen — because the shape is what transfers,
# not the labels. Every string below ("Items", "Details", "Settings") is the
# app's own vocabulary and is the first thing you replace.
#
#   begin → gestures, each verified → wait_span around real latency →
#   one screen that shows breadth → end_take
#
# Run it through the runner, never directly — the runner owns the recording:
#
#   tui-record take --driver ./drive.sh --out demo.cast \
#     --cols 140 --rows 36 --title "demo" --reset ./reset.sh -- ./launch.sh

source "${SKILL_DIR:?point SKILL_DIR at the record skill}/scripts/driver-lib.sh"

FIXTURE=/tmp/demos/project          # the sandbox this take drives
TUI_SIDEBAR_WIDTH=31                # where the sidebar band ends

# Opening a thing inside the app: a picker row, then the proof that it
# actually came up. The proof is the opened thing's own first screen, so it
# is a parameter — a second kind of tool in the same take needs its own.
open_tool() {  # open_tool NTH_BUTTON PICKER_LABEL READY_PATTERN
  click "$(col_of '+' 1 "$1")" 1 "new-item button"; p 1.0
  read -r prow pcol < <(pane_row_of "new item")
  [ "$prow" -gt 0 ] || { echo "the picker did not open" >&2; exit 3; }
  read -r crow ccol < <(row_of "$2" "$pcol" 9999)
  [ "$ccol" -gt 0 ] || { echo "the picker has no $2 row" >&2; exit 3; }
  click $((ccol + 4)) "$crow" "$2"
  require "$2 started" "$3" 25
}

# ── the app is already open; everything before this is startup ───────────
begin 1.0

# ── it is a real terminal on a real project ──────────────────────────────
type_line "git log --oneline -4"; p 2.2

# ── rename what the app named for you ────────────────────────────────────
read -r row col < <(sidebar_row_of "project")
[ "$col" -gt 0 ] || { echo "the project row is missing" >&2; exit 3; }
dclick $((col + 3)) "$row" "project row"
require_row "the name editor opened" "project▏" "$row" 5
clear_field 7; type_raw "api"; p 0.3; k Enter; p 0.8

# ── create something, and name it too ────────────────────────────────────
open_tool 1 "Vendor A" "Vendor A v"; p 1.5

old=$(active_tab_label)                       # ask, never assume
c=$(col_of "$old" 1 1); click $((c + 1)) 1 "tab"; p 0.5
c=$(col_of "$old" 1 1); dclick $((c + 1)) 1 "tab"; p 0.6
require_row "the tab editor opened" "▏" 1 5
clear_field "${#old}"; type_raw "notes"; p 0.3; k Enter
require_row "the tab is renamed" "notes" 1 6; p 0.6

# ── ask it for something real ────────────────────────────────────────────
type_line "summarise this project in README.md"
require "it took the request" "esc to interrupt" 20
p 1.6

# ── what the app handed this tool: the panel at the right end of the strip
click "$(col_of_last '✦')" 1 "support panel"; p 0.9
require "the panel opened" "CAPABILITIES" 6
p 3.0; k Escape; p 0.8

# ── the latency belongs in a span, not in the video ──────────────────────
wait_span first_write 120 test -s "$FIXTURE/README.md"
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
require "the detail is on screen" "CHANGES" 4
refuse "the detail is not empty" "no changes"
p 2.4; k Escape; p 0.8

# ── a one-cell affordance: a status mark, and the legend behind it ───────
read -r mrow mcol < <(cell_of '±⇧!' 1 "$TUI_SIDEBAR_WIDTH")
[ "$mcol" -gt 0 ] || { echo "no status mark in the sidebar" >&2; exit 3; }
click "$mcol" "$mrow" "status mark"; p 1.0
require "the glyph legend opened" "uncommitted" 6
p 3.0; k Escape; p 0.8

# ── one screen that shows breadth ────────────────────────────────────────
click_text "Settings" 2 1 "$TUI_SIDEBAR_WIDTH"; p 1.8
for route in Sources Extensions Integrations Profiles Overview; do
  click_text "$route" 2 1 "$TUI_SIDEBAR_WIDTH"; p 1.6
done
click_text "Work" 1 1 "$TUI_SIDEBAR_WIDTH"; p 1.2

# ── mark the end, then quit: the cut stops here, so the app's own exit
#    (the write that blanks the screen) never reaches the video ───────────
end_take C-q
