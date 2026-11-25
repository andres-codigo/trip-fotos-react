---
name: ci-and-scripts-guidance
description: Use when changing GitHub Actions workflows, .github/scripts or the Node scripts in scripts/. Covers docs to update, trigger paths, pull_request_target, guarded scripts and data-script safety.
applyTo: '{.github/workflows/**,.github/scripts/**,scripts/**}'
---

# CI and Scripts Guidance

[docs/ci-cd.md](../../docs/ci-cd.md) describes every workflow. Keep it, its Summary Table and the README Testing and CI table in step with any workflow you add, rename or retrigger.

## Workflows

- Trigger paths decide what a PR runs. When a workflow's `paths` change, check that `cypress/impact.js` and the `/verify` gate plan still agree with them, so a change that CI tests is also tested locally.
- Prefer `pull_request`. A `pull_request_target` workflow needs an entry in the Actions event policy, or it never runs ([details](../../docs/ci-cd.md#pull-request-target-policy)). Keep it base-only: no checkout of the PR head, no PR scripts, and PR text read as data inside `github-script`, never in a shell.
- Every runner start is billed a full minute: filter with `paths`, event types and job-level `if` rather than starting a job that exits early.
- Workflow YAML is Prettier-checked (a `/verify` gate and in CI): run `npx prettier --write` on edited workflow files.

## Scripts

- Tests for `scripts/` and `.github/scripts/` live in each folder's `__tests__/` (Vitest). Give a script with logic of its own a test, and update the test in the same change as the script.
- `scripts/start-issue.mjs` runs without a permission prompt. A change to it or its test fails the `start-issue-guard` check until the maintainer reviews it and adds the `script-reviewed` label ([details](../../docs/ci-cd.md#start-issue-script-guard)).
- A script that writes to the live project (migrations, backfills, account fixes) runs dry by default, prints what it would change and writes only with `-- --write`. Give it an `npm run` entry and a line in the README Scripts section.
