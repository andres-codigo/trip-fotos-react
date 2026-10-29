# Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, and [Cypress](https://www.cypress.io/) for end-to-end testing.

## 1. Vitest Setup

Vitest is already configured and included as a dev dependency — running `npm install` (see [Quick Start](../README.md#quick-start)) is all that's needed to get started. See [Scripts](../README.md#scripts) for the `vitest:*` commands.

**Vitest Directory Structure**

Vitest test files are located alongside the source files they test, following these conventions:

- For store logic: `*.test.js` files are placed next to the source file.
- For components and utility files: tests are typically placed in a `__tests__` folder within the component/utility directory.

```
src/
  ├── components/
  │   ├── forms/
  │   │   ├── __tests__/
  │   │   │   ├── UserAuthenticationForm.test.jsx
  │   │   │   └── ...
  │   │   ├── FormComponent.jsx
  │   ├── ui/
  │   │   ├── __tests__/
  │   │   │   ├── Button.test.jsx
  │   │   │   └── ...
  │   │   ├── Button.jsx
  ├── store/
  │   ├── slices/
  │   │   ├── <slice-file>.js
  │   │   ├── <test-file>.test.js
  ├── utils/
  │   ├── errorHandler/
  │   │   ├── __tests__/
  │   │   │   ├── errorHandler.test.js
  │   │   │   └── ...
  │   │   ├── index.js
```

## Vitest Test Utilities

Reusable test utilities are located in [testingLibrarySetup.js](../src/testUtils/vitest/testingLibrarySetup.js). This includes:

- **Mock Setup**: `setupMocks()` mocks `fetch` and `localStorage`, and runs automatically when the module is imported (e.g. via the Vitest `setupFiles` config).

## 2. Cypress Setup

Cypress is already configured in the project (both E2E and component testing) and included in the project dependencies — `npm install` is all that's needed. Feel free to customise [cypress.config.js](../cypress.config.js) as needed. See [Scripts](../README.md#scripts) for the `cy:*` commands.

The E2E suite still signs in to the live Firebase project. The local emulators (`npm run emulators`, see [Firebase Emulators](../README.md#firebase-emulators)) are in place for the epic that moves it onto a seeded backend; the specs do not use them yet.

**Cypress Directory Structure**

**End-to-End (E2E) Testing**: E2E test files are placed in the e2e directory.

**Fixtures**: Contains mock data used in tests (e.g., JSON files for API responses).

**Support**: Contains custom commands and global test setup files.

```
    cypress/
      ├── e2e/         # End-to-end test files (e.g., Authentication.cy.js)
      ├── fixtures/    # Mock data used in tests
      ├── support/     # Custom commands and test setup
```

**Component Testing**: Component test files are placed in a **tests** folder located within each component’s directory. For example:

```
src/
  ├── components/
  │   ├── forms/
  │   │   ├── __tests__/
  │   │   │   ├── UserAuthenticationForm.cy.jsx
  │   │   │   └── ...
  │   │   ├── FormComponent.jsx
  │   ├── ui/
  │   │   ├── __tests__/
  │   │   │   ├── Button.cy.jsx
  │   │   │   └── ...
  │   │   ├── Button.jsx
```

**Accessibility Checks**

`cy.checkA11y()` (in [commands.js](../cypress/support/commands.js)) injects [`axe-core`](https://github.com/dequelabs/axe-core) into the app's window and fails the test with a list of violations. It runs the WCAG 2.2 AA rules only, so best-practice advice never fails a build. It takes an optional context and axe options, e.g. `cy.checkA11y('#dialog', { rules: { 'color-contrast': { enabled: false } } })` — add a one-line comment saying why whenever a rule is disabled.

- E2E: every route in `PATHS` has a check in its page spec (`/` redirects to `/travellers`; the traveller detail page is checked in `ContactTraveller.cy.js`)
- Component tests: the forms and shared UI (button, dialog, input, textarea, combobox) each check the states that change the markup, such as an error message showing

**Test Artifacts**

Cypress stores screenshots and videos (if enabled) in the following directories:

- **Screenshots**: `cypress/screenshots/`
- **Videos**: `cypress/videos/`

You can configure these paths in the [cypress.config.js](../cypress.config.js) file.

**Debugging Cypress Tests**

To debug tests, use the Cypress Test Runner in interactive mode (`npx cypress open`). You can inspect elements and view console logs using the browser's developer tools.
