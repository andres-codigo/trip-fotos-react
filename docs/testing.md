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

## Console output fails tests

Vitest ([failOnConsole.js](../src/testUtils/vitest/failOnConsole.js)) and Cypress, both component and E2E ([failOnConsole.js](../cypress/support/utils/failOnConsole.js), loaded from `component.js` and `e2e.js`), fail a test that logs an unexpected `console.error` or `console.warn`, so React warnings (an unknown DOM prop, an update outside `act()`, an invalid ARIA attribute) surface in the test run instead of only in a log. To let a known third-party message through, add a pattern to `ALLOWED_MESSAGES` (Vitest) or `ALLOWED_CONSOLE_MESSAGES` (Cypress) with a one-line reason; fix our own warnings instead. A test that expects a message spies on `console` itself.

## 2. Cypress Setup

Cypress is already configured in the project (both E2E and component testing) and included in the project dependencies — `npm install` is all that's needed. Feel free to customise [cypress.config.js](../cypress.config.js) as needed. See [Scripts](../README.md#scripts) for the `cy:*` commands.

`npm run cy:run:e2e:emulators` runs the E2E specs against the local emulators (see [Firebase Emulators](../README.md#firebase-emulators)): `firebase emulators:exec` starts them, the seed loads, a dev server starts in `emulators` mode (on port 5190, `E2E_PORT` to change it, never a server already running there or the dev server's 3000) and `E2E_EMULATORS=true` makes `cypress.config.js` load `.env.emulators` and sign in as the seeded standard user. Match intercept URLs with a trailing `*` (the emulator adds `?ns=`). Specs that write call `cy.resetEmulators()` in `beforeEach` (it re-seeds and clears the saved login sessions) and `cy.assertTravellerPersisted()` reads the record back, so registration, the photo upload and the Messages load and delete are real round trips (Messages signs in as the seeded traveller, `TEST_USERS.TRAVELLER`); error and delay states keep their `cy.intercept` stubs, and list specs assert the exact seeded data.

`npm run cy:run:e2e:live` runs the single read-only smoke spec in `cypress/e2e-live/` against the real Firebase project with the `CYPRESS_USER_*` credentials from `.env`. CI runs it on pushes to `main` only. Keep it to sign-in and reads: the emulators cover everything else.

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
