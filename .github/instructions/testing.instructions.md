---
name: testing-guidance
description: Use when writing or modifying tests. Covers Vitest and Cypress patterns, test data sources, helper usage, and anti-flakiness practices.
applyTo: '{**/__tests__/**/*,cypress/e2e/**/*.cy.js}'
---

# Testing Guidance

## Test Organisation

- **Vitest tests**: `*.test.jsx` for components and pages, `*.test.js` for hooks, utils and store slices, colocated in `__tests__` folders (slice tests sit beside the slice).
- **Cypress component tests**: `*.cy.jsx` colocated in component/page `__tests__` folders.
- **Cypress E2E tests**: `cypress/e2e/{pages,app,components}/[Name].cy.js` with no further suffix: the folder says what it covers (`pages` per route, `app` for app-wide flows, `components` for shared components).

## Test Data & Utilities

Use existing project paths for shared testing assets:

- **Test constants and mock data**: `src/constants/test` (`mock-data/` for data, `selectors/` for `getByDataCy` selectors). A colocated `*TestData.js` is acceptable only for data used by that one test folder.
- **Cypress helper utilities**: `cypress/support/utils`
- **Cypress provider mounts**: `cypress/support/commands-support-files/mountWithProviders.jsx`
- **General test helpers**: `src/testUtils` (`vitest/` polyfills, setup and `mockClassNames`; `cypress/` `selectors.js` and `TestLocationDisplay`). Put a helper used by more than one test folder here rather than beside a single test; a shared `react-redux` mock belongs here too (today it is hand-mocked per test, #402).

Do not introduce `cypress/support/constants` unless explicitly adopted in a future refactor.

## Vitest Rules

- Test behaviour and outcomes, not implementation details.
- Use `src/testUtils` to reduce repeated setup.
- Validate success, loading, and error states for async logic.
- Keep mocks deterministic and local to each test scope when possible.

## Cypress Rules

- Select with `data-cy` through the `getByDataCy` constants in `src/constants/test/selectors`, or semantic roles; never an inline `[data-cy="…"]` string or a class selector. If a needed constant is missing, add it.
- Avoid arbitrary waits; rely on Cypress retry behaviour and explicit route aliases when needed.
- Keep E2E flows user-centred and scenario-driven.
- Reset or isolate state in `beforeEach` to prevent cross-test leakage.
- E2E tests that upload to Storage must delete their uploads afterwards.
- After logging in, wait for the stored session before reloading — the Auth SDK persists it asynchronously.
- Run `cy.checkA11y()` once per route in the E2E page specs (signed in where the spec signs in) and in component tests for forms and shared UI (`src/components/ui`, e.g. `BaseBadge`, `BaseImage`). It runs the WCAG 2.2 AA axe rules only.
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
