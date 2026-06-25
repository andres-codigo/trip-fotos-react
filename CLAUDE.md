# CLAUDE.md — trip-fotos-react

## What this app does
A React/Firebase app for finding popular travel destinations tied to registered travellers. Converted from a Vue Udemy course project ("Find a Coach") — reimagined as "Trip Fotos". Deployed on Vercel.

## Stack
- **Vite** — dev server + build (port 3000, optional HTTPS via `certs/`)
- **React** — UI library
- **React Router** — routing
- **Redux** (RTK) — state management
- **SCSS Modules** — per-component styles
- **ESLint + Prettier** — linting and formatting
- **Vitest** — unit and integration tests
- **Cypress** — component tests (`cy.jsx`) and E2E tests
- **Firebase** — Realtime Database, Authentication (email/password), Cloud Storage

## src/ structure

```
src/
  app/           App.jsx + routing — entry wrapper only
  assets/        Static assets (SVGs)
  components/
    common/      LoadingFallback
    forms/       traveller-registration/, user-authentication/ (each with hooks/ + __tests__/)
    layout/      header/, main-nav/ (with nav-menu/, hooks/, __tests__/)
    travellers/  TravellersList
    ui/           Atomic: alerts, button, card, dialog, form/*, spinner
  constants/     45 files — api/, auth/, config/, errors/, firebase/, redux/, test/, travellers/, ui/, validation/
  pages/         authentication/, home/, messages/, page-not-found/, register/, travellers/
  services/      firebase/ (firebase.js)
  store/         store.js, storage.js (redux-persist), slices/authenticationSlice.js, slices/travellersSlice.js
  styles/        global.scss, setup/ (variables, mixins, typography, routing, pages)
  testUtils/     cypress/ (TestLocationDisplay, selectors), vitest/ (polyfills, mocks, setup)
  utils/         errorHandler/, form/, getFirebaseAuthErrorMessage/, useViewport/, validation/
  index.jsx      Entry point
```

## Key conventions

### Tests
- Co-located in `__tests__/` within each component/util folder
- Vitest files: `*.test.jsx` / `*.test.js`
- Cypress component files: `*.cy.jsx`
- Cypress E2E files: `cypress/e2e/`
- Test-local helpers go in `__tests__/test-utilities/`
- Shared test data lives in `constants/test/`

### Styles
- SCSS module per component: `ComponentName.module.scss`
- Global variables/mixins in `src/styles/setup/`
- Global styles only in `src/styles/global.scss`

### Constants
- Always import from the subdirectory barrel (`index.js`), never from individual files within a subdirectory
  - Correct: `import { TRAVELLER_REGISTRATION_FIELDS } from '@/constants/travellers'`
  - Wrong: `import { TRAVELLER_REGISTRATION_FIELDS } from '@/constants/travellers/registration'`
- Domain constants (auth, travellers) are separate from UI constants

### Comments
- Minimal — only add a comment when the WHY is non-obvious
- No multi-line docblocks; no "what this does" comments

### Imports
- Always use the `@/` alias for imports within `src/` — never use relative paths (`../../`)
  - Correct: `import Foo from '@/components/ui/foo/Foo'`
  - Wrong: `import Foo from '../../../components/ui/foo/Foo'`
- `@/` maps to `src/` (configured in Vite)

## Dev commands

```bash
npm run dev              # Start dev server (http or https if certs/ present)
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix + format

npm run vitest:run       # All unit/integration tests (CI mode)
npm run vitest:run:fast  # Fast run, no coverage
npm run vitest:coverage  # With coverage report

npm run cy:run:ct        # Cypress component tests (headless)
npm run cy:run:e2e       # Cypress E2E tests (headless)
npm run cy:open:ct       # Cypress component tests (interactive)
npm run cy:open:e2e      # Cypress E2E tests (interactive)

npm run build            # Production build → dist/
npm run analyze          # Bundle size visualiser
```

## Environment
Requires `.env` with Firebase config — see `.env.example` or README Setup section.
Required keys: `VITE_API_KEY`, `VITE_BACKEND_BASE_URL`, `VITE_FIREBASE_*`, `VITE_ADMIN_ID`, `CYPRESS_USER_*`.

## Things to avoid
- Do not commit `.env` or `certs/`
- Do not mock the Firebase Realtime Database in integration tests
- Do not add comments that describe what the code does — only why
- Do not create new top-level `src/` folders without updating this file
