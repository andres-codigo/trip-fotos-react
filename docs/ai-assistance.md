# AI Assistance

## AI Assistance & Copilot Guidance

This project includes structured guidance files for GitHub Copilot to ensure generated code adheres to project standards.

### Workspace-Level Instructions

- **File**: `.github/copilot-instructions.md`
- **Purpose**: Global rules for language, imports, naming conventions, and type safety.
- **Usage**: Copilot automatically references this file for behaviour guidance on all files.

### Domain-Specific Instructions

Detailed guidance for specific areas of the codebase:

- **Components**: `.github/instructions/components.instructions.md` — Folder structure, reusability patterns, testing, and accessibility.
- **Pages**: `.github/instructions/pages.instructions.md` — Route-level composition, data loading orchestration, and page testing.
- **Redux Store**: `.github/instructions/store.instructions.md` — Slices, thunks, error handling, persistence, and testing.
- **Styling**: `.github/instructions/styles.instructions.md` — SCSS modules, variables, mixins, and naming conventions.
- **Testing**: `.github/instructions/testing.instructions.md` — Vitest/Cypress standards, shared test data paths, and anti-flakiness practices.

### Workflow Agents

Automated scaffolding workflows for common tasks:

- **Create Component**: Use the `create-component` agent to scaffold new components with full structure and tests.
- **Create Page**: Use the `create-page` agent to scaffold new pages with route integration and tests.
- **Create Redux Slice**: Use the `create-redux-slice` agent to scaffold new Redux slices with thunks and tests.
- **Create Hook**: Use the `create-hook` agent to scaffold new custom hooks with tests, component-scoped or shared.

### Keeping Guidance In Step With The Code

Each concern (data fetching, error messages, form errors, loading state, hooks, spacing, test selectors) has one documented pattern. A change that introduces a different way of doing one must update the matching instruction file in the same PR, or reuse the documented one. Where the code has not yet converged, the instruction file says "target" and names the tracking issue, so a reader can tell the rule from the exception.

## AI Assistance & Claude Code Guidance

Claude Code shares the Copilot guidance above rather than keeping its own copy, so both tools follow a single source of truth. Claude-specific automation — hooks, permissions, and skills — lives in `.claude/`.

### Workspace-Level Instructions

- **File**: `CLAUDE.md`
- **Purpose**: Global rules — branch naming, conventions, dev commands, environment, and pointers to detailed guidance (the stack, full script list and folder structure live in this README, not duplicated there, to keep the per-request context small).
- **Usage**: Claude Code automatically reads this file at the start of every session in this repo.

### Domain-Specific Guidance

`CLAUDE.md` points Claude Code to the `.github/instructions/*.instructions.md` files listed above, which it reads on demand when working in the relevant area.

### Workflow Agents

Scaffolding subagents in `.claude/agents/` (invoke via the Agent tool). Each is a thin wrapper that delegates to the matching `.github/agents/*.agent.md` workflow, and runs on Sonnet (`model: sonnet`) to keep mechanical scaffolding cheap:

- **create-component**: Scaffold new components with full structure and tests.
- **create-page**: Scaffold new pages with route integration and tests.
- **create-redux-slice**: Scaffold new Redux slices with thunks and tests.
- **create-hook**: Scaffold new custom hooks with tests.

### Hooks & Permissions

- **File**: `.claude/settings.json` (committed; personal overrides go in the gitignored `.claude/settings.local.json`)
- **Hook**: a `PostToolUse` hook runs `.claude/hooks/lint-edited-file.mjs` after every edit, applying Prettier and `eslint --fix`, and Stylelint to edited component and page stylesheets. Any remaining ESLint or Stylelint errors are fed back to Claude so they are fixed in the same turn.
- **Permissions**: routine checks (lint, Vitest, component tests, build, read-only git), staging, committing and pushing, read-only `gh issue`/`gh project` queries and opening draft PRs run without prompting; PR merges, installs, and E2E runs ask first, and opening a non-draft PR prompts by default; reading `.env`/`certs/`, force-pushes and hard resets are denied. Pushing is safe to allow because GitHub rejects direct pushes to `main` — see [Branch Protection](ci-cd.md#-branch-protection).

### Skills

- **`/verify`** (`.claude/skills/verify/`): runs ESLint and Stylelint, Vitest, Cypress component tests, and the production build, then reports a pass/fail table. `changed-gates.mjs` compares the branch with `main` and picks only the gates the change can affect (e.g. a `cypress/e2e/` change runs ESLint only; docs, `.claude/` or `.github/` changes run none), so CI on the pull request, which runs every workflow, stays the full check. `/verify all` forces every gate. Use before committing or opening a pull request. It runs on Haiku (`model: haiku`) in a forked context (`context: fork`), so test and build logs stay out of the main conversation. `run-gates.mjs` runs the gates in one call, writes full logs to `node_modules/.cache/verify/` and prints a line per gate with any error lines, and caches passes against a hash of the working tree (including uncommitted and untracked files), so a gate that already passed on identical code reports `cached` instead of running again — e.g. `/verify e2e` straight after `/verify` runs only E2E. `/verify all` bypasses the cache. A run reflects the code as it was when it started, so if the code changes mid-run, stop it and run it again.
- **`/verify e2e`**: additionally runs the Cypress E2E suite via `.claude/skills/verify/run-e2e.mjs`, which reuses a dev server on port 3000 or starts one over HTTP (as CI does) and stops it afterwards. Opt-in and approval-gated, because the tests use the live Firebase project and `.env` credentials. `/verify` prints an `E2E advised` line, without running E2E, when a change touches routing, pages, the store, Firebase services, route or API constants, or the E2E specs — see [testing.instructions.md](../.github/instructions/testing.instructions.md#when-to-run-e2e-locally) for when to run it locally.
- **`/start-issue`** (`.claude/skills/start-issue/`): a thin wrapper that runs the [Starting an issue](ci-cd.md#starting-an-issue) sequence for an issue number without asking about Kind, Workstream or labels. It asks only when another issue in the same workstream is already Ready. A `PreToolUse` hook (`.claude/hooks/require-open-pr.mjs`) backs it up by blocking `Edit`, `MultiEdit` and `Write` on `main`, on a branch without a type prefix (`feature/`, `fix/`, `docs/`, `refactor/`, `enhancement/`, `chore/` or `test/`; `dependabot/` and `release-please--` branches pass this check) or on a branch with no open pull request, so the issue and draft PR must exist before the first file change. It ignores gitignored files, caches a found PR per branch and fails open if `gh` is unavailable.
- **`/finish-pr`** (`.claude/skills/finish-pr/`): a thin wrapper over [Finishing an issue](ci-cd.md#finishing-an-issue) that adds the pre-ready checklist (`/verify`, visual check, README Status, Project README, conventional-commit title) and the post-merge steps (release-please PR, Project status update, epic closing). Holds the finish-time procedure that used to sit in `CLAUDE.md`.

### Archived: Vue parity programme

The tooling that ported the remaining Vue features (epic #274, delivered in #291) — the `parity-auditor` agent, the `/backlog-sync`, `/implement-item` and `/parity-run` skills, and the `Stop` hook guard — has been retired from `.claude/` so it no longer loads in every session. It is kept for reference, with the plan, gap report and a write-up, in [`ai-assisted-dev-story/vue-parity-programme/`](ai-assisted-dev-story/vue-parity-programme/README.md).
