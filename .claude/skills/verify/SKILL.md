---
name: verify
description: Run the project's local quality gates (ESLint, Vitest, Cypress component tests, production build) and report a pass/fail summary. Use before committing, before opening a pull request, or when asked to check that a change is safe.
allowed-tools: Bash(npm run lint), Bash(npm run vitest:run:fast), Bash(npm run cy:run:ct), Bash(npm run build), Bash(git status *), Bash(git diff *)
---

# Verify

Run the same checks CI runs, locally, so failures are caught before a push.

## Steps

1. Run `git status --short` to note which files have changed, so failures can be tied back to the change.
2. Run each gate in order, continuing after a failure so the summary is complete:
    1. `npm run lint`
    2. `npm run vitest:run:fast`
    3. `npm run cy:run:ct`
    4. `npm run build`
3. Do not run `npm run cy:run:e2e` — it needs live Firebase credentials and is left to CI.
4. Do not fix anything unless the user asks; this skill reports, it does not change code.

## Report

Reply with a table, then details for anything that failed:

| Gate                    | Result | Notes                |
| ----------------------- | ------ | -------------------- |
| ESLint                  | ✅/❌  | error count          |
| Vitest                  | ✅/❌  | passed/total         |
| Cypress component tests | ✅/❌  | passed/total         |
| Build                   | ✅/❌  | any warnings of note |

For each failure, quote the first relevant error (file, line, message) and say whether it is in a file touched by the current change.
