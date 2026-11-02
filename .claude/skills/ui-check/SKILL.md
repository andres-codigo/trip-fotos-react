---
name: ui-check
description: Check a UI-affecting change (styling, layout, spacing, markup) in a real browser with full-page screenshots at 390, 768 and 1280px (plus either side of any breakpoint the change defines), compared with main, including logged-in pages and their states. Use before marking a UI change ready, or when someone reports a visual problem.
argument-hint: '[pages or components affected]'
---

# UI check

Run the checklist in [Visual check for UI changes](../../../.github/instructions/testing.instructions.md#visual-check-for-ui-changes) for `$ARGUMENTS` (or the pages the diff can affect), yourself and without asking. That section is the single source of truth, shared with Copilot; do not restate it here.

Container specifics the section does not cover:

- No `chromium-cli` or Playwright is installed: run the committed capture script `cypress/ui-check/capture.cy.js`, never a throwaway spec. Start `npm run emulators`, then run it once per ref with `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 UI_CHECK=true E2E_EMULATORS=true UI_CHECK_LABEL=<main|branch> [UI_CHECK_WIDTHS=390,1280] node .claude/skills/verify/run-e2e.mjs`. Screenshots land in `cypress/screenshots/capture.cy.js/<label>/`.
- Extend the script (a new page or state) in the same change that needs it, rather than writing a one-off spec. Keep it ESLint-clean: lint errors make a spec fail to load ("Failed to fetch dynamically imported module").
- Port 3000 may be the user's own dev server: never kill it by port. Start your own Vite on another port and stop it by PID, or run the spec against the emulators (see [testing.instructions.md](../../../.github/instructions/testing.instructions.md#when-to-run-e2e-locally)).
- Never read `.env`: the seeded emulator accounts reach the spec through the Cypress config and `performLogin()`.
- Case-only file renames can leave files missing after `git switch`: `git restore` the affected folder, never anything with uncommitted work.

Before capturing, write down every page, state (dialogs, empty, loading, error, hover, focus, disabled, own/other record, admin) and width the change can touch, and capture all of them: the run is not finished while a reachable state is uncaptured, and "not checked" is for what is impossible, each with its reason, never for what was skipped. Compare each branch image with its `main` pair by hash first and open every pair that differs; for identical pairs open one image per page and state to confirm it rendered, since identical blank or spinner frames also hash equal. Report what is on screen for each image you opened. Hold the merge while a visual question is open, even when CI is green. Delete the screenshots afterwards (the script stays).

Status line: run `node .claude/skills/verify/reset-checks.mjs` and then `node .claude/skills/ui-check/status.mjs capturing` when the run starts, `reviewing` while you open the images, then `pass` or `hold` (a visual question is open). The status line shows it next to the `/verify` state.
