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
- **Styling**: `.github/instructions/styles.instructions.md` — Tailwind utilities, `cn()`, semantic tokens, layers and state variants.
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

`CLAUDE.md` points Claude Code to the `.github/instructions/*.instructions.md` files listed above. Claude Code ignores their `applyTo` frontmatter (only Copilot honours it), so one path-scoped rule per file in `.claude/rules/` (`components`, `pages`, `store`, `styles`, `testing`) loads a one-line pointer to its instructions file whenever a matching file is touched. The instructions files stay the single source of truth; the rules copy nothing.

### Workflow Agents

Scaffolding subagents in `.claude/agents/` (invoke via the Agent tool). Each is a thin wrapper that delegates to the matching `.github/agents/*.agent.md` workflow, and runs on Opus (`model: opus`), since scaffolding is engineering work:

- **create-component**: Scaffold new components with full structure and tests.
- **create-page**: Scaffold new pages with route integration and tests.
- **create-redux-slice**: Scaffold new Redux slices with thunks and tests.
- **create-hook**: Scaffold new custom hooks with tests.

New components, pages, hooks and slices are scaffolded with these agents rather than by hand; `/start-issue` reminds you after it starts an issue.

### Hooks & Permissions

- **File**: `.claude/settings.json` (committed; personal overrides go in the gitignored `.claude/settings.local.json`)
- **Hook**: a `PostToolUse` hook runs `.claude/hooks/lint-edited-file.mjs` after every edit, applying Prettier and `eslint --fix`. Any remaining ESLint errors are fed back to Claude so they are fixed in the same turn.
- **Rules** (`.claude/rules/`): conventions that load only when Claude works on matching files, via `paths:` frontmatter, instead of in every session through `CLAUDE.md`. `comments.md` holds the comment style for source, Cypress and CI-script files; `readme-sync.md` lists when a change must also update the README and `docs/` (loaded when `package.json`, `.env*`, `.github/`, `.claude/`, `docs/` or the README are touched); `deploy-config.md` holds the route and Firebase rules checks (loaded for `vercel.json`, `firebase/`, `paths.js` and `src/services/`); `components.md`, `pages.md`, `store.md`, `styles.md` and `testing.md` each point to the matching instructions file. Import style needs no rule: ESLint enforces it and `.github/copilot-instructions.md` lists it.
- **Weekly sweep** (a cloud routine, outside git): every Monday at 08:00 UTC a read-only Sonnet agent lists open `release-please--` and Dependabot PRs (flagging release PRs open over 7 days and Dependabot PRs over 14), and reports a stale README Status or drift between the README, `package.json`, `.env.example`, `vercel.json` and these AI docs. It edits nothing and reports in the run log; manage, pause or read it at [claude.ai/code/routines](https://claude.ai/code/routines/trig_011CuWEwHx1YMKDZXcQ36Xis). It complements the CI drift checks, which only run on code changes, and relies on `gh` being authenticated in the cloud environment; if it is not, the run says so rather than guessing.
- **Permissions**: routine checks (lint, Vitest, component tests, build, read-only git), staging, committing and pushing, read-only `gh issue`/`gh project`/`gh pr` queries (including `gh pr checks`), opening draft PRs, marking a PR ready and merging it run without prompting; installs and live E2E runs ask first, and opening a non-draft PR prompts by default; reading `.env`/`certs/`, force-pushes and hard resets are denied. Pushing is safe to allow because GitHub rejects direct pushes to `main` — see [Branch Protection](ci-cd.md#-branch-protection).

### Skills

- **`/verify`** (`.claude/skills/verify/`): runs ESLint, Vitest, Cypress component tests, the production build and a Prettier check of workflow YAML, then reports a pass/fail table. `changed-gates.mjs` compares the branch with `main` and picks only the gates the change can affect (e.g. a `cypress/e2e/` change runs ESLint only; docs, Markdown or JSON under `.claude/` or `.github/` changes run none, while a `.js` or `.mjs` file under `.claude/`, `.github/` or `scripts/` runs ESLint and Vitest, a change to `.github/workflows/` or `.github/actions/` YAML runs only the Prettier check, and `vercel.json`, `firebase/` or `.env.example`, which the drift test reads, run Vitest), so CI on the pull request, which runs every workflow, stays the full check. `/verify all` forces every gate. Use before committing or opening a pull request. Run it once per commit, after every edit. A change to `src/**/*.{jsx,css}` (tests aside) goes through `/ui-check` first: `verify.mjs` refuses to start (exit 3) until `/ui-check` has recorded `pass`, a pass that holds through later edits touching no UI file (`uiCheckGap` in `changed-gates.mjs`), and `/verify` keeps the `/ui-check` result when it clears the status line. It is one script, `verify.mjs`, run in the background from the main session with no subagent, so a run costs a few hundred tokens: it plans the gates, runs them (ESLint, Vitest, the build and the YAML check in parallel with each other, then the component tests; with E2E, the component tests first and the other gates alongside E2E, which mostly waits on the emulators: the container is I/O-bound, and the fast gates alongside the component tests slow that gate by minutes; the two Cypress gates never overlap, as they share the screenshots folder), writes full logs to `node_modules/.cache/verify/` and prints the finished table with the first error lines of any failure. Passes are cached per gate against a hash of the working tree (including uncommitted and untracked files): a gate is skipped as `cached` when it passed on this tree, or on an earlier one with no change since that it depends on (`gatesForFile` in `changed-gates.mjs`), so an edit to a `.claude/**/*.mjs` file after a full pass re-runs only ESLint and Vitest, and `/verify e2e` straight after `/verify` runs only E2E. `/verify all` bypasses the cache. When a Cypress gate (component tests or E2E) fails, an `after:spec` handler in `cypress.config.js` (`spec-results.mjs`) has recorded which specs passed on that tree in `specs.json`; the next `/verify` on the same tree reruns only the others (`--spec`), notes which in the table, and records the gate as passed once every spec in its suite has passed on that tree, which the commit hook accepts like a full-suite pass. Any change to the tree discards the per-spec results; `/verify all` runs whole suites. It refuses to start (exit 3, with the reason) while another `/verify` is alive, the emulator ports are in use or a Cypress run (such as a `/ui-check` capture) is going, since they clash over ports and the screenshots folder. If the code changes mid-run, it says so at the end; run it again.
- **`/verify e2e`**: forces the Cypress E2E suite against the local Firebase emulators (`npm run cy:run:e2e:emulators`), which start, seed and stop with the run. It needs Java and adds start-up time, so it runs on its own only when the change calls for it; no live project or credentials are involved. `npm run cy:run:e2e:live` (the read-only smoke spec) is approval-gated. `/verify` runs E2E by itself, and prints an `e2e advised` line with the reasons, when a change touches routing, pages, the store, Firebase services, route or API constants, the Cypress config or the E2E specs — see [testing.instructions.md](../.github/instructions/testing.instructions.md#when-to-run-e2e-locally) for when to run it locally.
- **`/start-issue`** (`.claude/skills/start-issue/`): a thin wrapper (on the session model) around `node scripts/start-issue.mjs N`, which runs the [Starting an issue](ci-cd.md#starting-an-issue) sequence for an issue number in one go (Status, blockers, Kind, Workstream, labels, branch, draft PR) and is allowed without a permission prompt. A Vitest test pins the `gh` and `git` commands the script may run, it refuses to start unless it is on a clean `main`, and a `start-issue-guard` workflow fails any PR that changes the script or its test until the `script-reviewed` label is added. It asks about Kind, Workstream or labels only through the script's exit code 2, and about the order only when another issue in the same workstream is already Ready. `/verify`, `/ui-check` and `/finish-pr` share `.claude/skills/verify/reset-checks.mjs`, which clears the status-line ticks after a merge and at the start of every run. A `PreToolUse` hook (`.claude/hooks/require-open-pr.mjs`) backs it up by blocking `Edit`, `MultiEdit`, `Write` and any `Bash` command that writes inside the repository (a redirect, `tee`, `cp`, `mv`, `rm` or `touch` aimed at a repo path, `sed -i`, `git rm`, `git mv`, `git apply`, or a script patching files; quoted text, heredoc bodies and targets outside the repo are ignored, and the matching lives in `.claude/hooks/bash-writes.mjs` with a Vitest test) on `main`, on a branch without a type prefix (`feature/`, `fix/`, `docs/`, `refactor/`, `enhancement/`, `chore/` or `test/`; `dependabot/` and `release-please--` branches pass this check) or on a branch with no open pull request, so the issue and draft PR must exist before the first file change. It ignores gitignored files, caches a found PR per branch and fails open if `gh` is unavailable.
- **Commit hook** (`.claude/hooks/require-verify.mjs`, logic in `commit-gate.mjs` with a Vitest test): a `PreToolUse` hook on `Bash` that blocks `git commit` unless every gate the branch needs (E2E excepted, which CI covers) holds for the working tree in `/verify`'s per-gate cache, so running the gates by hand does not count. Docs-only changes (`*.md`, `docs/`) are exempt; it fails open on a git error.
- **Stop hook** (`.claude/hooks/require-status-refresh.mjs`): when the current branch's PR is open and ready for review (not a draft) but `README.md` is untouched, it blocks finishing a turn and points to `/finish-pr`, so the Status section is not forgotten. Drafts, `main`, `dependabot/` and `release-please--` branches pass, as does a second stop in the same turn; it fails open if `gh` is unavailable. It checks that the README changed, not that the Project README matches, which is outside git.
- **`/ui-check`** (`.claude/skills/ui-check/`): a thin wrapper over the [visual check](../.github/instructions/testing.instructions.md#visual-check-for-ui-changes) checklist (full-page screenshots at 390 and 1280px, plus 768px and either side of any breakpoint only when the change touches one, against `main`, logged-in pages and their states, every image opened) that adds the container specifics: the committed capture script `cypress/ui-check/capture.cy.js` (selected by `UI_CHECK=true`, so CI never runs it), never killing port 3000, never reading `.env`. `UI_CHECK_ONLY=<test names>` reruns only the matching captures on the branch, keeping the label's other shots, so a fix or a script edit is rechecked in about a minute; every fix it finds gets a test in the same change. It runs in the main session so the screenshots are looked at, not summarised by a subagent. The status line shows the `/verify` and `/ui-check` results only for the exact working tree they ran on (`verify.mjs` and `status.mjs` write the tree hash, `~/.claude/statusline.sh` compares it), so a tick vanishes after any later edit.
- **`/finish-pr`** (`.claude/skills/finish-pr/`): a thin wrapper over [Finishing an issue](ci-cd.md#finishing-an-issue) that adds the pre-ready checklist (`/verify`, visual check, README Status, Project README, conventional-commit title) and the post-merge steps (release-please PR, Project status update, epic closing). Holds the finish-time procedure that used to sit in `CLAUDE.md`.

### Archived: Vue parity programme

The tooling that ported the remaining Vue features (epic #274, delivered in #291) — the `parity-auditor` agent, the `/backlog-sync`, `/implement-item` and `/parity-run` skills, and the `Stop` hook guard — has been retired from `.claude/` so it no longer loads in every session. It is kept for reference, with the plan, gap report and a write-up, in [`ai-assisted-dev-story/vue-parity-programme/`](ai-assisted-dev-story/vue-parity-programme/README.md).
