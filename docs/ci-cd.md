# CI/CD Workflows

This project uses GitHub Actions to automate key development and monitoring tasks.

## 1. Vitest Unit Tests

- **Workflow File:** `.github/workflows/vitest-unit-tests.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `package.json`, or `vitest.config.*`)
    - On **pull requests** to `main`, except those that only change Markdown, `.claude/**`, `.devcontainer/**`, `.vscode/**` or `.github/**` (workflow files, `.github/labels.json` and `.github/scripts/**` still trigger it)
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs the full Vitest unit/integration test suite to ensure code quality.
- **Install scripts check:** Fails if `npm install-scripts ls` reports a package whose install script isn't covered by `package.json` `allowScripts`. Entries are pinned to a version, so a dependency bump (including a Dependabot PR) makes its entry stale and `npm ci` skips the script — e.g. the Cypress binary download. Fix it with `npm install-scripts approve <pkg>` and commit `package.json`.
- **Merge Blocking:** Not a required check — see [Branch Protection](#-branch-protection). Don't merge a pull request whose run failed.

Runs `npm run vitest:run` — see [Scripts](../README.md#scripts) for other Vitest commands.

---

## 2. Cypress E2E Tests

- **Workflow File:** `.github/workflows/cypress-e2e.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `cypress/**`, `package.json`, or `cypress.config.*`)
    - On **pull requests** to `main`, except those that only change Markdown, `.claude/**`, `.devcontainer/**`, `.vscode/**` or `.github/**` (workflow files still trigger it)
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress end-to-end (E2E) tests against the running application to verify user flows and integration with backend services. Runs `npm run cy:run:e2e` — see [Scripts](../README.md#scripts). The dev server is awaited with a `curl` retry loop (up to 60 seconds) rather than the Cypress action's URL ping, which gave up on the first unexpected connection error.

---

## 3. Cypress Component Tests

- **Workflow File:** `.github/workflows/cypress-component.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**/__tests__/**`, `src/**/*.jsx`, `src/**/*.tsx`, `cypress.config.*`, or `package.json`)
    - On **pull requests** to `main`, except those that only change Markdown, `.claude/**`, `.devcontainer/**`, `.vscode/**` or `.github/**` (workflow files still trigger it)
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress component tests to verify individual React components in isolation. Runs `npm run cy:run:ct` — see [Scripts](../README.md#scripts).

---

## 4. GitHub Auto Label Pull Requests

- **Workflow File:** `.github/workflows/github-auto-label-prs.yml`
- **Triggers:**
    - On **pull_request_target** events (`opened`, `synchronize`, `reopened`, `edited`), so Dependabot PRs can be labelled too; only the base branch is checked out
- **Purpose:** Gives each pull request one **type** label from its conventional-commit title (or branch prefix), e.g. `chore`, `fix`, `feature`, and the **area** labels whose paths its changed files match, e.g. `ui`, `testing`, `config`. Labels it no longer matches are removed; status labels and Dependabot's `javascript` are left alone. The rules live in [`.github/labels.json`](../.github/labels.json) — see [Labels](#labels).

---

## 5. GitHub Issue Intake

- **Workflow File:** `.github/workflows/github-issue-intake.yml`
- **Triggers:**
    - On **issue** events (`opened`, `reopened`, `edited`, `labeled`, `unlabeled`)
    - Manually via **Actions → "Run workflow"** (takes an issue number)
- **Purpose:** Adds new issues to the `Trip Fotos React` GitHub Project in **Triage**, gives them the **type** label for their title prefix (`chore:` → `chore`; none without a prefix) and assigns the default assignee. Area labels arrive later from the PR that closes the issue. Editing an issue never changes its status. Labels you add (`ready`, `in-progress`, `blocked`) move it across the board (see [Project Board Statuses](#project-board-statuses)).

---

## 6. GitHub Project Item Lifecycle

- **Workflow File:** `.github/workflows/project-item-lifecycle.yml`
- **Triggers:**
    - On **pull_request_target** events (`opened`, `reopened`, `synchronize`, `edited`, `ready_for_review`, `converted_to_draft`, `closed`)
- **Purpose:** Keeps the issues a pull request closes (`Closes #N`, one or more) in sync with the `Trip Fotos React` GitHub Project lifecycle. The board has one card per piece of work: the issue, with its PRs under **Linked pull requests**. A PR with no linked issue gets a tracking issue; Dependabot PRs get none and appear as their own card instead. Merging removes the `in-progress` label from the issues it closes and, when it closes exactly one issue (a tracking issue included), copies the PR's type and area labels to it; a PR closing several issues leaves their labels alone.
- **Secret (Optional but Recommended):** `PROJECT_AUTOMATION_TOKEN`
    - Used for Project v2 write operations when `github.token` does not have enough access.

### Token Rotation / Recovery Guide

If the workflow logs `Resource not accessible by integration`, check the runbook:

- `.github/project-automation-token.md`

The runbook includes expiry handling, recreation steps, secret update instructions, and post-rotation validation.

---

<a id="project-board-statuses"></a>

### Project Board Statuses

Every Status is set by the two workflows above. Items also carry **Kind** (Epic / Feature / Bug / Chore / Deps) and **Workstream** (Vue parity / Tooling & AI / Maintenance) fields, set by hand.

| Status      | Meaning                                         | Moved there when                                                               |
| ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Triage      | New, not yet assessed                           | An issue is opened                                                             |
| Backlog     | Accepted, not scheduled                         | You add any label to an issue in Triage, or reopen a Done issue                |
| Ready       | Queued, dependencies met                        | You add the `ready` label, or a linked PR is closed without merging            |
| In progress | Being built                                     | You add the `in-progress` label, or a draft PR that closes the issue is opened |
| Blocked     | Waiting on a decision or an external dependency | You add the `blocked` label; removing it restores the status                   |
| In review   | PR open for review                              | The PR is opened (not as a draft) or marked ready for review                   |
| Done        | Merged                                          | The PR is merged                                                               |

While an issue has the `blocked` label its PR events leave it in Blocked; only a merge moves it on.

Add the `in-progress` label when you start work, before any PR exists. It moves an issue in Triage, Backlog or Ready to In progress, never one already In review or Done. Removing it restores the status. An issue that keeps the label returns to In progress, not Ready, when its PR is closed without merging, and a merge removes the label.

### Project README and status updates

The project's short description and README (Project > Settings) and its status updates are written by hand — no workflow touches them. Keep them current:

- **Status update** — post one after a PR merges that ships user-visible work, closes a backlog item or changes the "Next up" list, and when the overall status changes (On track / At risk / Off track). List what shipped with PR numbers and what is next.
- **Project README** — edit it when the repo README's About, Features, Stack or Status sections change.
- **Short description** — edit it only if the app's purpose changes.

```bash
gh project edit 2 --owner andres-codigo --description "<text>" --readme "<markdown>"
gh api graphql -f query='mutation($p:ID!,$b:String!){createProjectV2StatusUpdate(input:{projectId:$p,status:ON_TRACK,body:$b}){statusUpdate{id}}}' -f p=PVT_kwHOAybMeM4BCojE -f b="<markdown>"
```

Fetch the current README first with `gh project view 2 --owner andres-codigo --format json`. Skip a status update for dependency bumps, test-only and docs-only merges.

---

## 7. GitHub Label Sync

- **Workflow File:** `.github/workflows/github-label-sync.yml`
- **Triggers:**
    - On **push** to `main` that changes `.github/labels.json` or `.github/scripts/labels.mjs`
    - Manually via **Actions → "Run workflow"** (a dry run by default, which only logs the plan)
- **Purpose:** Makes the repository's labels match `.github/labels.json`: creates and updates them, renames or merges retired ones listed under `replaced` (so issues and PRs keep the meaning), and deletes labels the file does not define.

<a id="labels"></a>

### Labels

[`.github/labels.json`](../.github/labels.json) is the single source of truth for labels. Every workflow above reads it through `.github/scripts/labels.mjs`, and none hard-codes a label name. To add, rename or recolour a label, or change which files map to an area, edit that file only; the sync workflow applies it when merged.

| Group  | Labels                                                                                                                                                   | Set by                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Type   | `feature`, `fix`, `enhancement`, `refactor`, `docs`, `test`, `chore` (the [branch prefixes](../CLAUDE.md#branch-naming))                                 | Title or branch prefix — PR labeller and issue intake       |
| Area   | `ui`, `styling`, `redux/state`, `constants`, `utilities`, `firebase`, `assets`, `testing`, `documentation`, `dependencies`, `config`, `build/deployment` | Changed files — PR labeller; copied to the issue on merge   |
| Status | `ready`, `in-progress`, `blocked`                                                                                                                        | You — see [Project Board Statuses](#project-board-statuses) |
| Other  | `javascript`, `duplicate`                                                                                                                                | Dependabot / you                                            |

---

## 8. CodeQL Code Scanning

- **Configured In:** **Settings → Advanced Security → CodeQL analysis** (GitHub-managed **Default setup** — no workflow file)
- **Triggers:** On push and pull requests to `main`, plus a weekly scheduled scan
- **Purpose:** Scans JavaScript/TypeScript and the GitHub Actions workflows for security vulnerabilities. Results appear under **Security → Code scanning**.
- **Note:** Code scanning requires the repository to be **public** — on a private personal repository it is unavailable and the check will fail.

## 🔒 Branch Protection

The **Protect main** repository ruleset (**Settings → Rules → Rulesets**) applies to `main`, with no bypass list:

- Changes must arrive through a pull request, merged by squash or rebase (no approvals required)
- Force-pushes and deleting the branch are blocked
- **No required status checks.** The test workflows skip docs- and tooling-only pull requests with `paths` filters, and a required check that never runs would block those pull requests from merging

The ruleset is kept in [`.github/rulesets/protect-main.json`](../.github/rulesets/protect-main.json). To recreate it, or apply an edit, run as a repository admin:

```bash
gh api -X POST repos/{owner}/{repo}/rulesets --input .github/rulesets/protect-main.json
# or, to update the existing ruleset:
gh api -X PUT repos/{owner}/{repo}/rulesets/<id> --input .github/rulesets/protect-main.json
```

## 🛠 Manual Triggers

Some workflows, like the **Vitest test runner**, can be manually executed from the GitHub UI:

1. Navigate to the **Actions** tab of the repository
2. Select the desired workflow (e.g., **"Run Unit Tests (Vitest)"**, **"E2E - Run Cypress Page Tests"**, or **"Component - Run Cypress Component Tests"**).
3. Click the **"Run workflow"** button on the right side
4. The workflow will be executed immediately (no input needed)

> This is useful for manually re-running workflows after configuration changes or failed automated runs.

---

## 📝 Summary Table

| Workflow Name                     | File                                           | Tests Type       | Triggered On     |
| --------------------------------- | ---------------------------------------------- | ---------------- | ---------------- |
| Vitest - Run Unit Tests           | `.github/workflows/vitest-unit-tests.yml`      | Unit/Integration | Push/PR/Manual   |
| Cypress - Run E2E Page Tests      | `.github/workflows/cypress-e2e.yml`            | E2E              | Push/PR/Manual   |
| Cypress - Run Component Tests     | `.github/workflows/cypress-component.yml`      | Component        | Push/PR/Manual   |
| GitHub - Auto Label Pull Requests | `.github/workflows/github-auto-label-prs.yml`  | Automation       | PR Target Events |
| GitHub - Issue Intake             | `.github/workflows/github-issue-intake.yml`    | Automation       | Issue Events     |
| GitHub - Project Item Lifecycle   | `.github/workflows/project-item-lifecycle.yml` | Automation       | PR Target Events |
| GitHub - Label Sync               | `.github/workflows/github-label-sync.yml`      | Automation       | Push/Manual      |

---

> **Note:** Ensure all required environment variables and secrets are set in your repository settings for CI to work correctly. The Vitest, component and E2E workflows read the Firebase config from the `VITE_FIREBASE_*` and `VITE_DATABASE_URL` secrets; E2E also needs `VITE_API_URL`, `VITE_API_KEY`, `VITE_BACKEND_BASE_URL` and `CYPRESS_USER_*`.
