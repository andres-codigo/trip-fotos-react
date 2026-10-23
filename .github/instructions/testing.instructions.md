---
name: testing-guidance
description: Use when writing or modifying tests. Covers Vitest and Cypress patterns, test data sources, helper usage, and anti-flakiness practices.
applyTo: '{**/__tests__/**/*,cypress/e2e/**/*.cy.js}'
---

# Testing Guidance

## Test Organisation

- **Vitest tests**: `*.test.js` files colocated in source-level `__tests__` folders.
- **Cypress component tests**: `*.cy.jsx` colocated in component/page `__tests__` folders.
- **Cypress E2E tests**: `cypress/e2e/**/[PageName].page.cy.js` and related app/component flows.

## Test Data & Utilities

Use existing project paths for shared testing assets:

- **Test constants and mock data**: `src/constants/test`
- **Cypress helper utilities**: `cypress/support/utils`
- **Cypress provider mounts**: `cypress/support/commands-support-files/mountWithProviders.jsx`
- **General test helpers**: `src/testUtils`

Do not introduce `cypress/support/constants` unless explicitly adopted in a future refactor.

## Vitest Rules

- Test behaviour and outcomes, not implementation details.
- Use `src/testUtils` to reduce repeated setup.
- Validate success, loading, and error states for async logic.
- Keep mocks deterministic and local to each test scope when possible.

## Cypress Rules

- Prefer resilient selectors (`data-testid`, semantic roles) over fragile class selectors.
- Avoid arbitrary waits; rely on Cypress retry behaviour and explicit route aliases when needed.
- Keep E2E flows user-centred and scenario-driven.
- Reset or isolate state in `beforeEach` to prevent cross-test leakage.
- E2E tests that upload to Storage must delete their uploads afterwards.
- After logging in, wait for the stored session before reloading — the Auth SDK persists it asynchronously.
- Run `cy.checkA11y()` once per route in the E2E page specs (signed in where the spec signs in) and in component tests for forms and shared UI. It runs the WCAG 2.2 AA axe rules only.
- Fix axe violations rather than excluding them; if a rule must be disabled, pass `{ rules: { 'rule-id': { enabled: false } } }` for that call with a one-line reason.
- If an E2E spec fails in a full run, re-run it on its own before treating it as a regression; specs can flake under load.

## When to Run E2E Locally

CI runs the full E2E suite on every pull request, so a local run is for earlier feedback, not the safety net. It uses the live Firebase project, so it stays opt-in (`/verify e2e`). Run it before pushing when:

- An E2E spec or `cypress/support/` file is added or changed — otherwise its first run is in CI
- Routing, route guards or redirects change (`src/app/`, `src/pages/`, `PATHS`)
- Store logic or persisted state changes (`src/store/`) — Vitest and component tests build their own store without redux-persist, so only E2E sees rehydration
- Firebase services or API constants change

`/verify` prints an `E2E advised` line for these paths. For other changes, leave E2E to CI. To run one spec, pass it through: `node .claude/skills/verify/run-e2e.mjs --spec <path>`. The runner reuses a dev server already on port 3000, so a Vite error overlay left from an earlier compile failure there will fail every spec; restart that server first.

## Required Updates

Whenever components, pages, or store logic are modified, update the related tests in the same change.

## Run Commands

- Vitest: `npm run vitest:run` or `npm run vitest:watch`
- Cypress E2E: `npm run cy:run:e2e`
- Cypress auto-targeting: `npm run cy:run:auto {path/to/test-file}`

## Linting And Formatting

- Before handing off test-related changes, ensure every edited or newly created test file is ESLint-clean and Prettier-formatted.
