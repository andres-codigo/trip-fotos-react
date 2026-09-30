---
name: verify
description: Run the project's local quality gates (ESLint, Vitest, Cypress component tests, production build) and report a pass/fail summary. Pass `e2e` to also run the Cypress E2E suite against a local dev server. Use before committing, before opening a pull request, or when asked to check that a change is safe.
argument-hint: '[e2e]'
allowed-tools: Bash(npm run lint), Bash(npm run vitest:run:fast), Bash(npm run cy:run:ct), Bash(npm run build), Bash(git status *), Bash(git diff *)
---

# Verify

Run the same checks CI runs, locally, so failures are caught before a push.

Arguments: `$ARGUMENTS`

## Steps

1. Run `git status --short` to note which files have changed, so failures can be tied back to the change.
2. Run each gate in order, continuing after a failure so the summary is complete:
    1. `npm run lint`
    2. `npm run vitest:run:fast`
    3. `npm run cy:run:ct`
    4. `npm run build`
3. Only if the arguments include `e2e`, run `node .claude/skills/verify/run-e2e.mjs` with a timeout of at least 10 minutes. It reuses a dev server already on port 3000 or starts one over HTTP (as CI does), runs `cypress run --e2e`, and always stops any server it started.
    - These tests log in and read/write the live Firebase project using the credentials in `.env`, which is why they are opt-in and the command asks for approval.
    - Never run `npm run cy:run:e2e` directly from this skill — without a server it fails on connection errors, not real bugs.
4. Do not fix anything unless the user asks; this skill reports, it does not change code.

## Report

Reply with a table, then details for anything that failed. Include the E2E row only when it was run:

| Gate                    | Result | Notes                |
| ----------------------- | ------ | -------------------- |
| ESLint                  | ✅/❌  | error count          |
| Vitest                  | ✅/❌  | passed/total         |
| Cypress component tests | ✅/❌  | passed/total         |
| Build                   | ✅/❌  | any warnings of note |
| Cypress E2E             | ✅/❌  | passed/total         |

For each failure, quote the first relevant error (file, line, message) and say whether it is in a file touched by the current change. For E2E failures, also say whether the error looks environmental (server not reachable, Firebase auth or network) rather than a code regression.
