#!/bin/sh
# Test suite for worktree-coordinator. POSIX sh only - run with `sh run.sh`
# (or `./run.sh`, since its shebang is /bin/sh too). No external frameworks.
#
# Every test operates inside a freshly created temp directory tree and never
# touches the repository this skill lives in. Fails fast on the first
# unexpected result and cleans up its own temp directories on exit.
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd -P)
WTC="$SCRIPT_DIR/../scripts/worktree-coordinator"
[ -x "$WTC" ] || { echo "cannot find or execute $WTC" >&2; exit 1; }
command -v "${WORKTREE_COORDINATOR_WT:-wt}" >/dev/null 2>&1 || {
	echo "worktrunk ('wt') is required to run this suite (create/remove depend on it)." >&2
	echo "Install it first: https://worktrunk.dev (e.g. 'cargo install worktrunk')." >&2
	exit 1
}

TESTROOT=$(mktemp -d "${TMPDIR:-/tmp}/wtc-tests.XXXXXX")
cleanup() { rm -rf "$TESTROOT"; }
trap cleanup EXIT INT TERM

STEP=0
step() { STEP=$((STEP + 1)); printf '\n[%02d] %s\n' "$STEP" "$1"; }
ok() { printf '  ok - %s\n' "$1"; }
fail() {
	printf '  FAIL - %s\n' "$1" >&2
	[ -s "$TESTROOT/.out" ] && { echo '  --- stdout ---' >&2; sed 's/^/  /' "$TESTROOT/.out" >&2; }
	[ -s "$TESTROOT/.err" ] && { echo '  --- stderr ---' >&2; sed 's/^/  /' "$TESTROOT/.err" >&2; }
	exit 1
}

# run DESC WANT_RC -- cmd...   (WANT_RC may be "any-nonzero")
run() {
	desc=$1 want=$2
	shift 2
	[ "${1:-}" = "--" ] && shift
	set +e
	"$@" >"$TESTROOT/.out" 2>"$TESTROOT/.err"
	got=$?
	set -e
	if [ "$want" = "any-nonzero" ]; then
		[ "$got" -ne 0 ] || fail "$desc (expected non-zero rc, got 0)"
	else
		[ "$got" -eq "$want" ] || fail "$desc (expected rc=$want, got rc=$got)"
	fi
	ok "$desc (rc=$got)"
}

out_has() {
	grep -q -- "$1" "$TESTROOT/.out" || fail "expected stdout to contain: $1"
}
err_has() {
	grep -q -- "$1" "$TESTROOT/.err" || fail "expected stderr to contain: $1"
}

new_repo() {
	name=$1
	dir="$TESTROOT/$name"
	mkdir -p "$dir"
	(
		cd "$dir"
		git init -q
		git config user.email "test@example.com"
		git config user.name "Test"
		echo init > f.txt
		git add f.txt
		git commit -q -m init
	)
	REPO=$dir
}

# porcelain_path_for_agent REPO AGENT - resolves one agent's worktree path
# out of a multi-record `list --porcelain` listing (blank-line-separated
# key=value records), regardless of how many other claims are active.
porcelain_path_for_agent() {
	repo=$1 agent=$2
	( cd "$repo" && "$WTC" list --porcelain ) | awk -v want="agent=$agent" '
		/^$/ {
			if (!found && matched && path != "") { print path; found = 1 }
			matched = 0; path = ""
		}
		$0 == want { matched = 1 }
		/^path=/ { if (matched) { sub(/^path=/, ""); path = $0 } }
		END { if (!found && matched && path != "") print path }
	'
}

# ============================================================ 1 ==========
step "1: running outside a git repository is rejected cleanly"
OUTSIDE="$TESTROOT/not-a-repo"
mkdir -p "$OUTSIDE"
( cd "$OUTSIDE" && run "create outside a repo fails" any-nonzero -- "$WTC" create --task t --agent a )
err_has "not inside a git repository"
( cd "$OUTSIDE" && run "doctor still runs outside a repo (rc=0, informational)" 0 -- "$WTC" doctor )
out_has "not currently inside a git repository"

# ============================================================ 2/3/4 ======
step "2/3/4: successful create - exclusive branch, worktree outside main checkout"
new_repo repoA
( cd "$REPO" && run "create succeeds" 0 -- "$WTC" create --task demo --agent agentA )
out_has "branch: agents/agentA/demo"
WT_A=$( cd "$REPO" && "$WTC" list --porcelain | sed -n 's/^path=//p' | head -n1 )
[ -n "$WT_A" ] || fail "could not determine created worktree path"
case $WT_A in
	"$REPO"|"$REPO"/*) fail "worktree path is inside the main checkout: $WT_A" ;;
esac
[ -d "$WT_A" ] || fail "worktree directory does not exist: $WT_A"
( cd "$REPO" && git show-ref --verify --quiet "refs/heads/agents/agentA/demo" ) || fail "branch was not created"
ok "branch is exclusive and worktree lives outside the main checkout"

step "2b: a second create for the same agent+task picks a distinct, predictable branch"
( cd "$REPO" && run "release first claim so the same agent can create again" 0 -- "$WTC" release --agent agentA )
( cd "$REPO" && run "create again with the same task after release" 0 -- "$WTC" create --task demo --agent agentA )
out_has "branch: agents/agentA/demo-1"
( cd "$REPO" && "$WTC" release --agent agentA >/dev/null )

# ============================================================ 5/6/7 ======
step "5/6/7: claim semantics - success, idempotent re-claim, conflicting claim"
( cd "$REPO" && git worktree add -q -b manual-branch "$TESTROOT/manual-wt" HEAD )
( cd "$REPO" && run "claim an existing, unmanaged worktree" 0 -- "$WTC" claim --agent agentX --path "$TESTROOT/manual-wt" )
( cd "$REPO" && run "re-claiming the same path by the same agent is idempotent" 0 -- "$WTC" claim --agent agentX --path "$TESTROOT/manual-wt" )
( cd "$REPO" && run "a second, different agent cannot claim the same worktree" any-nonzero -- "$WTC" claim --agent agentY --path "$TESTROOT/manual-wt" )
err_has "already claimed by agent 'agentX'"
( cd "$REPO" && run "agentX cannot claim a second, different path while holding one" any-nonzero -- "$WTC" create --task other --agent agentX )
err_has "already holds an active worktree claim"
( cd "$REPO" && "$WTC" release --agent agentX >/dev/null )

# ============================================================ 8/9 ========
step "8/9: verify rejects the wrong agent and the wrong directory"
( cd "$REPO" && run "create for agentB" 0 -- "$WTC" create --task feat --agent agentB )
WT_B=$( cd "$REPO" && "$WTC" list --porcelain | sed -n 's/^path=//p' | head -n1 )
[ -n "$WT_B" ] || fail "could not resolve agentB worktree path"
( cd "$WT_B" && run "another agent cannot verify agentB's worktree" any-nonzero -- "$WTC" verify --agent agentC )
err_has "no active claim for agent 'agentC'"
( cd "$REPO" && run "verify from the main checkout for the right agent still fails (wrong directory)" any-nonzero -- "$WTC" verify --agent agentB )
err_has "claimed for a different worktree"

# ============================================================ 10 =========
step "10: verify rejects a branch that changed after the claim"
( cd "$WT_B" && git checkout -q -b agentB-side-branch )
( cd "$WT_B" && run "verify fails when the checked-out branch no longer matches the claim" any-nonzero -- "$WTC" verify --agent agentB )
err_has "branch mismatch"
( cd "$WT_B" && git checkout -q agents/agentB/feat )
( cd "$WT_B" && git branch -q -D agentB-side-branch )
( cd "$WT_B" && run "verify succeeds again once back on the claimed branch" 0 -- "$WTC" verify --agent agentB )

# ============================================================ 11 =========
step "11: linked worktree has .git as a FILE, not a directory"
[ -f "$WT_B/.git" ] || fail "expected $WT_B/.git to be a regular file (linked worktree)"
[ ! -d "$WT_B/.git" ] || fail "$WT_B/.git must not be a directory"
ok ".git is a file in the linked worktree, as expected"

# ============================================================ 12 =========
step "12: worktree path containing spaces is handled safely"
( cd "$REPO" && git worktree add -q -b "spacey-branch" "$TESTROOT/space path here" HEAD )
( cd "$REPO" && run "claim succeeds against a path containing spaces" 0 -- "$WTC" claim --agent agentSpace --path "$TESTROOT/space path here" )
( cd "$TESTROOT/space path here" && run "verify succeeds from a path containing spaces" 0 -- "$WTC" verify --agent agentSpace )
( cd "$REPO" && "$WTC" release --agent agentSpace >/dev/null )

# ============================================================ 13/14 ======
step "13/14: invalid identifiers and traversal are rejected before touching git"
( cd "$REPO" && run "task with a path separator is rejected" any-nonzero -- "$WTC" create --task "../escape" --agent agentA )
err_has "outside \[A-Za-z0-9._-\]"
( cd "$REPO" && run "task with an embedded .. traversal is rejected" any-nonzero -- "$WTC" create --task "a..b" --agent agentA )
err_has "must not contain '..'"
( cd "$REPO" && run "agent starting with '-' is rejected" any-nonzero -- "$WTC" create --task ok --agent "-x" )
( cd "$REPO" && run "agent with a slash is rejected" any-nonzero -- "$WTC" create --task ok --agent "a/b" )
( cd "$REPO" && run "task with a space is rejected" any-nonzero -- "$WTC" create --task "has space" --agent agentA )
( cd "$REPO" && run "empty agent is rejected" any-nonzero -- "$WTC" verify --agent "" )

# ============================================================ 15/16 ======
step "15/16: interruption during create leaves recoverable state, never touches pre-existing data"
new_repo repoB
( cd "$REPO" && run "create+claim agentPre so it holds pre-existing data" 0 -- "$WTC" create --task keep --agent agentPre )
PRE_INFO_BEFORE=$( cd "$REPO" && "$WTC" list --porcelain )
COMMONDIR_B=$( cd "$REPO" && git rev-parse --git-common-dir )
COMMONDIR_B=$( cd "$REPO" && cd "$COMMONDIR_B" && pwd -P )
LOCKDIR_B="$COMMONDIR_B/agent-worktrees/.lock"

# SIGKILL cannot be trapped: this is the realistic "interruption" case,
# where nothing runs claim_write and the registry lock is left held.
( cd "$REPO" && WTC_TEST_DELAY_AFTER_ADD=1 exec "$WTC" create --task interrupted --agent agentInterrupt ) \
	>"$TESTROOT/.bg.out" 2>"$TESTROOT/.bg.err" &
BGPID=$!
i=0
while [ ! -d "$LOCKDIR_B" ] && [ "$i" -lt 50 ]; do sleep 0.1; i=$((i + 1)); done
[ -d "$LOCKDIR_B" ] || fail "expected the registry lock to be held during the delayed create"
kill -KILL "$BGPID" 2>/dev/null || true
wait "$BGPID" 2>/dev/null || true

PRE_INFO_AFTER=$( cd "$REPO" && "$WTC" list --porcelain )
[ "$PRE_INFO_BEFORE" = "$PRE_INFO_AFTER" ] || fail "pre-existing agentPre claim was disturbed by an unrelated, SIGKILLed create"
ok "pre-existing claim untouched by a concurrent, SIGKILLed create"

[ -d "$LOCKDIR_B" ] || fail "expected the lock to remain (SIGKILL cannot be trapped) - this is the diagnosable partial-failure state"
( cd "$REPO" && run "the tool refuses to proceed while the lock is held, rather than corrupting the registry" any-nonzero -- "$WTC" release --agent agentPre )
ok "orphaned lock is diagnosable (doctor/list keep working; mutating commands refuse)"

# Documented manual recovery procedure, applied here exactly as printed
# by the tool's own error/doctor output.
rm -f "$LOCKDIR_B/owner"
rmdir "$LOCKDIR_B"
( cd "$REPO" && run "normal operation resumes after the documented manual recovery" 0 -- "$WTC" release --agent agentPre )
( cd "$REPO" && git worktree list --porcelain | grep -q "agents/agentInterrupt/interrupted" ) \
	&& ok "the orphaned (unclaimed) worktree from the killed create is still visible to git - nothing was silently discarded" \
	|| fail "expected git to still know about the worktree created just before the SIGKILL"

# ============================================================ 17/18/19 ===
step "17/18/19: finish reports and gates on uncommitted / untracked / committed state"
new_repo repoC
( cd "$REPO" && "$WTC" create --task work --agent agentF >/dev/null )
WT_F=$( cd "$REPO" && "$WTC" list --porcelain | sed -n 's/^path=//p' | head -n1 )

echo dirty >> "$WT_F/f.txt"
( cd "$WT_F" && run "finish refuses with uncommitted tracked changes (exit 2)" 2 -- "$WTC" finish --agent agentF )
out_has "NOT READY"
( cd "$WT_F" && git checkout -q -- f.txt )

echo new > "$WT_F/untracked.txt"
( cd "$WT_F" && run "finish refuses with untracked files (exit 2)" 2 -- "$WTC" finish --agent agentF )
out_has "NOT READY"
( cd "$WT_F" && run "finish --report never fails, even when dirty" 0 -- "$WTC" finish --agent agentF --report )
out_has "report-only"
rm -f "$WT_F/untracked.txt"
echo "agentF change" >> "$WT_F/f.txt"
( cd "$WT_F" && git add -A && git commit -q -m "agentF work" )
( cd "$WT_F" && run "finish succeeds after a commit, clean tree" 0 -- "$WTC" finish --agent agentF )
out_has "READY FOR INTEGRATION"

# ============================================================ 20/21 ======
step "20/21: remove refuses a dirty worktree; a clean one delegates branch safety to wt"
echo dirty2 >> "$WT_F/f.txt"
( cd "$REPO" && run "remove refuses a dirty worktree" any-nonzero -- "$WTC" remove --agent agentF )
err_has "not clean"
[ -d "$WT_F" ] || fail "dirty worktree was removed despite the refusal"
( cd "$WT_F" && git checkout -q -- f.txt )

# Clean but unmerged: worktree is removed, branch is retained by default
# (wt's own integration check - not lost, just not checked out anywhere).
( cd "$REPO" && "$WTC" create --task retain --agent agentK >/dev/null )
WT_K=$(porcelain_path_for_agent "$REPO" agentK)
[ -n "$WT_K" ] || fail "could not resolve agentK worktree path"
echo "real change" >> "$WT_K/f.txt"
( cd "$WT_K" && git add -A && git commit -q -m "agentK unmerged work" )
( cd "$REPO" && run "remove (default) succeeds on a clean, unmerged worktree" 0 -- "$WTC" remove --agent agentK )
[ -d "$WT_K" ] && fail "worktree directory still exists after remove" || true
( cd "$REPO" && git show-ref --verify --quiet "refs/heads/agents/agentK/retain" ) \
	|| fail "branch was deleted despite being unmerged - default remove must retain it"
ok "unmerged branch retained automatically after its worktree was removed"

# --confirm-unmerged force-deletes an unmerged branch (maps to `wt remove -D`).
# Re-attach a worktree to the still-retained branch and claim it again so
# `remove` has a registry entry to work from.
( cd "$REPO" && git worktree add -q "$TESTROOT/reattach-K" agents/agentK/retain )
( cd "$REPO" && run "claim the retained branch's worktree again" 0 -- "$WTC" claim --agent agentK --path "$TESTROOT/reattach-K" )
( cd "$REPO" && run "remove --confirm-unmerged force-deletes it" 0 -- "$WTC" remove --agent agentK --confirm-unmerged )
( cd "$REPO" && git show-ref --verify --quiet "refs/heads/agents/agentK/retain" ) \
	&& fail "branch still exists after --confirm-unmerged" || true
ok "--confirm-unmerged force-deletes an unmerged branch"

# Merge, then remove with no flags: now-integrated branch is auto-deleted.
( cd "$REPO" && git merge -q --no-ff agents/agentF/work -m "merge agentF" )
( cd "$REPO" && run "remove (default) succeeds on a clean, merged worktree" 0 -- "$WTC" remove --agent agentF )
[ -d "$WT_F" ] && fail "worktree directory still exists after remove" || true
( cd "$REPO" && git show-ref --verify --quiet "refs/heads/agents/agentF/work" ) && fail "branch still exists after default remove of a merged branch" || true
ok "clean, merged worktree and its branch were both removed automatically"

# --keep-branch preserves the branch even when it would be safe to delete.
( cd "$REPO" && "$WTC" create --task keepme --agent agentN >/dev/null )
( cd "$REPO" && run "remove --keep-branch preserves an otherwise-safe-to-delete branch" 0 -- "$WTC" remove --agent agentN --keep-branch )
( cd "$REPO" && git show-ref --verify --quiet "refs/heads/agents/agentN/keepme" ) \
	|| fail "branch was deleted despite --keep-branch"
ok "--keep-branch preserves the branch regardless of merge status"
( cd "$REPO" && git branch -q -D agents/agentN/keepme )

# ============================================================ 22 =========
step "22: remove refuses to touch the main checkout, even via a hand-crafted registry entry"
new_repo repoD
COMMONDIR_D=$( cd "$REPO" && git rev-parse --git-common-dir )
COMMONDIR_D=$( cd "$REPO" && cd "$COMMONDIR_D" && pwd -P )
MAIN_BRANCH_D=$( cd "$REPO" && git symbolic-ref --short HEAD )
mkdir -p "$COMMONDIR_D/agent-worktrees/claims/by-agent/agentEvil"
{
	echo "agent=agentEvil"
	echo "task=x"
	echo "branch=$MAIN_BRANCH_D"
	echo "path=$REPO"
	echo "base=HEAD"
	echo "common_dir=$COMMONDIR_D"
	echo "created=0"
	echo "pid=0"
	echo "locked=no"
} > "$COMMONDIR_D/agent-worktrees/claims/by-agent/agentEvil/info"
mkdir -p "$COMMONDIR_D/agent-worktrees/claims/by-path"
PHASH=$(printf '%s' "$REPO" | cksum | awk '{print $1}')
mkdir -p "$COMMONDIR_D/agent-worktrees/claims/by-path/p_$PHASH"
cp "$COMMONDIR_D/agent-worktrees/claims/by-agent/agentEvil/info" "$COMMONDIR_D/agent-worktrees/claims/by-path/p_$PHASH/info"
( cd "$REPO" && run "remove refuses a registry entry pointing at the main checkout" any-nonzero -- "$WTC" remove --agent agentEvil )
err_has "MAIN checkout"
[ -d "$REPO/.git" ] || fail "main checkout .git vanished - this must never happen"
rm -rf "$COMMONDIR_D/agent-worktrees/claims/by-agent/agentEvil" "$COMMONDIR_D/agent-worktrees/claims/by-path/p_$PHASH"

# ============================================================ 23 =========
step "23: remove refuses a --path that does not match the registered claim"
new_repo repoE
( cd "$REPO" && "$WTC" create --task t1 --agent agentG >/dev/null )
mkdir -p "$TESTROOT/unrelated-dir"
( cd "$REPO" && run "remove refuses a --path outside the registry" any-nonzero -- "$WTC" remove --agent agentG --path "$TESTROOT/unrelated-dir" )
err_has "does not match the registered claim"
( cd "$REPO" && "$WTC" release --agent agentG >/dev/null )

# ============================================================ 24 =========
step "24: a stale registry lock is reported explicitly, never silently broken"
new_repo repoF
COMMONDIR_F=$( cd "$REPO" && git rev-parse --git-common-dir )
COMMONDIR_F=$( cd "$REPO" && cd "$COMMONDIR_F" && pwd -P )
mkdir -p "$COMMONDIR_F/agent-worktrees/.lock"
{
	echo "pid=999999"
	echo "host=nowhere"
	echo "time=1"
} > "$COMMONDIR_F/agent-worktrees/.lock/owner"
( cd "$REPO" && run "an operation needing the lock reports the stale lock and refuses to proceed" any-nonzero -- "$WTC" create --task t --agent agentH )
err_has "stale"
err_has "rmdir"
[ -d "$COMMONDIR_F/agent-worktrees/.lock" ] || fail "stale lock must not be silently removed by the tool itself"
rm -rf "$COMMONDIR_F/agent-worktrees/.lock"
( cd "$REPO" && run "works normally again once the stale lock is manually cleared" 0 -- "$WTC" create --task t --agent agentH )
( cd "$REPO" && "$WTC" release --agent agentH >/dev/null )

# ============================================================ 25 =========
step "25: prune defaults to dry-run and never deletes metadata on its own"
new_repo repoG
( cd "$REPO" && "$WTC" create --task t --agent agentI >/dev/null )
WT_I=$( cd "$REPO" && "$WTC" list --porcelain | sed -n 's/^path=//p' | head -n1 )
rm -rf "$WT_I"
BEFORE_COUNT=$( cd "$REPO" && "$WTC" list --porcelain | grep -c '^agent=' || true)
( cd "$REPO" && run "prune with no flags is a dry-run" 0 -- "$WTC" prune )
out_has "dry-run"
AFTER_COUNT=$( cd "$REPO" && "$WTC" list --porcelain | grep -c '^agent=' || true)
[ "$BEFORE_COUNT" -eq "$AFTER_COUNT" ] || fail "prune without --apply changed the registry"
( cd "$REPO" && run "prune --dry-run is explicit but equivalent to the default" 0 -- "$WTC" prune --dry-run )
AFTER_COUNT2=$( cd "$REPO" && "$WTC" list --porcelain | grep -c '^agent=' || true)
[ "$BEFORE_COUNT" -eq "$AFTER_COUNT2" ] || fail "prune --dry-run changed the registry"
ok "registry metadata for a missing directory survives dry-run prune"

# ============================================================ 26 =========
step "26: two concurrent claims on the same worktree - exactly one wins"
new_repo repoH
( cd "$REPO" && git worktree add -q -b race-branch "$TESTROOT/race-wt" HEAD )
(
	cd "$REPO"
	set +e
	"$WTC" claim --agent racerA --path "$TESTROOT/race-wt" >"$TESTROOT/.race1.out" 2>"$TESTROOT/.race1.err"
	echo $? > "$TESTROOT/.race1.rc"
) &
R1=$!
(
	cd "$REPO"
	set +e
	"$WTC" claim --agent racerB --path "$TESTROOT/race-wt" >"$TESTROOT/.race2.out" 2>"$TESTROOT/.race2.err"
	echo $? > "$TESTROOT/.race2.rc"
) &
R2=$!
wait "$R1" 2>/dev/null || true
wait "$R2" 2>/dev/null || true
RC1=$(cat "$TESTROOT/.race1.rc")
RC2=$(cat "$TESTROOT/.race2.rc")
if [ "$RC1" -eq 0 ] && [ "$RC2" -eq 0 ]; then
	fail "both concurrent claims for the same worktree succeeded - atomicity violated"
fi
if [ "$RC1" -ne 0 ] && [ "$RC2" -ne 0 ]; then
	fail "both concurrent claims for the same worktree failed - expected exactly one winner"
fi
ok "exactly one of the two concurrent claims succeeded (rc1=$RC1 rc2=$RC2)"
WINNER_COUNT=$( cd "$REPO" && "$WTC" list --porcelain | grep -c "^path=$TESTROOT/race-wt$" || true )
[ "$WINNER_COUNT" -eq 1 ] || fail "expected exactly one registry record for the raced worktree, found $WINNER_COUNT"
( cd "$REPO" && "$WTC" release --agent racerA >/dev/null 2>&1 || true )
( cd "$REPO" && "$WTC" release --agent racerB >/dev/null 2>&1 || true )

# ============================================================ 27 =========
step "27: exit codes and messages are meaningful across the board"
( cd "$REPO" && run "unknown command exits non-zero" any-nonzero -- "$WTC" bogus-command )
err_has "unknown command"
( cd "$REPO" && run "missing required --agent exits non-zero" any-nonzero -- "$WTC" verify )
err_has "--agent is required"
run "no arguments at all prints usage and exits non-zero" 1 -- "$WTC"
ok "spot-checked exit codes and error text"

# ============================================================ 28 =========
step "28: runs correctly under /bin/sh, no implicit bash"
[ "$(head -n1 "$WTC")" = "#!/bin/sh" ] || fail "shebang is not exactly #!/bin/sh"
new_repo repoI
( cd "$REPO" && run "explicit 'sh worktree-coordinator doctor' works" 0 -- sh "$WTC" doctor )
if command -v dash >/dev/null 2>&1; then
	( cd "$REPO" && run "explicit 'dash worktree-coordinator doctor' works" 0 -- dash "$WTC" doctor )
fi
# Note: `$((...))` (POSIX arithmetic expansion) is intentionally not
# flagged; only a bare `((` compound command (a bash-only construct) is.
# `local` is only flagged as a leading statement keyword, not as English
# prose inside a quoted diagnostic message. `[[` is only flagged when
# followed by whitespace (a real bash test), not `[[:space:]]`/`[[:alpha:]]`/
# etc. POSIX bracket-expression character classes, which always continue
# with `:`, `.`, or `=` instead.
if grep -nE '\[\[[[:space:]]|\bfunction \w|^[[:space:]]*local\b|(^|[^$])\(\(|=~' "$WTC" >"$TESTROOT/.bashisms" 2>/dev/null; then
	if [ -s "$TESTROOT/.bashisms" ]; then
		cat "$TESTROOT/.bashisms" >&2
		fail "found likely bashisms in $WTC"
	fi
fi
ok "no obvious bashisms found; script runs correctly under sh/dash"

# ============================================================ 29 =========
step "29: create/remove fail clearly (not silently) when worktrunk is missing"
new_repo repoJ
( cd "$REPO" && run "create fails cleanly without wt on PATH" any-nonzero -- env WORKTREE_COORDINATOR_WT=wt-does-not-exist-anywhere "$WTC" create --task t --agent agentZ )
err_has "worktrunk"
err_has "not found on PATH"
[ -z "$(porcelain_path_for_agent "$REPO" agentZ)" ] || fail "a claim was registered despite wt being unavailable"
ok "missing worktrunk is reported clearly, with no partial registry state"

echo
echo "ALL $STEP TEST GROUPS PASSED"
