# CLAUDE.md — trip-fotos-react

## Stack and src/ structure

Trip Fotos: a React/Firebase app for finding popular travel destinations tied to registered travellers, deployed on Vercel. See the README [Stack](README.md#stack) and [Folder Structure](README.md#folder-structure) sections.

## Branch naming

Branches must use a type prefix, enforced by the `require-open-pr` hook: `feature/` (new user-facing feature), `fix/` (bug fix), `docs/`, `refactor/` (no behaviour change), `enhancement/` (improvement to an existing feature), `chore/` (deps, config, CI) or `test/`. Example: `docs/update-constants-readme`, `fix/auth-redirect-loop`.

Work from a Claude Design session (design system or UI redesign) never lands on `main` directly: create an issue and a `feature/` or `enhancement/` branch first, and reference the design artifact link in the issue.

## Finishing a PR

Run `/finish-pr` when the work passes `/verify`: README Status and Project README, ready for review, poll CI, merge (squash by default; rebase-merge multi-commit PRs whose commits are individually meaningful), prune, release PR, status update. Merge commits are disabled.

## Language & Tone

- Use British English (`en-GB`) for all code comments, documentation, and strings (e.g., `colour`, `behaviour`, `optimise`).
- Commit messages follow `en-GB` spelling conventions.
- Label every issue, epic or PR number with a few words, never a bare `#N`: `ISSUE#438(#442) (upload progress)` for a piece of work, `#378 (lean the repo)` otherwise.

## Domain-Specific Guidance

Detailed conventions live in `.github/instructions/` — the single source of truth shared with GitHub Copilot. Read the relevant file when working in that area, rather than expecting it to be summarised here. A path-scoped rule in `.claude/rules/` per row loads a pointer to its file when matching files are touched (Claude Code ignores `applyTo`, so the rules are what make the files reach it):

| File                                                                          | Applies to                          | Covers                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| [components.instructions.md](.github/instructions/components.instructions.md) | `src/components/**`                 | Folder structure, prop-types, reusability, accessibility, testing |
| [pages.instructions.md](.github/instructions/pages.instructions.md)           | `src/pages/**`                      | Route composition, data loading, testing                          |
| [store.instructions.md](.github/instructions/store.instructions.md)           | `src/store/**`                      | Thunks, error handling pattern, persistence, testing              |
| [styles.instructions.md](.github/instructions/styles.instructions.md)         | `src/**/*.{jsx,css}`                | Tailwind utilities, `cn()`, tokens, layers, spacing, states       |
| [testing.instructions.md](.github/instructions/testing.instructions.md)       | `**/__tests__/**`, `cypress/e2e/**` | Vitest/Cypress organisation, test data, anti-flakiness            |

## Key conventions

Imports (`@/` alias, no parent-relative paths) are enforced by ESLint and listed in `.github/copilot-instructions.md`; comment style is in `.claude/rules/comments.md`.

### Constants

- Import from the subdirectory barrel (`@/constants/travellers`), never a file inside it; ESLint enforces this
- Domain constants (auth, travellers) are separate from UI constants

## UI changes

A change that can alter how the UI looks (styling, layout, spacing, markup) is checked in a real browser before it merges: run `/ui-check`. Lint, Vitest, component tests and the build do not show visual regressions; nothing is assumed from a passing test or a matching file. The checklist is in [testing.instructions.md](.github/instructions/testing.instructions.md#visual-check-for-ui-changes).

## Dev commands

`npm run lint`, `vitest:run`, `cy:run:ct` and `build` are the gates `/verify` runs; full list in the README [Scripts](README.md#scripts) section.

## Environment

Requires `.env` with Firebase config — see `.env.example` or README Setup section.
Required keys: `VITE_API_URL`, `VITE_API_KEY`, `VITE_BACKEND_BASE_URL`, `VITE_FIREBASE_*`, `CYPRESS_USER_*`. The admin role is a Firebase custom claim (`npm run admin:claim`), not an env value. `.env.emulators` (committed, no secrets) points the app at the local Firebase emulators (`npm run emulators`, then `npm run dev -- --mode emulators`); never set its `VITE_USE_FIREBASE_EMULATORS` or `VITE_DATABASE_NAMESPACE` in Vercel.

## Workflow automation

Detail lives in `.claude/` and [docs/ai-assistance.md](docs/ai-assistance.md).

- **Agents** (`.claude/agents/`, wrappers around `.github/agents/*.agent.md` — edit the workflow there): `create-component`, `create-page`, `create-redux-slice`, `create-hook`. Scaffold every new component, page, hook and Redux slice with its agent, not by hand; `/start-issue` prompts for it
- **`.claude/settings.json`** — shared permissions and a `PostToolUse` hook (`.claude/hooks/lint-edited-file.mjs`) that lints every edited file
- **`/verify`** — runs the gates the change can affect as a pass/fail table; run before committing. `/verify all` forces every gate, `/verify e2e` adds the emulator E2E suite. If the code changes mid-run, stop it and start a fresh one; never rely on a stale result ([details](docs/ai-assistance.md#skills))
- **Issue order** — on "start #N", or after creating an issue, run `/start-issue` yourself before any file change; it enforces blockers and board order ([Starting an issue](docs/ci-cd.md#starting-an-issue), [board statuses](docs/ci-cd.md#project-board-statuses))
- **Vue parity programme** — archived in `docs/ai-assisted-dev-story/vue-parity-programme/`; not loaded
- Personal overrides go in the gitignored `.claude/settings.local.json`

## Keeping README.md in sync

`README.md` is the user-facing source of truth for setup, scripts and structure; it stays a summary, with detail in `docs/`. Update it in the same change as any user-facing feature, any new, renamed or removed top-level or `src/` folder (Folder Structure tree), or any change to its About, Features, Stack or Status sections. Script, env, workflow and guidance-file changes load the full list from `.claude/rules/readme-sync.md`; the end-of-change refresh is in `/finish-pr`.

## Versioning

release-please sets the version from PR titles on `main`; never edit `version` by hand. Title prefixes and the release PR: [details](docs/ci-cd.md#9-release-please), `/finish-pr`.

## Things to avoid

- Do not commit `.env` or `certs/`
- Do not mock the Firebase Realtime Database in integration tests
- Do not create new top-level `src/` folders without updating the README Folder Structure tree
- Do not re-inline domain-specific detail here — extend the relevant `.github/instructions/*.instructions.md` file instead
- Do not let `README.md` go stale — see "Keeping README.md in sync" above
- Do not call a new external origin without adding it to the CSP `connect-src` in `vercel.json`
- Route and Firebase rules changes: see `.claude/rules/deploy-config.md`
