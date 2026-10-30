# CI/CD Workflows

This project uses GitHub Actions to automate key development and monitoring tasks.

## 1. Vitest Unit Tests

- **Workflow File:** `.github/workflows/vitest-unit-tests.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `package.json`, or `vite.config.*`)
    - On **pull requests** to `main`, except those that only change Markdown, `.claude/**`, `.devcontainer/**`, `.vscode/**` or `.github/**` (workflow files, `.github/labels.json` and `.github/scripts/**` still trigger it)
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs the full Vitest unit/integration test suite to ensure code quality.
- **Install scripts check:** Fails if `npm install-scripts ls` reports a package whose install script isn't covered by `package.json` `allowScripts`. Entries are pinned to a version, so a dependency bump (including a Dependabot PR) makes its entry stale and `npm ci` skips the script — e.g. the Cypress binary download. Fix it with `npm install-scripts approve <pkg>` and commit `package.json`.
- **Merge Blocking:** Not a required check — see [Branch Protection](#-branch-protection). Don't merge a pull request whose run failed.

Runs `npm run vitest:coverage -- --run`, which executes the suite once with coverage — see [Scripts](../README.md#scripts) for other Vitest commands.

It also runs the drift checks in `.github/scripts/__tests__/drift.test.mjs`, which fail when a route in `PATHS` is missing from the `vercel.json` rewrites, a collection the store requests has no rule in `firebase/database.rules.json`, or the README Scripts and Environment Variables sections drift from `package.json` and `.env.example`. A README-only change does not trigger the job (Markdown is excluded), so a script entry deleted from the README alone is caught on the next code change; field-level rules still need the manual check below.

---

## 2. Cypress E2E Tests

- **Workflow File:** `.github/workflows/cypress-e2e.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `cypress/**`, `package.json`, or `cypress.config.*`)
    - On **pull requests** to `main`, except those that only change Markdown, `.claude/**`, `.devcontainer/**`, `.vscode/**` or `.github/**` (workflow files still trigger it)
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress end-to-end (E2E) tests against the running application to verify user flows and integration with backend services. Runs `npm run cy:run:e2e` — see [Scripts](../README.md#scripts). The dev server is awaited with a `curl` retry loop (up to 60 seconds) rather than the Cypress action's URL ping, which gave up on the first unexpected connection error.
- **Emulator job:** a second job, `Run Cypress E2E Tests (Firebase emulators)`, runs `npm run cy:run:e2e:emulators` against the local Firebase emulators. It needs no secrets, so it also runs on Dependabot PRs, while the live job and its Dependabot skip stay as they are. It installs Java (`actions/setup-java`, Temurin 21), caches `~/.cache/firebase/emulators` and the `npx` download of the pinned Firebase CLI (`~/.npm/_npx`) and sets the Firebase CLI to non-interactive (`CI`, no update check). Expect 20 to 40 seconds of emulator start-up on top of the run; watch the added minutes per PR.

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
- **Purpose:** Adds new issues to the `Trip Fotos React` GitHub Project in **Triage**, gives them the **type** label for their title prefix (`chore:` → `chore`; none without a prefix) and assigns the default assignee. Area labels arrive later from the PR that closes the issue. Editing an issue never changes its status. Runs queue per issue, so the `opened` and `labeled` events from creating a labelled issue do not race. Labels you add (`ready`, `in-progress`, `blocked`) move it across the board (see [Project Board Statuses](#project-board-statuses)).

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

Every Status is set by the two workflows above. Items also carry **Kind** (Epic / Feature / Bug / Chore / Deps / Test / Docs) and **Workstream** (Vue parity / Tooling & AI / Maintenance / Lean repo / Design system / E2E emulators) fields, set by hand.

| Status      | Meaning                                         | Moved there when                                                                                                                |
| ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Triage      | New, not yet assessed                           | An issue is opened                                                                                                              |
| Backlog     | Accepted, not scheduled                         | You add any label to a Triage issue whose Kind and Workstream are set, or reopen a Done issue                                   |
| Ready       | Queued, dependencies met                        | You add the `ready` label to a Backlog issue with no open blocker, or a linked PR is closed without merging                     |
| In progress | Being built                                     | You add the `in-progress` label to a Ready issue (an epic may come from Backlog), or a draft PR that closes the issue is opened |
| Blocked     | Waiting on a decision or an external dependency | You add the `blocked` label; removing it restores the status                                                                    |
| In review   | PR open for review                              | The PR is opened (not as a draft) or marked ready for review                                                                    |
| Done        | Merged                                          | The PR is merged; for an epic, you set it by hand when closing it ([Closing an epic](#closing-an-epic))                         |

While an issue has the `blocked` label its PR events leave it in Blocked; only a merge moves it on.

**Work is pulled in order: Triage → Backlog → Ready → In progress.** Triage is an inbox, not a work queue.

- **Assess (Triage → Backlog):** set **Kind** and **Workstream** on the board item, then add any label. A label on an issue missing either field leaves it in Triage and the workflow comments with what is missing.
- **Queue (Backlog → Ready):** add `ready`. Refused if the issue is still in Triage or has an open blocked-by link.
- **Start (Ready → In progress):** add `in-progress` before any PR exists. Refused from Triage, and from Backlog unless the issue is an epic.

A refused label is removed again with a comment saying why. The Issue Intake workflow enforces all of this. Removing `in-progress` restores the status. An issue that keeps the label returns to In progress, not Ready, when its PR is closed without merging, and a merge removes the label. A draft PR that closes the issue also moves it to In progress; that path is not guarded.

Epics (Kind = Epic, titled `Epic: ...`) group sub-issues in order. They are the one exception to Ready: they stay in Backlog until you add `in-progress` when the first sub-issue starts. An epic may carry an empty draft tracking PR that closes it; merging that PR would add nothing to `main`, so close it unmerged as part of [Closing an epic](#closing-an-epic).

Order within an epic:

- Hard dependencies are **blocked-by** links on the issue (`POST /repos/{owner}/{repo}/issues/{n}/dependencies/blocked_by`). They show a marker on the issue and board but never change Status, so Blocked keeps its meaning above. Start the body of a dependent issue with `Do after #N.`
- Keep one `ready` issue per workstream. The workflow already refuses `ready` on an issue with an open blocker.

### Starting an issue

"Start #N" runs this sequence end to end, without asking. It also applies to an issue just created for the work in hand: it starts in Triage, so run steps 2–4 before changing any file. Labels set at creation are ignored for the first 60 seconds, and a label event that finds the item with no Status sets Triage first. If an issue is still left with no Status (every label event then fails with "issue has no project status"), run `gh workflow run github-issue-intake.yml -f issue_number=N`, which sets Triage, then re-add a label. Read the Status first (`gh issue view N --json projectItems -q '.projectItems[].status.name'`), skip steps already satisfied, and stop only on a hard blocker.

1. **Done, In review or In progress by someone else:** stop and report.
2. **Triage → Backlog:** set **Kind** and **Workstream** on the board item, choosing the closest option from the title prefix, labels and body, then add the area labels the PR will carry (any label triggers the move). Fields first, label second, because field edits fire no event. Report the values chosen; never ask, even when the fit is ambiguous (pick the closest and say so).
3. **Backlog → Ready:** read the open blockers (`gh api repos/andres-codigo/trip-fotos-react/issues/N/dependencies/blocked_by --jq '[.[]|select(.state=="open")|.number]'`) and the `Do after` line. If any are open, stop and name them. Otherwise add `ready`. Keep one Ready issue per workstream; if another is already Ready, say so and ask which goes first.
4. **Ready → In progress:** add `in-progress`, branch off `main` with the type prefix, make the first commit (`--allow-empty` if needed), push and open a draft PR with `Closes #N`.
5. **Confirm:** re-read the Status. If Issue Intake refused a label (the label is gone and there is a comment), fix the cause and repeat the step. Never move Status by hand to get round a refusal.

Epics skip step 3 and go from Backlog straight to In progress.

### Finishing an issue

Once the change passes `/verify` and the PR is ready for review:

1. Poll `gh pr checks <PR>` a few minutes apart until every check has passed (a skipped Dependabot job is fine). If a check fails, stop and report it.
2. Squash-merge (or rebase-merge a multi-commit PR whose commits are individually meaningful) and delete the head branch, then delete the merged local branch.
3. Re-read the Status; the merge sets Done.

### Closing an epic

When the last child issue is closed, and only then:

1. Tick every box in the epic's checklist.
2. Close the epic's draft tracking PR, if it has one, unmerged (`gh pr close <PR> --delete-branch`), with a note that the work landed through the children.
3. Close the epic as completed (`gh issue close <N> --reason completed`).
4. Set its Status to Done by hand. Closing a PR unmerged or an issue never sets Done, so no workflow does it (`gh project item-edit` on the Status field).

Field edit commands:

```bash
gh project field-list 2 --owner andres-codigo --format json
gh project item-list 2 --owner andres-codigo --limit 200 --format json -q '.items[]|select(.content.number==N)|.id'
gh project item-edit --project-id PVT_kwHOAybMeM4BCojE --id <item> --field-id <Kind or Workstream field id> --single-select-option-id <option id>
```

### Project README and status updates

The project's short description and README (Project > Settings) and its status updates are written by hand — no workflow touches them. Keep them current:

- **Status update** — post one after a PR merges that ships user-visible work, closes a backlog item or changes the "Next up" list, and when the overall status changes (On track / At risk / Off track). List what shipped with PR numbers and what is next.
- **Project README** — edit it when the repo README's About, Features, Stack or Status sections change. Every PR refreshes the repo Status, so every PR also updates the Project README's **Recently shipped** line to match. Both carry the same 5–8 headline items (issue numbers, no per-fix detail); drop the oldest or smallest when adding one. It is edited with `gh`, outside git, so no PR diff shows it as missing: check it before marking the PR ready.
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

## 9. Release Please

- **Workflow File:** `.github/workflows/release-please.yml` (config in `config/release-please-config.json`, current version in `config/release-please-manifest.json`)
- **Triggers:** On **push** to `main`
- **Purpose:** Works out the version from the conventional-commit titles of the squash-merged PRs and keeps one release PR open. The release PR bumps `version` in `package.json` and `package-lock.json` and updates `CHANGELOG.md`; merging it tags the release and publishes a GitHub Release. While the app is 0.x, `feat:` and `feature:` bump the minor version; `enhancement:`, `fix:` and `perf:` bump the patch. `chore`, `docs`, `test` and `refactor` PRs are hidden from the changelog and do not release on their own. The type list is `changelog-sections` in `release-please-config.json`; a type missing from it is ignored.
- **History:** `bootstrap-sha` in the config starts the changelog at the commit tagged `v0.20.0`; earlier commits are ignored. Releases after that follow the tags.
- **Token:** The release PR is opened with `PROJECT_AUTOMATION_TOKEN` (see [Token Rotation](#token-rotation--recovery-guide)), because PRs opened with the default token do not trigger the test workflows the `main` ruleset requires. Project Item Lifecycle skips branches starting `release-please--`, so a release PR gets no tracking issue.
- **Never edit `version` by hand.** After merging a `feat` or `fix` PR, merge the open release PR once its checks are green.

---

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
| Release - Release Please          | `.github/workflows/release-please.yml`         | Automation       | Push             |

---

> **Note:** Ensure all required environment variables and secrets are set in your repository settings for CI to work correctly. The Vitest, component and E2E workflows read the Firebase config from the `VITE_FIREBASE_*` and `VITE_DATABASE_URL` secrets; E2E also needs `VITE_API_URL`, `VITE_API_KEY`, `VITE_BACKEND_BASE_URL` and `CYPRESS_USER_*`.
