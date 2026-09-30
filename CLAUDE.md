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

## Branch naming

Branches must use a type prefix:

| Prefix         | Use for                                 |
| -------------- | --------------------------------------- |
| `feature/`     | New user-facing feature                 |
| `fix/`         | Bug fix                                 |
| `docs/`        | Documentation only                      |
| `refactor/`    | Code restructuring, no behaviour change |
| `enhancement/` | Improvement to an existing feature      |
| `chore/`       | Maintenance — deps, config, CI          |
| `test/`        | Test additions or changes only          |

Example: `docs/update-constants-readme`, `fix/auth-redirect-loop`

## Language & Tone

- Use British English (`en-GB`) for all code comments, documentation, and strings (e.g., `colour`, `behaviour`, `optimise`).
- Commit messages follow `en-GB` spelling conventions.

## Domain-Specific Guidance

Detailed conventions live in `.claude/docs/` — read the relevant file when working in that area, rather than expecting it to be summarised here:

| File                                                     | Applies to                              | Covers                                                             |
| -------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| [.claude/docs/components.md](.claude/docs/components.md) | `src/components/**`                     | Folder structure, prop-types, reusability, accessibility, testing  |
| [.claude/docs/pages.md](.claude/docs/pages.md)           | `src/pages/**`                          | Route composition, data loading, testing                           |
| [.claude/docs/store.md](.claude/docs/store.md)           | `src/store/**`                          | RTK Query vs. thunks, error handling pattern, persistence, testing |
| [.claude/docs/styles.md](.claude/docs/styles.md)         | `src/**/*.module.scss`, `src/styles/**` | SCSS modules, namespaced imports, colour naming                    |
| [.claude/docs/testing.md](.claude/docs/testing.md)       | `**/__tests__/**`, `cypress/e2e/**`     | Vitest/Cypress organisation, test data, anti-flakiness             |

## Key conventions

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
npm run analyse          # Bundle size visualiser
```

## Environment

Requires `.env` with Firebase config — see `.env.example` or README Setup section.
Required keys: `VITE_API_KEY`, `VITE_BACKEND_BASE_URL`, `VITE_FIREBASE_*`, `VITE_ADMIN_ID`, `CYPRESS_USER_*`.

## Workflow automation

Scaffolding subagents in `.claude/agents/` (invoke via the Agent tool):

- **create-component** — scaffolds a new component with folder structure and tests
- **create-page** — scaffolds a new page with route integration and tests
- **create-redux-slice** — scaffolds a new Redux slice with thunks/RTK Query and tests

## Keeping README.md in sync

`README.md` is the user-facing source of truth for setup, scripts, and structure — it drifts easily. Update it in the same change whenever you:

- Add, remove, or rename an `npm run` script (update the Scripts section)
- Add, remove, or rename a required `.env` variable (update the Environment Variables section)
- Add, remove, or rename a top-level folder, or a `src/` subfolder (update the Folder Structure tree)
- Add or change a GitHub Actions workflow (update the CI/CD Workflows section, including the summary table)
- Add, remove, or materially change a user-facing feature (update the Features section)
- Add or restructure `.claude/` or `.github/` guidance files (update the AI Assistance sections)

## Things to avoid

- Do not commit `.env` or `certs/`
- Do not mock the Firebase Realtime Database in integration tests
- Do not add comments that describe what the code does — only why
- Do not create new top-level `src/` folders without updating this file
- Do not re-inline domain-specific detail here — extend the relevant `.claude/docs/*.md` file instead
- Do not let `README.md` go stale — see "Keeping README.md in sync" above
