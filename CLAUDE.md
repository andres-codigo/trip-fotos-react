# CLAUDE.md — trip-fotos-react

Trip Fotos: a React/Firebase app for finding popular travel destinations tied to registered travellers, deployed on Vercel. Stack and layout: README [Stack](README.md#stack) and [Folder Structure](README.md#folder-structure).

## Shared conventions

The coding conventions shared with GitHub Copilot (en-GB, imports, naming, constants, data flow, removing what a change leaves unused, finishing checks) load from:

@.github/copilot-instructions.md

Domain detail lives in `.github/instructions/` (components, pages, store, styles, testing, CI and scripts) and `src/constants/README.md`. A path-scoped rule in `.claude/rules/` loads a pointer to the matching file when you touch its files, as Claude Code ignores `applyTo`. Extend those files rather than re-inlining detail here. Comment style is in `.claude/rules/comments.md`.

- Label every issue, epic or PR number with a few words, never a bare `#N`: `ISSUE#438(#442) (upload progress)` for a piece of work, `#378 (lean the repo)` otherwise.

## Branches and issues

- Branches need a type prefix (enforced by the `require-open-pr` hook): `feature/`, `fix/`, `docs/`, `refactor/` (no behaviour change), `enhancement/`, `chore/` (deps, config, CI) or `test/`.
- On "start #N", or after creating an issue, run `/start-issue` yourself before any file change; it enforces blockers and board order ([Starting an issue](docs/ci-cd.md#starting-an-issue)).
- Work from a Claude Design session never lands on `main` directly: `/design-change` runs it from brief to build, through an issue that links the design artifact and a `feature/` or `enhancement/` branch.
- Scaffold every new component, page, hook and Redux slice with its agent (`create-component`, `create-page`, `create-hook`, `create-redux-slice`), not by hand. The wrappers in `.claude/agents/` delegate to `.github/agents/*.agent.md`: edit the workflow there.

## Checks and finishing

- `/verify` runs the gates the change can affect; run it once per commit, after every edit, never alongside the emulators or a capture. `/verify all` forces every gate, `/verify e2e` adds the emulator E2E suite.
- A change that can alter how the UI looks is checked in a real browser with `/ui-check` before `/verify` and before it merges; passing tests show no visual regression.
- `/finish-pr` takes a passing change to a merged PR (squash by default; rebase-merge multi-commit PRs whose commits are individually meaningful; merge commits are disabled).
- release-please sets the version from PR titles on `main`; never edit `version` by hand ([details](docs/ci-cd.md#9-release-please)).
- `.claude/settings.json` holds the shared permissions and hooks ([details](docs/ai-assistance.md#hooks--permissions)); personal overrides go in the gitignored `.claude/settings.local.json`.

## README

`README.md` is the user-facing source of truth for setup, scripts and structure, and stays a summary with detail in `docs/`. Update it in the same change as any user-facing feature, any new, renamed or removed top-level or `src/` folder, or any change to its About, Features, Stack or Status sections. Script, env, workflow and guidance-file changes load the full list from `.claude/rules/readme-sync.md`.

## Environment

`.env` holds the Firebase config (keys in `.env.example`); the admin role is a Firebase custom claim (`npm run admin:claim`). `.env.emulators` (committed, no secrets) points the app at the local emulators (`npm run emulators`, then `npm run dev -- --mode emulators`); never set its `VITE_USE_FIREBASE_EMULATORS` or `VITE_DATABASE_NAMESPACE` in Vercel.

## Things to avoid

- Committing `.env` or `certs/`
- Mocking the Firebase Realtime Database in integration tests
- Calling a new external origin without adding it to the CSP `connect-src` in `vercel.json`
- Route and Firebase rules changes without `.claude/rules/deploy-config.md`
