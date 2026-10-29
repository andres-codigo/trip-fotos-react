---
name: finish-pr
description: Finish a change end to end (README Status and Project README, ready for review, poll CI, merge, prune, release PR, status update). Use when the work is done and passes /verify, or on "finish", "merge" or "ship" for the current PR.
argument-hint: '[PR number]'
---

# Finish PR

Finish the PR for the current branch (or `$ARGUMENTS`), yourself and without asking. Stop and report only when a check fails or a visual question is open.

## Before marking ready

1. `/verify` has passed on the current code, and a UI-affecting change has had its [visual check](../../../.github/instructions/testing.instructions.md#visual-check-for-ui-changes).
2. README Status refreshed (Dependabot PRs excepted): move what shipped into Recently shipped (5–8 headline items, issue numbers, no per-fix detail), drop closed issues from Next up. Version bumps are automatic: never edit `version`.
3. Project README's Recently shipped matches, via `gh project edit` ([how](../../../docs/ci-cd.md#project-readme-and-status-updates)). It is outside git, so no diff shows it missing.
4. The PR title is a conventional-commit title: `feat:`/`feature:` bumps minor; `enhancement:`, `fix:`, `perf:` bump patch; `chore`, `docs`, `test`, `refactor` do not release.

## Merge

Follow [Finishing an issue](../../../docs/ci-cd.md#finishing-an-issue): mark ready, poll `gh pr checks` until green, merge, delete the head and merged local branches, re-read the Status.

- **Squash-merge** by default; **rebase-merge** multi-commit PRs whose commits are individually meaningful. Merge commits are disabled.

## After merging

- A releasing PR (a `feat`, `feature`, `enhancement`, `fix` or `perf` title): merge the open release-please PR once its checks are green ([details](../../../docs/ci-cd.md#9-release-please)).
- A PR that shipped user-visible work or changed Next up: post a Project status update.
- The last child of an epic ends with [Closing an epic](../../../docs/ci-cd.md#closing-an-epic).
