---
name: testing-guidance
description: Use when writing or modifying tests. Covers Vitest and Cypress patterns, test data sources, helper usage, and anti-flakiness practices.
applyTo: ['**/__tests__/**/*', 'cypress/e2e/**/*.cy.js']
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

## Required Updates

Whenever components, pages, or store logic are modified, update the related tests in the same change.

## Run Commands

- Vitest: `npm run vitest:run` or `npm run vitest:watch`
- Cypress E2E: `npm run cy:run:e2e`
- Cypress auto-targeting: `npm run cy:run:auto {path/to/test-file}`
