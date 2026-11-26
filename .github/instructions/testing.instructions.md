---
name: testing-guidance
description: Use when writing or modifying tests. Covers Vitest and Cypress patterns, test data sources, helper usage, and anti-flakiness practices.
applyTo: '{**/__tests__/**/*,cypress/e2e/**/*.cy.js}'
---

# Testing Guidance

## Test Organisation

- **Vitest tests**: `*.test.jsx` for components and pages, `*.test.js` for hooks, utils and store slices, colocated in `__tests__` folders (slice tests sit beside the slice). A `.test.js` file other than a hook's `use*.test.js` runs in Node, not jsdom (the `node` project in `vite.config.js`), so it has no `document` or `window`.
- **Cypress component tests**: `*.cy.jsx` colocated in component/page `__tests__` folders.
- **Cypress E2E tests**: `cypress/e2e/{pages,app,components}/[Name].cy.js` with no further suffix: the folder says what it covers (`pages` per route, `app` for app-wide flows, `components` for shared components). Adding, removing or renaming one means recording its CI time in `SPEC_SECONDS` in [`scripts/e2e-groups.mjs`](../../scripts/e2e-groups.mjs), which splits the specs across the parallel CI jobs; its test fails until you do. Name its areas in `E2E_SPECS` in [`cypress/impact.js`](../../cypress/impact.js) too, which picks the specs a PR runs; its test also fails until you do.

### Which layer owns a check

Each check is written once, in the layer that owns it. Before adding a test, look for the same check in the other layers.

- **Vitest** owns logic, state and branches, the text and ARIA a user relies on, focus moves and timers.
- **Component tests** own what needs a real browser: layout, size and position, computed styles, hover and keyboard-focus styles, scrolling, real file selection and drag-drop, and `cy.checkA11y()`. They do not repeat Vitest's rendering, prop or callback checks.
- **Dialogs, menus and popovers** are Radix (`BaseDialog`, `BaseSheet`, `ImageGallery`), not native `<dialog>`, so Escape and outside click are JavaScript. Vitest owns Escape, outside click, focus moving in and out, and the focus trap. Component tests own the overlay covering the viewport, panel position and size per width, scroll lock, the end state of the open animation, and `checkA11y` on the open dialog.
- **One integration component test** may run the real store or hooks with the network intercepted, where Vitest mocks that path. Name it as the integration check (`AuthAction.cy.jsx` and `TravellerRegistrationForm.cy.jsx` each keep one); everything else it would repeat stays in Vitest.
- **A component gets a `.cy.jsx` only when a real browser shows something about it**: layout, a computed style, a hover or focus style, scrolling, a real file input, or `checkA11y` for a form or `ui` component. Otherwise it gets none.
- **Responsive checks test the breakpoint edges** (for example 639/640 and 1023/1024), not every width.
- **E2E** owns user flows across routes, Firebase and the persisted store.
- No layer tests class names for their own sake, `data-cy` values alone, the props a child receives, which wrapper component is used, or code written inside the test itself. A page's `<main>` structure (skip-link target, class, `data-cy`) is one test, not one per attribute.

## Test Data & Utilities

Use existing project paths for shared testing assets:

- **Test constants and mock data**: `src/constants/test` (`mock-data/` for data, `selectors/` for `getByDataCy` selectors). A colocated `*TestData.js` is acceptable only for data used by that one test folder.
- **Naming test ids and selector keys**: name each key after what it labels and keep it in step with the config key for the same thing (`CONTACT_TRAVELLER.BACK_TO_MESSAGES` for the link whose text is `CONTACT_TRAVELLER_CONFIG.BACK_TO_MESSAGES`, not `BACK_LINK`). Follow the existing group shape: the outer element is `ROOT`, and the test-id key and the selector key match. Check new keys against their siblings before handing off, so no rename is needed later.
- **Cypress helper utilities**: `cypress/support/utils`
- **Cypress provider mounts**: a component test that needs the store or a router mounts with `cy.mountWithProviders(ui, store, { initialEntries })` (`cypress/support/commands-support-files/mountWithProviders.jsx`), passing `initialEntries` for a route page and wrapping it in `<Routes>` when it reads params; never a hand-built `Provider` + `MemoryRouter`. A component that only needs a router mounts in a plain `MemoryRouter`.
- **General test helpers**: `src/testUtils` (`vitest/` polyfills, setup; `cypress/` `selectors.js`). Put a helper used by more than one test folder here rather than beside a single test; `vitest/mockReactRedux.js` is the shared `react-redux` mock (real `Provider`, `useSelector` and `useDispatch` as spies), used as `vi.mock('react-redux', async () => (await import('@/testUtils/vitest/mockReactRedux')).createReactReduxMock())` rather than hand-mocking it per test. A test that needs a real store builds it with `configureTestStore` (`@/testUtils/configureTestStore`), `configureStore` with the app's middleware options (`src/store/middleware.js`, both development checks warning only past 128ms), never `configureStore` itself: ESLint enforces it, so a busy run does not fail on a timing warning the app's store would not log.

Do not introduce `cypress/support/constants` unless explicitly adopted in a future refactor.

## Vitest Rules

- Test behaviour and outcomes, not implementation details.
- Use `src/testUtils` to reduce repeated setup.
- Validate success, loading, and error states for async logic.
- Keep mocks deterministic and local to each test scope when possible.
- A test fails on any unexpected `console.error` or `console.warn` (`src/testUtils/vitest/failOnConsole.js`, and `cypress/support/utils/failOnConsole.js`, used by both the component and E2E support files), so React warnings such as an unknown DOM prop or an update outside `act()` are fixed, not ignored. A test that expects a message spies on `console` itself. Add a pattern to `ALLOWED_MESSAGES` (Vitest) or `ALLOWED_CONSOLE_MESSAGES` (Cypress component and E2E) only for noise we cannot fix, with a one-line reason.
- A mocked child component must not spread props meant for the real one onto a DOM element (map `ariaLabel` to `aria-label`, drop `isLink`, `to` and the like).
- No class-name, `data-cy`-only, child-prop or wrapper checks: the component test proves the styles, and a check that only finds an element proves nothing on its own.
- Find by `data-cy` with `screen.getByTestId` (`testIdAttribute` is `data-cy`), with the id from `src/constants/test`. No local `byDataCy` or `querySelector('[data-cy=…]')` helpers.
- Cases that differ only in input and expected output are one `it.each` table.
- A page test checks how the page wires its children (what it passes in and what happens next), not the child's own states, which the child's test owns.
- Reuse a file's own fill, submit and render helpers rather than inlining their steps.
- Every `vi.mock` path resolves to a real module.
- Slice tests that mock `fetch` build responses with `okJson(data)` and `failing(status)` from `@/testUtils/fetchResponses`, not inline `{ ok, json }` objects.
- Do not test library behaviour (clsx, module caching), constant values, or bare setters and selectors that the thunk tests already reach.

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
- E2E does not assert an error or loading state it forces with an intercept when Vitest or a component test already covers it. Use an intercept to steer a flow, not to re-test a state.
- Each flow (sign-up, login, logout, contact) is written in one spec. Other specs reach their start state through the shared helpers in `cypress/support/utils/authHelpers` (`performLogin`, `signUp`, `verifyByLink`) rather than re-writing it.
- Shared chrome (the brand link and the header actions) is checked in `Navigation.cy.js` only.

## When to Run E2E Locally

CI runs the full E2E suite on every pull request, so a local run is for earlier feedback, not the safety net. It runs against the local Firebase emulators (`/verify e2e`), which need Java and add start-up time, so it stays opt-in. Run it before pushing when:

- An E2E spec or `cypress/support/` file is added or changed — otherwise its first run is in CI
- Routing, route guards or redirects change (`src/app/`, `src/pages/`, `PATHS`)
- Store logic or persisted state changes (`src/store/`) — Vitest and component tests build their own store without redux-persist, so only E2E sees rehydration
- Firebase services or API constants change

`/verify` runs E2E by itself for these paths (and notes why). For other changes, leave E2E to CI, or pass `e2e` to force it. It runs the specs `cypress/impact.js` maps to the changed pages first and stops on their first failure, then the rest; the whole suite still has to pass before commit. In CI a PR runs only the specs `cypress/impact.js` maps its change to (every spec for shared files) and `main` runs them all after each merge ([details](../../docs/ci-cd.md#2-cypress-e2e-tests)), so give a new area or spec its entry there. The runner stops within a second when the emulator log shows a crash (`Unexpected rules runtime error`, an exited emulator), rather than letting later calls hang. Wait on a save, send, register or delete with `cy.waitForSuccess(atPath(path))` or `shows(selector)` (`cypress/support/utils/waitForSuccess.js`), which fails as soon as an error dialog shows. To run one spec, start `npm run emulators` and `npm run emulators:seed` in another terminal, then run `E2E_EMULATORS=true node .claude/skills/verify/run-e2e.mjs --spec <path>`. The runner uses its own port, 5190 (`E2E_PORT` overrides it), never the dev server's 3000. It builds the app and serves the build with `vite preview`, so an app change shows only on the next run. In live mode it reuses a server already on that port, so a Vite error overlay left from an earlier compile failure there will fail every spec; restart that server first.

## Visual Check For UI Changes

Do this for any change that can alter how a page looks (styling, layout, spacing, markup), before the PR is marked ready. Passing tests do not show a visual regression: a shared class overridden by a page's own rule passed everything and was only visible on screen.

Order: build the change, run its targeted tests, run this check and fix what it finds, then run `/verify` once and commit. A change to the layout of a shared component or form section (flex or grid wrappers, column counts, widths, overlays inside tiles) gets a component test of the size or position first, failing on the broken layout: it finds the regression in seconds where a capture takes minutes. It does not replace this check. `/verify` refuses to start while the branch changes `src/**/*.{jsx,css}` (tests aside) and `/ui-check` has not recorded `pass`; the pass holds through later edits that touch no UI file, such as the tests for its fixes.

- Run the committed capture script `cypress/ui-check/capture.cy.js` (`UI_CHECK=true`, with `UI_CHECK_LABEL` and optionally `UI_CHECK_WIDTHS`; it is not part of the E2E suite). It signs in as the seeded accounts and takes `cy.screenshot(name, { capture: 'fullPage' })` of every page and state at the two default widths, 390px (mobile) and 1280px (desktop). Widths can be set per capture: `UI_CHECK_WIDTHS=390,1280;edit=390,768,1280` adds 768 only to the captures whose id or title contains `edit`, so pass the tablet width only where the change touches the tablet layout. Add a page or state to it when a change needs one, with an entry in `cypress/impact.js` naming the areas it covers; do not write a throwaway spec.
- Run only the captures the change can affect, on both refs: `.claude/skills/ui-check/affected.mjs` maps the branch diff through `cypress/impact.js` and prints their `UI_CHECK_ONLY`. A file no area claims (shared UI, layout, styles, the store) and any seed or capture-helper change select every capture. A header, main nav or tab bar change selects the captures that show the header logged out and signed in. Changes that reach no existing capture drop out first: a capture-script change that adds or edits captures, and only adds imports and helpers, selects just the captures it adds or edits, since each starts from the seed data (a changed hook, import or shared helper still selects them all); a `cypress.config.js` change that only adds `expose` keys; a constants file the branch only adds to; and a new `src/` file, which reaches a page only through the changed file that imports it. Use the helpers in the script: `visit()` reloads even when only the hash changes, `interceptOnce()` stubs one request (so a failure stub never answers the real request after it), `cy.waitForSuccess()` fails as soon as an error dialog shows, and `assertSettled()` waits for spinners, skeleton lists and the signed-in traveller's name. Add 768px, and a width either side of a breakpoint, only when the change touches a breakpoint (the changed CSS defines its own, or a layout changes between widths): capture one just either side of it (for example 1023px and 1024px for a 1024px breakpoint). A viewport-only capture misses everything below the fold, such as the Register page's file input. Run it on your branch and on `main`.
- **Compare branch and `main` images by hash first, and open every pair that differs**, saying what is on screen. `.claude/skills/ui-check/compare.mjs` does the hashing, prints the changed rows of each changed pair and writes a side-by-side crop of the changed region; any difference must be one you intended. For identical pairs, open one image per page and state: byte-identical files hide pages that never rendered (two identical spinner frames passed as "identical" for a page that had not loaded), so the spec must also assert the content is on screen.
- Capture the states the change can touch, not just the resting page: validation errors, error dialogs and backdrops, the open mobile menu, file previews and rejected files, the image dialog, long lists (such as the "See all N photos" tile) and empty states.
- Cover every page that uses the changed styles, **including pages behind login**: sign in with `performLogin()` from `cypress/support/utils/authHelpers`. Do not assume a logged-in page is fine because a shared style works on a public one.
- Run against the emulators, signed in as a seeded account (`TEST_USERS.STANDARD`, or `TEST_USERS.TRAVELLER` for a registered traveller with an inbox). Never point it at the live Firebase project.
- Wait for the content, not just the page shell: assert the data and images have rendered, that no `[data-cy="base-spinner"]` remains (unless the spinner is the subject), and freeze animation with an injected `animation: none` style, or the capture is a spinner at a random frame.
- Run it through the emulators as above, or start your own Vite server in `emulators` mode. Never kill whatever is on port 3000: it may be a developer's own server.
- When someone reports a visual problem, reproduce it on screen on `main` and on your branch before saying whether your change caused it. Hold the merge while a visual question is open, even when CI is green, and list in the PR only what was impossible to check, with the reason.
- Capture the browser console in the spec (spy `console.error` and `console.warn` in `cy.on('window:before:load')`) and fail on any call: a page that renders but logs a React warning or an error is not "looks fine".
- Enumerate every consumer, prop, mode, state and width of the changed component before capturing, and capture all of them; "not checked" is for what is impossible (live writes, unseedable data), never for what was skipped.
- The script closes what the seeded emulators used to leave out: a seeded-in-spec traveller with an unreachable photo URL renders the real error path; the CSS spinner is frozen with the rest of the animation; `:hover` and `:focus-visible` are forced through CDP (`CSS.forcePseudoState`, Chromium only); register (with a Storage emulator upload slowed through `Network.emulateNetworkConditions` so `BaseProgress` shows), contact send and message delete are driven for real; the file-preview and city-chip remove buttons are captured for hover and focus. The emulators are fully seeded once per run, and every capture starts by resetting the database to the seed (the accounts too, when an earlier capture deleted one), so a capture gives the same image alone, filtered or in a full run. Captures that show message times freeze the app's `Date` (`cy.clock(NOW, ['Date'])`) at the time the messages are seeded against, so time text matches across runs.
- CSS that renders differently between engines (form controls such as date fields, pseudo-elements, `@supports`) is also checked in Firefox and WebKit, since the capture script runs Chromium only. An untested engine is a blocker to fix before merge, not a known limit for the PR: a Firefox date-field fix that looked right hid the icon in WebKit, and only real-engine screenshots showed both. In the dev container, install Playwright in a scratch folder (`npm i playwright@1.65.0`, then `sudo env "PATH=$PATH" PLAYWRIGHT_BROWSERS_PATH=$PWD/browsers npx playwright install --with-deps chromium firefox webkit`), serve Vite over HTTP (`CYPRESS=1 npx vite --mode emulators --port 5199`, as WebKit blocks the HTTPS app calling the HTTP emulators), sign in as a seeded account, and stop Vite by its node PID. Linux WebKit is not iOS Safari: say so when iOS-only behaviour (native date controls, the keyboard) is in question.
- It ignores the React message `Cannot commit the same tree as before` (capture-only tooling noise, matched by exact text). If it appears in the CI E2E suite or outside a capture, investigate it.
- Every fix this check finds gets a Vitest or component test in the same change that fails without it; a fix with no test is how a clipped focus ring came back.
- Recheck a fix, or an edit to the capture script, with `UI_CHECK_ONLY=<capture ids or parts of titles>` (comma-separated, case-insensitive) on the branch: it runs only the matching captures in about a minute, keeps the label's other captures and replaces its own, and its images are comparable with a full `main` run. Run a capture-script edit once like this straight after making it, not at the end.
- A `main` run of committed code records each capture it took, with its widths, against the commit and capture-script hash in `capture.cy.js/main.json` (a later run on the same commit adds to it); `main-captures.mjs [widths] [only]` checks it before the next check and prints the `UI_CHECK_ONLY` that retakes only the captures missing. When `main` has moved, it keeps the captures the commits between cannot change (mapped through `cypress/impact.js`, with a capture-script edit cut down to the captures it edits) and moves the record to the new commit: a release, docs or test commit keeps them all, as does a change to a Markdown file or Vitest helper under `src/`, the component-test support files, `public/` outside `public/fonts/`, the npm scripts or only the `test` block of `vite.config.js`; a shared file, shared capture setup, the seed data, `index.html`, the rest of `vite.config.js`, the fonts, the Firebase rules or a dependency bump retakes them all.
- Shots go in `cypress/ui-check-captures/capture.cy.js/<label>/<capture>/`, outside `cypress/screenshots`, which component and E2E runs trash. A full run clears its label's folder, a filtered one each capture's folder as it starts, and `compare.mjs` compares only the captures the branch run took. Delete the crops (the folder is gitignored) afterwards; keep the `main` folder and its `main.json`, which the next check reuses for every capture `main`'s later commits cannot change. Keep the branch shots too: a `branch` run records the working tree each capture was taken on in `branch.json`, and after the merge `promote.mjs` moves into `main/` every branch capture nothing it depends on has changed since (the same `cypress/impact.js` check), moves `main.json` to the merge commit and deletes the rest, which the next check retakes.
- The seed uploads the seeded traveller's photos and thumbnails to the Storage emulator as real PNGs, so a capture or spec that removes them deletes real objects, as in production; every reset puts them back.

Case-only renames of files (such as `register.jsx` to `Register.jsx`) can leave files missing when you `git switch` on a case-insensitive filesystem; `git restore` the affected folder if so. After merging such a rename, local `main` can be left dirty: `git restore --source=origin/main --worktree -- <files>`, check `git diff origin/main` is empty, then `git reset --mixed origin/main`.

Full-page shots show a duplicated sticky header and a clipped dialog fragment at the 720px seam. The same appears on `main`: it is the capture, not a bug.

## Required Updates

Whenever components, pages, or store logic are modified, update the related tests in the same change.

- Cover every new behaviour path, not only the headline one: for each changed path, name the test that fails without it.
- Before deleting a test as a duplicate, name the test that still covers it (in the PR). If that test mocks the path, keep the check or move it into a test that runs the real path first, in the same change.
- When behaviour is replaced or removed, rewrite or delete the tests that covered it, so none keeps passing against behaviour that is gone. Grep tests, Cypress specs and docs for the old behaviour.
- Delete the test assets that removal leaves unused in the same change: mock data no test imports, Cypress helpers and commands no spec calls, and selector constants and `data-cy` hooks no spec or component uses.
- Add a `data-cy` hook, or a test constant key, only with the test that selects it, in the same change. One no test selects is unused code from the start.

## Run Commands

- Vitest: `npm run vitest:run` or `npm run vitest:watch`
- Cypress E2E: `npm run cy:run:e2e`
- Cypress auto-targeting: `npm run cy:run:auto {path/to/test-file}`

## Linting And Formatting

- Before handing off test-related changes, ensure every edited or newly created test file is ESLint-clean and Prettier-formatted.
