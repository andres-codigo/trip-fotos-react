#!/usr/bin/env bash
# Runs /parity-run one item per fresh Claude session, so context does not grow across items
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

STATE=.claude/parity/state.json
ALLOWED_TOOLS=(
	"Bash(git push -u origin feature/vue-parity)" "Bash(gh pr create *)"
	"Bash(node .claude/skills/verify/run-e2e.mjs*)" "Bash(gh issue *)"
	"Bash(gh project *)" "Bash(gh api graphql *)" "Bash(git checkout *)"
	"Bash(git switch *)" "Bash(git fetch *)" "Bash(git stash *)"
	"Bash(git add *)" "Bash(git commit *)" "Bash(test -f .env)"
)

run_claude() {
	claude -p "$1" --permission-mode acceptEdits --allowedTools "${ALLOWED_TOOLS[@]}"
}

pending_count() {
	node -e "const s=require('./$STATE');console.log(s.queue.filter((i)=>i.state==='pending').length)"
}

# Each session handles one item; the Stop hook would otherwise keep it going
export PARITY_FRESH_SESSIONS=1

# The first session audits and syncs the backlog, which writes the queue
if [[ ! -f $STATE ]]; then
	run_claude "/parity-run --one"
fi

pending=$(pending_count)
while ((pending > 0)); do
	run_claude "/parity-run --skip-audit --one"
	now=$(pending_count)
	if ((now >= pending)); then
		echo "No progress on the last item; stopping. See $STATE." >&2
		exit 1
	fi
	pending=$now
done

run_claude "/parity-run --skip-audit"
