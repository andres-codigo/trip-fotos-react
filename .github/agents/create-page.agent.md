---
name: create-page
description: Use when scaffolding a new React page. Automates page folder creation, route-level composition setup, data-loading integration, and test scaffolding.
---

# Page Scaffolding Workflow

Use this agent when creating a new route-level page with structure, styling, and tests.

## Workflow Steps

1. **Page Details**
    - Confirm page name and route path.
    - Confirm whether route is protected.
    - Identify required data operations (read/mutation/orchestration).

2. **Create Structure**
    - Create `src/pages/{page-name-kebab-case}/`.
    - Create `{PageName}.jsx`.
    - Create `{PageName}.module.scss`.
    - Create `__tests__/` folder.

3. **Routing Integration**
    - Ensure route wiring is updated in `src/app/App.jsx`.
    - Use path constants from `src/constants` (no hardcoded route strings).
    - Apply protected route behaviour consistent with `PATHS.AUTHENTICATION` redirect patterns.

4. **Data Loading Pattern**
    - Prefer RTK Query hooks for new reads and most mutations.
    - Use existing thunk flows only where already established or orchestration is required.
    - Implement loading, empty, success, and error states.

5. **Page Composition**
    - Compose reusable UI from `src/components`.
    - Keep reusable logic in hooks/components, not embedded deeply in page files.
    - Ensure all page-level and custom container elements include `data-cy` attributes for E2E testing.

6. **Test Scaffolding**
    - Create `{PageName}.cy.jsx` (Cypress component test).
    - Create `{PageName}.test.js` (Vitest page logic test).
    - Create `cypress/e2e/pages/{PageName}.page.cy.js` (E2E flow test).
    - Use `src/constants/test` for test constants and `cypress/support/utils` for E2E helpers.

7. **Output**
    - Summarise created files and route changes.
    - Link to `.github/instructions/pages.instructions.md` and `.github/instructions/testing.instructions.md`.
    - Provide next steps for implementing business logic.

## Notes

- Follow British English in generated comments and strings.
- Keep page responsibilities focused on orchestration and route-level concerns.
- Update tests in the same task as page creation.
- **All generated files must end with a trailing newline at EOF** — enforce this during file creation to satisfy linting rules
- Every page file must include `data-cy` attributes on all page-level containers and custom elements for E2E testing
