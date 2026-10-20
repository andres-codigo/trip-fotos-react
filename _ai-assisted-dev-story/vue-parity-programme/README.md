# Case Study: Automating the Vue Parity Port

This folder archives the Claude Code tooling that ported the remaining features of [trip-fotos-vue](https://github.com/andres-codigo/trip-fotos-vue) into this React app. The work ran under epic [#274](https://github.com/andres-codigo/trip-fotos-react/issues/274) and was delivered in a single PR, [#291](https://github.com/andres-codigo/trip-fotos-react/pull/291). The tooling itself was added in [#271](https://github.com/andres-codigo/trip-fotos-react/pull/271).

The tooling has been retired. Claude Code and Copilot no longer load these files. They are kept here as a record of the approach.

## Contents

- [Goal](#goal)
- [How it worked](#how-it-worked)
- [Guardrails](#guardrails)
- [What changed during the run](#what-changed-during-the-run)
- [Outcome](#outcome)
- [Why it was archived](#why-it-was-archived)
- [Lessons learnt](#lessons-learnt)
- [Files](#files)

## Goal

Bring the React port to feature parity with the Vue app and keep the GitHub project backlog in step with the work. Deliver everything as one PR with one commit per backlog issue, so the PR can be reviewed issue by issue.

## How it worked

The programme was a pipeline of agents and skills, driven by one orchestrating skill:

1. **Audit:** the `parity-auditor` agent made a read-only inventory of the Vue routes, store modules, components and composables. It mapped each one to its React equivalent and wrote [`parity-gap-report.md`](parity-gap-report.md), rating each feature as done, partial, missing or superseded.
2. **Backlog sync:** `/backlog-sync` compared the gap report with [GitHub Project 2](https://github.com/users/andres-codigo/projects/2/views/1). It updated stale issues, created missing ones under a `Vue parity` epic, and wrote a dependency-ordered work queue to a gitignored state file. It ran as a dry run unless `--apply` was passed.
3. **Implementation:** `/implement-item <issue>` took one issue from the queue. It read the issue and the Vue source, built the feature with the existing scaffolding agents (`create-component`, `create-hook`, `create-page`, `create-redux-slice`), kept routes and the README in sync, passed `/verify`, and made exactly one commit that references the issue. The final PR closed every issue with `Closes #…`.
4. **Orchestration:** `/parity-run` ran the steps above end to end on `feature/vue-parity`. It then ran `/verify e2e` and a code review, and opened the PR. Stopping and re-running it carried on from where it left off.

The plan the programme followed is in [`vue-parity-plan.md`](vue-parity-plan.md).

## Guardrails

The run was meant to be unattended, so the guardrails were enforced by the Claude Code harness instead of relying on prompts:

- **Quality gate before every commit:** `/implement-item` could only commit after `/verify` passed (lint, Vitest, Cypress component tests, build). After two failed fix attempts, it stashed the work, labelled the issue `needs-human` and moved on.
- **A `Stop` hook to keep the run going:** [`parity-stop-guard.mjs`](hooks/parity-stop-guard.mjs) sent Claude back to the queue whenever it tried to finish with items still pending. If three stops in a row made no progress, it marked the run `stalled`, so a broken item could not loop forever.
- **Denied permissions:** pushes to `main`, force-pushes and `gh pr merge` were denied in the committed `.claude/settings.json`. The only route to `main` was the reviewed PR.
- **Cheaper models for routine work:** the scaffolding and audit agents ran on Sonnet. [`run-fresh.sh`](skills/parity-run/run-fresh.sh) gave each item its own fresh session, so context did not build up across items.

## What changed during the run

The tooling was adjusted part-way through, and the adjustments are in the commit history of #291:

- **A per-item review gate** (`reviewEachItem`). The original plan was fully unattended, with one review at the end. On 18 October the run was changed to stop after each commit (status `awaiting-review`) and only carry on after a human approved that commit.
- **Convention sync:** where an issue's target conflicted with a `.github/instructions/` file, the instructions file won, so new code followed the React conventions instead of copying the Vue structure. Any new pattern was written back to the instructions and scaffolding workflows in the same commit.
- **Board status:** `/implement-item` moved its issue to `in progress` on the project board when it started. Merging the final PR moved it to `done`.
- **Lower token use:** `implement-item` skipped reading Vue source for React-only issues, and `verify` ran all its gates in one shell call and skipped Cypress component tests for docs-only or `.claude/`-only changes.
- **Human backlog decisions:** before `/backlog-sync --apply`, the dry run was reviewed and decisions were recorded in the gap report. One work item was dropped (the Home route stays). One was split into two issues. Existing issues #99–#101 were reused instead of being duplicated.
- **Scope found during the run:** three issues were added to the queue that were not in the original audit. Storage uploads needed a signed-in Firebase Auth SDK user (#285). City search replaced the fixed checkboxes (#284). The admin check moved to a Firebase custom claim (#286).

## Outcome

- 15 backlog issues delivered, one commit each, in PR #291. Epic #274 is closed.
- Every commit passed `/verify` on its own. The final branch passed `/verify e2e` and a code review, and the review's findings were fixed in follow-up commits.
- Decisions that needed human judgement were recorded in the PR body instead of being made silently. Examples are the move from the Identity Toolkit REST API to the Auth SDK, Photon city search, and renaming the `/trips/:id` route to `/travellers/:id`.

## Why it was archived

Everything under `.claude/` loads in every Claude Code session:

- The `Stop` hook ran on every stop.
- The skills stayed in every session's skill list.
- The parity agent was offered to both Claude Code and Copilot.

With the epic finished, keeping them active would have cost context in every session and risked a skill such as `/implement-item` being picked for unrelated work. The general-purpose pieces stay active in `.claude/`: `/verify`, the lint hook and the scaffolding agents.

## Lessons learnt

<!-- TODO(andres): add your own reflections before merging — e.g. what the review gate caught, where the automation saved or cost time, what you would change next time. -->

## Files

| File                                                               | Was               | Role                                                          |
| ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------- |
| [`vue-parity-plan.md`](vue-parity-plan.md)                         | `.claude/plans/`  | The plan and its decisions                                    |
| [`parity-gap-report.md`](parity-gap-report.md)                     | `.claude/plans/`  | The audit output and work items (state before the run)        |
| [`agents/parity-auditor.md`](agents/parity-auditor.md)             | `.claude/agents/` | Claude Code wrapper for the audit agent                       |
| [`agents/parity-auditor.agent.md`](agents/parity-auditor.agent.md) | `.github/agents/` | Shared audit workflow (Claude Code and Copilot)               |
| [`skills/backlog-sync/`](skills/backlog-sync/SKILL.md)             | `.claude/skills/` | Gap report ↔ GitHub backlog, writes the work queue            |
| [`skills/implement-item/`](skills/implement-item/SKILL.md)         | `.claude/skills/` | One issue → one verified commit, plus the board-status script |
| [`skills/parity-run/`](skills/parity-run/SKILL.md)                 | `.claude/skills/` | Orchestrator, plus `run-fresh.sh`                             |
| [`hooks/parity-stop-guard.mjs`](hooks/parity-stop-guard.mjs)       | `.claude/hooks/`  | `Stop` hook that kept the run going                           |

Paths inside these files refer to where they lived while the programme was active.
