---
name: verify
description: Run the project's local quality gates (ESLint, Vitest, Cypress component tests, production build) and report a pass/fail summary. Pass `e2e` to also run the Cypress E2E suite against a local dev server. Use before committing, before opening a pull request, or when asked to check that a change is safe.
argument-hint: '[e2e] [all]'
model: haiku
context: fork
allowed-tools: Bash(npm run lint), Bash(npm run lint *), Bash(npm run vitest:run:fast), Bash(npm run vitest:run:fast *), Bash(npm run cy:run:ct), Bash(npm run cy:run:ct *), Bash(npm run build), Bash(npm run build *), Bash(tail *), Bash(grep *), Bash(git status *), Bash(git diff *), Bash(node .claude/skills/verify/changed-gates.mjs), Bash(node .claude/skills/verify/changed-gates.mjs *), Bash(node .claude/skills/verify/run-gates.mjs *)
---

# Verify

Run the same checks CI runs, locally, so failures are caught before a push.

Arguments: `$ARGUMENTS`

## Steps

1. Run `node .claude/skills/verify/changed-gates.mjs $ARGUMENTS`. It compares the branch, committed or not, with `main` and prints on its first line the arguments for the next step: some of `lint vitest ct build`, plus `e2e` when requested and `fresh` with `all` — or `none`. A second line, `e2e advised: <reasons>`, appears when E2E was not requested but the change touches routing, pages, the store, Firebase services, route or API constants, or the E2E specs. Do not second-guess it by reading the file list yourself.
    - If it prints `none`, reply that nothing `/verify` checks has changed (e.g. only docs, `.claude/` or `.github/`) and stop.
2. Run `node .claude/skills/verify/run-gates.mjs <first line, verbatim>` in one Bash call with `timeout: 600000`. Report any of `lint vitest ct build` it was not given as `⏭ skipped`.
    - The script runs the gates in order, continuing after a failure, writes each full log to `node_modules/.cache/verify/<gate>.log` and prints one line per gate: `pass <counts>`, `FAIL` followed by the first error lines, or `cached`.
    - `cached` means the gate already passed on a byte-identical working tree (committed, uncommitted and untracked files alike), so it was not run again. Any edit invalidates the cache.
    - If the call times out, run the identical command once more: gates that passed are cached, so only the rest run.
    - `e2e` runs `run-e2e.mjs`, which reuses a dev server on port 3000 or starts one over HTTP (as CI does) and always stops any server it started. These tests log in and read/write the live Firebase project using the credentials in `.env`, which is why they are opt-in. Never run `npm run cy:run:e2e` directly — without a server it fails on connection errors, not real bugs.
    - Do not run the npm scripts yourself or read the logs unless the printed error lines are not enough to name the failing file and message.
3. Do not fix anything unless the user asks; this skill reports, it does not change code.

## Report

Reply with a table, then details for anything that failed. Show a cached gate as `✅ cached`. Include the E2E row only when it was requested:

| Gate                    | Result  | Notes                |
| ----------------------- | ------- | -------------------- |
| ESLint                  | ✅/❌/⏭ | error count          |
| Vitest                  | ✅/❌/⏭ | passed/total         |
| Cypress component tests | ✅/❌/⏭ | passed/total         |
| Build                   | ✅/❌/⏭ | any warnings of note |
| Cypress E2E             | ✅/❌   | passed/total         |

If the script printed `e2e advised` and `e2e` was not requested, end the report with: `E2E advised (<reasons>) — run \`/verify e2e\` before pushing, or leave it to CI on the PR.`

For each failure, quote the first relevant error (file, line, message) and say whether it is in a file touched by the current change. For E2E failures, also say whether the error looks environmental (server not reachable, Firebase auth or network) rather than a code regression.
