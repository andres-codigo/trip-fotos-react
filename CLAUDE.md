# CLAUDE.md — trip-fotos-react

## What this app does

A React/Firebase app for finding popular travel destinations tied to registered travellers. Converted from a Vue Udemy course project ("Find a Coach") — reimagined as "Trip Fotos". Deployed on Vercel.

## Stack and src/ structure

See the README [Stack](README.md#stack) and [Folder Structure](README.md#folder-structure) sections.

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

## Merging PRs

- **Squash-merge** by default — one PR, one commit on `main`, titled with the PR's conventional-commit title
- **Rebase-merge** multi-commit PRs whose commits are individually meaningful (e.g. one commit per issue), so `git log`, `blame` and `bisect` keep them distinct
- Merge commits are disabled; head branches are auto-deleted on merge

## Language & Tone

- Use British English (`en-GB`) for all code comments, documentation, and strings (e.g., `colour`, `behaviour`, `optimise`).
- Commit messages follow `en-GB` spelling conventions.

## Domain-Specific Guidance

Detailed conventions live in `.github/instructions/` — the single source of truth shared with GitHub Copilot. Read the relevant file when working in that area, rather than expecting it to be summarised here:

| File                                                                          | Applies to                              | Covers                                                             |
| ----------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| [components.instructions.md](.github/instructions/components.instructions.md) | `src/components/**`                     | Folder structure, prop-types, reusability, accessibility, testing  |
| [pages.instructions.md](.github/instructions/pages.instructions.md)           | `src/pages/**`                          | Route composition, data loading, testing                           |
| [store.instructions.md](.github/instructions/store.instructions.md)           | `src/store/**`                          | RTK Query vs. thunks, error handling pattern, persistence, testing |
| [styles.instructions.md](.github/instructions/styles.instructions.md)         | `src/**/*.module.scss`, `src/styles/**` | SCSS modules, namespaced imports, colour naming                    |
| [testing.instructions.md](.github/instructions/testing.instructions.md)       | `**/__tests__/**`, `cypress/e2e/**`     | Vitest/Cypress organisation, test data, anti-flakiness             |

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
- Enforced by ESLint (`rules/imports.js`). `src/constants/**` and `src/testUtils/cypress/**` are exempt and keep relative imports, because the Cypress E2E bundle loads them and cannot resolve `@/`

## Dev commands

```bash
npm run lint             # ESLint check
npm run vitest:run:fast  # Unit/integration tests, no coverage
npm run cy:run:ct        # Cypress component tests (headless)
npm run build            # Production build → dist/
npm run analyse          # Bundle size visualiser
```

Full list in the README [Scripts](README.md#scripts) section.

## Environment

Requires `.env` with Firebase config — see `.env.example` or README Setup section.
Required keys: `VITE_API_KEY`, `VITE_BACKEND_BASE_URL`, `VITE_FIREBASE_*`, `CYPRESS_USER_*`. The admin role is a Firebase custom claim (`npm run admin:claim`), not an env value.

## Workflow automation

Detail lives in `.claude/` and the README AI Assistance sections.

- **Agents** (`.claude/agents/`, wrappers around `.github/agents/*.agent.md` — edit the workflow there): `create-component`, `create-page`, `create-redux-slice`, `create-hook`
- **`.claude/settings.json`** — shared permissions and a `PostToolUse` hook (`.claude/hooks/lint-edited-file.mjs`) that lints every edited file
- **`/verify`** — runs the lint, Vitest, Cypress component test and build gates the change can affect (picked by `changed-gates.mjs`), as a pass/fail table; run before committing. `/verify all` forces every gate; `/verify e2e` adds the live-Firebase E2E suite. If the code changes while a run is in progress, stop it and start a fresh one — its result would describe stale code
- **Vue parity programme** — archived in `_ai-assisted-dev-story/vue-parity-programme/`; not loaded
- Personal overrides go in the gitignored `.claude/settings.local.json`

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
- Do not create new top-level `src/` folders without updating the README Folder Structure tree
- Do not add a route to `PATHS` without adding it to the `rewrites` allow-list in `vercel.json` — unlisted paths return a real 404 in production
- Do not add a database or Storage field, or a write limit, without updating `database.rules.json` / `storage.rules` to match — client-side validation must mirror the rules. Deploy rule changes with `npm run firebase:rules` before the production deploy
- Do not call a new external origin without adding it to the CSP `connect-src` in `vercel.json`
- Do not re-inline domain-specific detail here — extend the relevant `.github/instructions/*.instructions.md` file instead
- Do not let `README.md` go stale — see "Keeping README.md in sync" above
