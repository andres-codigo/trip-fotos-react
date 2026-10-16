# Vue → React parity plan

Bring `trip-fotos-react` to feature parity with [trip-fotos-vue](https://github.com/andres-codigo/trip-fotos-vue), keep the [project backlog](https://github.com/users/andres-codigo/projects/2/views/1) in step, and deliver everything as **one PR with one commit per backlog issue**, run **locally** in the dev container.

The only human step is reviewing that final PR.

## Decisions

| Decision      | Choice                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------- |
| PR shape      | One PR (`feature/vue-parity` → `main`), one commit per issue, `Closes #…` for each           |
| Where it runs | Locally in the dev container (Cypress + Firebase credentials already present)                |
| Tooling home  | Project-local `.claude/` skills/agents, shared workflows in `.github/agents/` (not a plugin) |
| Backlog       | GitHub issues — `github-issue-intake.yml` adds new issues to the project board automatically |

## Initial gap list (file-inventory pass — the audit replaces this)

| Vue                                                                                           | React                           | Backlog                            |
| --------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------- |
| `TravellerDetail.vue`                                                                         | Missing                         | New issue                          |
| `TripFilter.vue`                                                                              | Missing (to confirm)            | New issue                          |
| `ContactTravellerForm`, `ContactTraveller`, `MessageItem`, `MessagesReceived`, messages store | `Messages.jsx` stub, no slice   | New epic                           |
| `AddFile`, `DropZone`, `FilePreview`, `file-list`/`file-uploader` composables                 | Missing                         | #99, #100, #101 (+ Storage upload) |
| `BaseBadge`, `BaseImage`                                                                      | Missing                         | New issue                          |
| `click-outside-directive`                                                                     | Done (`useClickOutsideToClose`) | —                                  |

## Phase 0 — tooling (`chore/parity-automation`)

1. `parity-auditor` agent — read-only Vue vs React inventory → `.claude/plans/parity-gap-report.md`
2. `/backlog-sync` skill — gap report ↔ project board; creates/updates issues (`--dry-run` by default)
3. `create-hook` agent — scaffolds custom hooks with tests (first use: `useFileList`)
4. `/implement-item <issue#>` skill — one issue → one verified commit
5. `/parity-run` skill — orchestrates Phases 1–3 on `feature/vue-parity`
6. Guard rails — deny pushes to `main` and `gh pr merge`; `Stop` hook keeps `/parity-run` going until the queue is empty

**Prerequisite:** `gh auth refresh -s read:project,project`

## Phase 1 — audit and backlog (automated)

7. Run `parity-auditor` → gap report
8. Run `/backlog-sync --apply` → issues created/updated, dependency-ordered queue written to `.claude/parity/state.json`

## Phase 2 — implementation (one commit per issue, dependency order)

9. UI atoms: `BaseBadge`, `BaseImage`
10. File upload: `useFileList` (#99) → `FileDrop` (#100) → `FilePreview` (#101) → Cloud Storage upload in registration
11. Traveller detail page (`/travellers/:id`) + `vercel.json` rewrite
12. Traveller filter
13. Messages: slice → contact form → received messages page
14. Anything else the audit found

## Phase 3 — the PR

15. `/verify e2e`, `/code-review high --fix`, README sync check
16. Open `feature/vue-parity` → `main` PR with `Closes #…` per issue and the gap report as a checklist

## Running it

```bash
gh auth refresh -s read:project,project   # once
claude "/parity-run"                      # from the repo root, in the dev container
```

See `.claude/skills/parity-run/SKILL.md` for the unattended (`claude -p`) variant and its permission flags.
