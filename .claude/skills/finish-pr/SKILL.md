---
name: finish-pr
description: Finish a change end to end (README Status and Project README, ready for review, poll CI, merge, prune, release PR, status update). Use when the work is done and passes /verify, or on "finish", "merge" or "ship" for the current PR.
argument-hint: '[PR number]'
---

# Finish PR

Finish the PR for the current branch (or `$ARGUMENTS`), yourself and without asking. Stop and report only when a check fails or a visual question is open.

## Before marking ready

1. `/verify` has passed on the current code, and a UI-affecting change has had `/ui-check`.
1. Nothing is left for the user to settle: compare the issue's Scope and Done when with what was built, and list every choice the issue did not settle, any conflict between them and any finding. If there is one, ask (AskUserQuestion) and hold the merge until it is answered. The post-merge report holds outcomes only, never "decisions for you".
1. Nothing the diff removes, renames or replaces is left with no users: for each removed or renamed name, `git grep` the old name across `src`, `cypress`, `scripts`, `config`, `.github` and `docs`, and delete any export, constant key, selector, action type, persisted key, test helper, mock data or doc line it orphaned (then `/verify` again).
1. README Status refreshed (Dependabot PRs excepted): add what shipped to Recently shipped as one user-facing line (5–7 lines in all, no issue numbers, no test or process detail; developer tooling stays one line; replace the oldest, never append), drop closed issues from Next up. Version bumps are automatic: never edit `version`.
1. Project README's Recently shipped matches, via `gh project edit` ([how](../../../docs/ci-cd.md#project-readme-and-status-updates)). It is outside git, so no diff shows it missing.
1. The PR title is a conventional-commit title: `feat:`/`feature:` bumps minor; `enhancement:`, `fix:`, `perf:` bump patch; `chore`, `docs`, `test`, `refactor` do not release.

## Merge

Follow [Finishing an issue](../../../docs/ci-cd.md#finishing-an-issue): mark ready, wait for the runs the ready event starts (the draft-time "skipping" rows are not a pass: run `node scripts/wait-for-ci.mjs <branch>` with `run_in_background` straight after marking ready and wait for its one-line result, never polling by hand), check every check is green, merge, delete the head and merged local branches, re-read the Status.

- **Squash-merge** by default; **rebase-merge** multi-commit PRs whose commits are individually meaningful. Merge commits are disabled.

## After merging

- Run `node .claude/skills/verify/reset-checks.mjs cache`: a squash merge leaves `main` with the verified tree, so the old `/verify` and `/ui-check` ticks would still match.
- With `main` pulled, run `node .claude/skills/ui-check/promote.mjs`: it moves the `/ui-check` branch shots nothing has changed since into `main`, so the next check need not retake them.
- A releasing PR (a `feat`, `feature`, `enhancement`, `fix` or `perf` title): merge the open release-please PR once its checks are green, or it has none ([details](../../../docs/ci-cd.md#9-release-please)). Release PRs skip the test jobs, so check them with one `gh pr checks <N>` and merge when every row is pass or skipping; do not run `wait-for-ci.mjs` for them.
- Asked how CI is going: run `gh pr checks <N>` and answer from it, never from a background wait that has not returned.
- A PR that shipped user-visible work or changed Next up: post a Project status update.
- The last child of an epic ends with [Closing an epic](../../../docs/ci-cd.md#closing-an-epic).
