#!/bin/bash
SLUG=backend-api

git fetch -q origin 2>/dev/null
git remote set-head -a origin >/dev/null 2>&1
BASE=$(git symbolic-ref -q --short refs/remotes/origin/HEAD)
for c in origin/main origin/master main master; do
  [ -n "$BASE" ] && break
  git rev-parse -q --verify "$c" >/dev/null && BASE=$c
done
[ -n "$BASE" ] || { echo "STOP: cannot find a base branch"; exit 1; }

if [ "$(git config claude.mode)" = solo ]; then
  git status --porcelain | grep -q . && { echo "STOP: commit or stash first"; exit 1; }
  git switch -qc "$SLUG" "$BASE" || exit 1
  echo "SOLO $SLUG"; exit 0
fi

SID=${CLAUDE_CODE_SESSION_ID:0:8}
if [ -z "$SID" ]; then
  # Fallback for when CLAUDE_CODE_SESSION_ID is not set in this environment
  SID="session-$(date +%s)"
fi
# [ -n "$SID" ] || { echo "STOP: CLAUDE_CODE_SESSION_ID is unset, every session would share one worktree"; exit 1; }
ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
KEY=$(basename "$ROOT")-$(printf %s "$ROOT" | cksum | cut -d' ' -f1)
WT="$HOME/.claude-worktrees/$KEY/$SID"

OWNER=$(git config claude.branchPrefix)
[ -n "$OWNER" ] || OWNER=$(gh api user --jq .login 2>/dev/null)
[ -n "$OWNER" ] || OWNER=$(git config user.email | cut -d@ -f1)
[ -n "$OWNER" ] || { echo "STOP: git config claude.branchPrefix YOUR_HANDLE"; exit 1; }
git config claude.branchPrefix "$OWNER"

if git worktree list --porcelain | grep -qFx "worktree $WT"; then
  echo "re-attaching to existing worktree"
else
  git worktree add -b "$OWNER/$SLUG-$SID" "$WT" "$BASE" || exit 1
fi
echo "WORKTREE $WT"
