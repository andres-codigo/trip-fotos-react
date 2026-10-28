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

Work from a Claude Design session (design system or UI redesign) never lands on `main` directly: create an issue and a `feature/` or `enhancement/` branch first, and reference the design artifact link in the issue.

## Merging PRs

- **Squash-merge** by default — one PR, one commit on `main`, titled with the PR's conventional-commit title
- **Rebase-merge** multi-commit PRs whose commits are individually meaningful (e.g. one commit per issue), so `git log`, `blame` and `bisect` keep them distinct
- Merge commits are disabled; head branches are auto-deleted on merge

## Language & Tone

- Use British English (`en-GB`) for all code comments, documentation, and strings (e.g., `colour`, `behaviour`, `optimise`).
- Commit messages follow `en-GB` spelling conventions.

## Domain-Specific Guidance

Detailed conventions live in `.github/instructions/` — the single source of truth shared with GitHub Copilot. Read the relevant file when working in that area, rather than expecting it to be summarised here:

| File                                                                          | Applies to                          | Covers                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| [components.instructions.md](.github/instructions/components.instructions.md) | `src/components/**`                 | Folder structure, prop-types, reusability, accessibility, testing |
| [pages.instructions.md](.github/instructions/pages.instructions.md)           | `src/pages/**`                      | Route composition, data loading, testing                          |
| [store.instructions.md](.github/instructions/store.instructions.md)           | `src/store/**`                      | Thunks, error handling pattern, persistence, testing              |
| [styles.instructions.md](.github/instructions/styles.instructions.md)         | `src/**/*.scss`                     | SCSS modules, class-scoped selectors, spacing, colour naming      |
| [testing.instructions.md](.github/instructions/testing.instructions.md)       | `**/__tests__/**`, `cypress/e2e/**` | Vitest/Cypress organisation, test data, anti-flakiness            |

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
- Enforced by ESLint (`config/rules/imports.js`). `src/constants/**` and `src/testUtils/cypress/**` are exempt and keep relative imports, because the Cypress E2E bundle loads them and cannot resolve `@/`

## UI changes

A change that can alter how the UI looks (SCSS, layout, spacing, markup) is checked in a real browser before it merges: full-page screenshots at mobile, tablet and desktop widths (390, 768, 1024 and 1280px), compared with `main`, **including the pages behind login and their states** (errors, dialogs, menus, long lists), and **every image is opened and looked at**: nothing is assumed from a passing test or a matching file. Lint, Vitest, component tests and the build do not show visual regressions. How: [testing.instructions.md](.github/instructions/testing.instructions.md#visual-check-for-ui-changes).

## Dev commands

```bash
npm run lint             # ESLint + Stylelint check
npm run vitest:run:fast  # Unit/integration tests, no coverage
npm run cy:run:ct        # Cypress component tests (headless)
npm run build            # Production build → dist/
npm run analyse          # Bundle size visualiser
```

Full list in the README [Scripts](README.md#scripts) section.

## Environment

Requires `.env` with Firebase config — see `.env.example` or README Setup section.
Required keys: `VITE_API_URL`, `VITE_API_KEY`, `VITE_BACKEND_BASE_URL`, `VITE_FIREBASE_*`, `CYPRESS_USER_*`. The admin role is a Firebase custom claim (`npm run admin:claim`), not an env value.

## Workflow automation

Detail lives in `.claude/` and [docs/ai-assistance.md](docs/ai-assistance.md).

- **Agents** (`.claude/agents/`, wrappers around `.github/agents/*.agent.md` — edit the workflow there): `create-component`, `create-page`, `create-redux-slice`, `create-hook`
- **`.claude/settings.json`** — shared permissions and a `PostToolUse` hook (`.claude/hooks/lint-edited-file.mjs`) that lints every edited file
- **`/verify`** — runs the lint, Vitest, Cypress component test and build gates the change can affect (picked by `changed-gates.mjs`), as a pass/fail table; run before committing. `/verify all` forces every gate fresh; `/verify e2e` adds the live-Firebase E2E suite. Passes are cached per working-tree hash, so repeat runs on unchanged code are cheap. If the code changes while a run is in progress, stop it and start a fresh one — its result would describe stale code, so never rely on it and stop any run that has become redundant
- **Issue order** — before recommending an issue or adding `ready`, check its blocked-by links and `Do after` line; never start one with an open blocker. Work is pulled in order Triage → Backlog (set Kind and Workstream, then label) → Ready → In progress; only epics may start from Backlog. Issue Intake removes out-of-order labels. On "start #N" run the full sequence in [Starting an issue](docs/ci-cd.md#starting-an-issue) yourself, without asking. A new issue you create is in Triage like any other: run the same sequence before the first file change, never branch and edit straight from creating it. Detail in [docs/ci-cd.md](docs/ci-cd.md#project-board-statuses)
- **Vue parity programme** — archived in `docs/ai-assisted-dev-story/vue-parity-programme/`; not loaded
- Personal overrides go in the gitignored `.claude/settings.local.json`

## Keeping README.md in sync

`README.md` is the user-facing source of truth for setup, scripts, and structure — it drifts easily. It stays a summary; detail lives in `docs/` (`ci-cd.md`, `testing.md`, `ai-assistance.md`, `local-https.md`). Update both in the same change whenever you:

- Add, remove, or rename an `npm run` script (update the Scripts section)
- Add, remove, or rename a `.env` variable (update `.env.example` and the Environment Variables table)
- Add, remove, or rename a top-level folder, or a `src/` subfolder (update the Folder Structure tree)
- Add or change a GitHub Actions workflow (update `docs/ci-cd.md` and the README Testing and CI summary table)
- Add, remove, or materially change a user-facing feature (update the Features section)
- **Finish any change** (Dependabot PRs excepted): refresh the Status section — move what shipped into Recently shipped, drop closed issues from Next up (version bumps are automatic, see "Versioning"). A change is not done until the Status is in the PR
- Add or restructure `.claude/` or `.github/` guidance files (update `docs/ai-assistance.md` and the README AI Assistance summary)
- Change the README's About, Features, Stack or Status sections (update the GitHub Project README to match)
- Merge a PR that ships user-visible work or changes the "Next up" list (post a Project status update) — see [Project README and status updates](docs/ci-cd.md#project-readme-and-status-updates)

## Versioning

release-please works the version out from PR titles on `main` — never edit `version` by hand. `feat:` or `feature:` bumps the minor version (`0.N.0`); `enhancement:`, `fix:` and `perf:` bump the patch. `chore`, `docs`, `test` and `refactor` PRs do not release on their own. After merging a releasing PR (any type above that bumps), merge the open release PR once its checks are green. Detail in [docs/ci-cd.md](docs/ci-cd.md#9-release-please).

## Things to avoid

- Do not commit `.env` or `certs/`
- Do not mock the Firebase Realtime Database in integration tests
- Do not add comments that describe what the code does — only why
- Do not create new top-level `src/` folders without updating the README Folder Structure tree
- Do not add a route to `PATHS` without adding it to the `rewrites` allow-list in `vercel.json` — unlisted paths return a real 404 in production
- Do not add a database or Storage field, or a write limit, without updating `firebase/database.rules.json` / `firebase/storage.rules` to match — client-side validation must mirror the rules. Deploy rule changes with `npm run firebase:rules` before the production deploy
- Do not call a new external origin without adding it to the CSP `connect-src` in `vercel.json`
- Do not re-inline domain-specific detail here — extend the relevant `.github/instructions/*.instructions.md` file instead
- Do not let `README.md` go stale — see "Keeping README.md in sync" above
