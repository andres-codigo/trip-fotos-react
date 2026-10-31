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
- **General test helpers**: `src/testUtils` (`vitest/` polyfills, setup; `cypress/` `selectors.js` and `TestLocationDisplay`). Put a helper used by more than one test folder here rather than beside a single test; `vitest/mockReactRedux.js` is the shared `react-redux` mock (real `Provider`, `useSelector` and `useDispatch` as spies), used as `vi.mock('react-redux', async () => (await import('@/testUtils/vitest/mockReactRedux')).createReactReduxMock())` rather than hand-mocking it per test.

Do not introduce `cypress/support/constants` unless explicitly adopted in a future refactor.

## Vitest Rules

- Test behaviour and outcomes, not implementation details.
- Use `src/testUtils` to reduce repeated setup.
- Validate success, loading, and error states for async logic.
- Keep mocks deterministic and local to each test scope when possible.
- A test fails on any unexpected `console.error` or `console.warn` (`src/testUtils/vitest/failOnConsole.js`, and `cypress/support/utils/failOnConsole.js`, used by both the component and E2E support files), so React warnings such as an unknown DOM prop or an update outside `act()` are fixed, not ignored. A test that expects a message spies on `console` itself. Add a pattern to `ALLOWED_MESSAGES` (Vitest) or `ALLOWED_CONSOLE_MESSAGES` (Cypress component and E2E) only for noise we cannot fix, with a one-line reason.
- A mocked child component must not spread props meant for the real one onto a DOM element (map `ariaLabel` to `aria-label`, drop `isLink`, `to` and the like).

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

CI runs the full E2E suite on every pull request, so a local run is for earlier feedback, not the safety net. It runs against the local Firebase emulators (`/verify e2e`), which need Java and add start-up time, so it stays opt-in. Run it before pushing when:

- An E2E spec or `cypress/support/` file is added or changed — otherwise its first run is in CI
- Routing, route guards or redirects change (`src/app/`, `src/pages/`, `PATHS`)
- Store logic or persisted state changes (`src/store/`) — Vitest and component tests build their own store without redux-persist, so only E2E sees rehydration
- Firebase services or API constants change

`/verify` prints an `E2E advised` line for these paths. For other changes, leave E2E to CI. To run one spec, start `npm run emulators` and `npm run emulators:seed` in another terminal, then run `E2E_EMULATORS=true node .claude/skills/verify/run-e2e.mjs --spec <path>`. The runner uses its own port, 5190 (`E2E_PORT` overrides it), never the dev server's 3000. In live mode it reuses a server already on that port, so a Vite error overlay left from an earlier compile failure there will fail every spec; restart that server first.

## Visual Check For UI Changes

Do this for any change that can alter how a page looks (styling, layout, spacing, markup), before the PR is marked ready. Passing tests do not show a visual regression: a shared class overridden by a page's own rule passed everything and was only visible on screen.

- Write a throwaway Cypress E2E spec under `cypress/e2e/tmp/` (never committed) that visits the affected pages at the three standard widths, 390px (mobile), 768px (tablet) and 1280px (desktop), and calls `cy.screenshot(name, { capture: 'fullPage' })`. Add a width only when the changed CSS defines its own breakpoint: capture one just either side of it (for example 1023px and 1024px for a 1024px breakpoint). A viewport-only capture misses everything below the fold, such as the Register page's file input. Run it on your branch and on `main`.
- **Compare branch and `main` images by hash first, and open every pair that differs**, saying what is on screen; any difference must be one you intended. For identical pairs, open one image per page and state: byte-identical files hide pages that never rendered (two identical spinner frames passed as "identical" for a page that had not loaded), so the spec must also assert the content is on screen.
- Capture the states the change can touch, not just the resting page: validation errors, error dialogs and backdrops, the open mobile menu, file previews and rejected files, the image dialog, long lists (such as the "See all N photos" tile) and empty states.
- Cover every page that uses the changed styles, **including pages behind login**: sign in with `performLogin()` from `cypress/support/utils/authHelpers`. Do not assume a logged-in page is fine because a shared style works on a public one.
- Run against the emulators, signed in as a seeded account (`TEST_USERS.STANDARD`, or `TEST_USERS.TRAVELLER` for a registered traveller with an inbox). Never point it at the live Firebase project.
- Wait for the content, not just the page shell: assert the data and images have rendered, that no `[data-cy="base-spinner"]` remains (unless the spinner is the subject), and freeze animation with an injected `animation: none` style, or the capture is a spinner at a random frame.
- Run it through the emulators as above, or start your own Vite server in `emulators` mode. Never kill whatever is on port 3000: it may be a developer's own server.
- When someone reports a visual problem, reproduce it on screen on `main` and on your branch before saying whether your change caused it. Hold the merge while a visual question is open, even when CI is green, and list in the PR only what was impossible to check, with the reason.
- Capture the browser console in the spec (spy `console.error` and `console.warn` in `cy.on('window:before:load')`) and fail on any call: a page that renders but logs a React warning or an error is not "looks fine".
- Enumerate every consumer, prop, mode, state and width of the changed component before capturing, and capture all of them; "not checked" is for what is impossible (live writes, unseedable data), never for what was skipped.
- Delete the spec and its screenshots (`cypress/screenshots/` is gitignored) afterwards.

Case-only renames of files (such as `register.jsx` to `Register.jsx`) can leave files missing when you `git switch` on a case-insensitive filesystem; `git restore` the affected folder if so.

## Required Updates

Whenever components, pages, or store logic are modified, update the related tests in the same change.

## Run Commands

- Vitest: `npm run vitest:run` or `npm run vitest:watch`
- Cypress E2E: `npm run cy:run:e2e`
- Cypress auto-targeting: `npm run cy:run:auto {path/to/test-file}`

## Linting And Formatting

- Before handing off test-related changes, ensure every edited or newly created test file is ESLint-clean and Prettier-formatted.
