---
name: verify
description: Run the project's local quality gates (ESLint, Vitest, Cypress component tests, production build) and report a pass/fail summary. Pass `e2e` to also run the Cypress E2E suite against a local dev server. Use before committing, before opening a pull request, or when asked to check that a change is safe.
argument-hint: '[e2e] [all]'
model: haiku
context: fork
allowed-tools: Bash(npm run lint), Bash(npm run lint *), Bash(npm run vitest:run:fast), Bash(npm run vitest:run:fast *), Bash(npm run cy:run:ct), Bash(npm run cy:run:ct *), Bash(npm run build), Bash(npm run build *), Bash(tail *), Bash(grep *), Bash(git status *), Bash(git diff *), Bash(node .claude/skills/verify/changed-gates.mjs), Bash(node .claude/skills/verify/changed-gates.mjs *)
---

# Verify

Run the same checks CI runs, locally, so failures are caught before a push.

Arguments: `$ARGUMENTS`

## Steps

1. Run `node .claude/skills/verify/changed-gates.mjs` (append `all` if the arguments include `all`). It compares the branch, committed or not, with `main` and prints the gates the change can affect on its first line: some of `lint vitest ct build`, or `none`. A second line, `e2e advised: <reasons>`, appears when the change touches routing, pages, the store, Firebase services, route or API constants, or the E2E specs themselves. Do not second-guess it by reading the file list yourself.
    - If it prints `none` and `e2e` was not requested, reply that nothing `/verify` checks has changed (e.g. only docs, `.claude/` or `.github/`) and stop.
    - The advisory never runs E2E by itself — it only adds a line to the report (see below).
2. Run the gates it printed, in this order, continuing after a failure so the summary is complete. Report any it did not print as `⏭ skipped`:
    1. `lint` → `npm run lint`
    2. `vitest` → `npm run vitest:run:fast`
    3. `ct` → `npm run cy:run:ct`
    4. `build` → `npm run build`
    - Run all gates in a single Bash call (a `for` loop echoing each exit code), not one call per gate.
    - Keep output out of the conversation: redirect each gate to a log in the scratchpad (`> <scratchpad>/<gate>.log 2>&1`), note its exit code, and read only the tail of a passing log (pass counts) and the failing section of a failing one (`grep -n -A 15` on `FAIL`, `✖`, `error`)
3. Only if the arguments include `e2e`, run `node .claude/skills/verify/run-e2e.mjs` with a timeout of at least 10 minutes. It reuses a dev server already on port 3000 or starts one over HTTP (as CI does), runs `cypress run --e2e`, and always stops any server it started.
    - These tests log in and read/write the live Firebase project using the credentials in `.env`, which is why they are opt-in and the command asks for approval.
    - Never run `npm run cy:run:e2e` directly from this skill — without a server it fails on connection errors, not real bugs.
4. Do not fix anything unless the user asks; this skill reports, it does not change code.

## Report

Reply with a table, then details for anything that failed. Include the E2E row only when it was run:

| Gate                    | Result  | Notes                |
| ----------------------- | ------- | -------------------- |
| ESLint                  | ✅/❌/⏭ | error count          |
| Vitest                  | ✅/❌/⏭ | passed/total         |
| Cypress component tests | ✅/❌/⏭ | passed/total         |
| Build                   | ✅/❌/⏭ | any warnings of note |
| Cypress E2E             | ✅/❌   | passed/total         |

If the script printed `e2e advised` and `e2e` was not requested, end the report with: `E2E advised (<reasons>) — run \`/verify e2e\` before pushing, or leave it to CI on the PR.`

For each failure, quote the first relevant error (file, line, message) and say whether it is in a file touched by the current change. For E2E failures, also say whether the error looks environmental (server not reachable, Firebase auth or network) rather than a code regression.
