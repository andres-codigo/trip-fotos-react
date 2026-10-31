---
name: ui-check
description: Check a UI-affecting change (SCSS, layout, spacing, markup) in a real browser with full-page screenshots at 390, 768 and 1280px (plus either side of any breakpoint the change defines), compared with main, including logged-in pages and their states. Use before marking a UI change ready, or when someone reports a visual problem.
argument-hint: '[pages or components affected]'
---

# UI check

Run the checklist in [Visual check for UI changes](../../../.github/instructions/testing.instructions.md#visual-check-for-ui-changes) for `$ARGUMENTS` (or the pages the diff can affect), yourself and without asking. That section is the single source of truth, shared with Copilot; do not restate it here.

Container specifics the section does not cover:

- No `chromium-cli` or Playwright is installed: use a throwaway Cypress E2E spec under `cypress/e2e/tmp/` with `cy.screenshot(name, { capture: 'fullPage' })`.
- Lint errors in an untracked spec make it fail to load ("Failed to fetch dynamically imported module"): keep it ESLint-clean.
- Port 3000 may be the user's own dev server: never kill it by port. Start your own Vite on another port and stop it by PID, or run the spec against the emulators (see [testing.instructions.md](../../../.github/instructions/testing.instructions.md#when-to-run-e2e-locally)).
- Never read `.env`: the seeded emulator accounts reach the spec through the Cypress config and `performLogin()`.
- Case-only SCSS renames can leave files missing after `git switch`: `git restore` the affected folder, never anything with uncommitted work.

Report, per image, what is on screen, and list what was not checked. Hold the merge while a visual question is open, even when CI is green. Delete the spec and screenshots afterwards.

Status line: run `node .claude/skills/ui-check/status.mjs capturing` when the run starts, `reviewing` while you open the images, then `pass` or `hold` (a visual question is open). The status line shows it next to the `/verify` state.
