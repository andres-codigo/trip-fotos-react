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
    - Create `{PageName}.module.scss` (PascalCase) only if the page needs its own styles.
    - Create `__tests__/` folder.

3. **Routing Integration**
    - Ensure route wiring is updated in `src/app/App.jsx`.
    - Use path constants from `src/constants` (no hardcoded route strings).
    - Apply protected route behaviour consistent with `PATHS.AUTHENTICATION` redirect patterns.

4. **Data Loading Pattern**
    - Dispatch a store thunk for reads and mutations (see `store.instructions.md`); add one if none fits.
    - Read loading/error from the slice selectors; use local state only for a single awaited dispatch.
    - Implement loading, empty, success, and error states.

5. **Page Composition**
    - Compose reusable UI from `src/components`.
    - Keep reusable logic in hooks/components, not embedded deeply in page files.
    - Give page-level and custom container elements `data-cy` attributes and export matching selector constants via `getByDataCy` in `src/constants/test/selectors/`; tests use the constants, never inline strings.
    - Keep the `<h1>` inside the card or column it labels (see `pages.instructions.md` → Page Structure And Accessibility).
    - Scope every rule in `{PageName}.module.scss` to a class and run `npm run lint:styles`.

6. **Test Scaffolding**
    - Create `{PageName}.test.jsx` (Vitest page test).
    - Create `{PageName}.cy.jsx` (Cypress component test) when the page has non-trivial interaction.
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
- **Linting and formatting** — ensure all generated and edited files are ESLint-clean, Stylelint-clean and Prettier-formatted before handing off the page work.
- Every page file includes `data-cy` attributes on page-level containers and custom elements, backed by selector constants
