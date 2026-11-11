---
name: verify
description: Run the project's local quality gates (ESLint, Vitest, Cypress component tests, production build, and a Prettier check of workflow YAML) and report a pass/fail summary. Pass `e2e` to force the Cypress E2E suite for any change; it runs on its own when the change touches routing, pages, the store, Firebase services or the E2E specs. Use before committing, before opening a pull request, or when asked to check that a change is safe.
argument-hint: '[e2e] [all]'
---

# Verify

Run the same checks CI runs, locally, so failures are caught before a push.

Arguments: `$ARGUMENTS`

## When

Once per commit, after every edit. For a UI change (`src/**/*.{jsx,css}`, tests aside) run `/ui-check` and its fixes first: the script refuses (exit 3) until `/ui-check` has recorded `pass`, and keeps that pass through later edits that touch no UI file. Never alongside the emulators, a `/ui-check` capture or another `/verify`: the script refuses to start then (exit 3) and says why; clear the clash, then run it again. If the code changes mid-run, the script says so at the end: run it again and never commit on that result.

## Steps

1. Run `node .claude/skills/verify/verify.mjs $ARGUMENTS` yourself, in one Bash call with `run_in_background: true`, and wait for the notification. Do not run the npm scripts or the gates by hand: the commit hook only accepts passes the script records.
    - It plans the gates from the branch's diff against `main`, then skips each gate that still holds: one that passed on this tree, or on an earlier one with no change since that the gate depends on (an edit to `.claude/**/*.mjs` re-runs only ESLint and Vitest). `all` runs every gate afresh; `e2e` adds the emulator E2E suite, which also runs on its own for routing, pages, the store, Firebase services, route or API constants, the Cypress config or the E2E specs. It runs the specs for the changed pages (`cypress/impact.js`) first and stops on their first failure, then the rest, and stops at once when the emulators crash.
    - It prints the finished table, then for each failure its first error lines and the full log path under `node_modules/.cache/verify/`. Read a log only when those lines do not name the failing file and message.
2. Relay the table as printed. For each failure, quote the first relevant error (file, line, message) and say whether it is in a file the change touches; for E2E, also whether it looks environmental (server not reachable, Firebase auth or network) rather than a regression.
3. Do not fix anything unless the user asks; this skill reports, it does not change code.
