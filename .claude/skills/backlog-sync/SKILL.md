---
name: backlog-sync
description: Reconcile the Vue parity gap report with the GitHub project backlog — update stale issues, create missing ones, link them under a parity epic, and write the dependency-ordered work queue for /parity-run. Dry run by default; pass `--apply` to write to GitHub.
argument-hint: '[--apply]'
allowed-tools: Read, Write, Grep, Glob, Bash(gh project *), Bash(gh issue *), Bash(gh label list *), Bash(gh api graphql *), Bash(git log *)
---

# Backlog sync

Arguments: `$ARGUMENTS`

Turn `.claude/plans/parity-gap-report.md` into GitHub issues on [project 2](https://github.com/users/andres-codigo/projects/2/views/1) and into a work queue.

## Prerequisites

- The gap report exists. If not, stop and tell the user to run the `parity-auditor` agent first.
- `gh` has project scope: `gh project field-list 2 --owner andres-codigo` must succeed. If it fails with a missing-scope error, stop and tell the user to run `! gh auth refresh -s read:project,project`.

## Steps

1. **Read the board**: `gh project item-list 2 --owner andres-codigo --format json --limit 300`. Ignore pull requests and `Tracking:` issues (the lifecycle workflow creates those for PRs). Keep the open issues and any issues still marked `backlog` or `todo`.
2. **Read each candidate issue**: `gh issue view <n> --json number,title,body,labels,state`.
3. **Match work items to issues** by what they do, not by exact title (e.g. Vue `AddFile`/`file-list` ↔ #99 "Add File Component" / `useFileList`). Each work item ends up as one of:
    - **matched, current**: the issue already covers the acceptance criteria → no change
    - **matched, stale**: the issue is missing criteria from the report (e.g. the Cloud Storage upload) → append them under a `## Parity audit additions` heading; never delete what the user wrote
    - **unmatched**: no issue exists → create one
    - Open issues that match nothing in the report are left alone; list them in the summary.
4. **Plan the issue bodies** for anything new, using this shape:

    ```markdown
    ## Description

    <behaviour to port, in en-GB>

    ## Vue source

    - `src/…` (trip-fotos-vue @ <hash>)

    ## React target

    - `src/…`

    ## Acceptance criteria

    - [ ] …
    - [ ] Vitest and Cypress component tests cover the new behaviour
    - [ ] `/verify` passes

    ## Depends on

    - #<n> / none

    Part of #<epic>
    ```

    - Labels: only ones that already exist (`gh label list`); always include one triage label (`enhancement` or `bug`) so `github-issue-intake.yml` files it correctly.

5. **Dry run (default)**: print a table of `action | issue | title | labels | depends on` and the queue order, then stop. Change nothing on GitHub.
6. **Apply (`--apply` only)**:
    1. Create the epic issue `Vue parity` (or reuse one with that title if it is open), listing every work item as a task-list line.
    2. Create or edit the issues (`gh issue create --title … --body-file … --label …`, `gh issue edit <n> --body-file …`). Write bodies to the scratchpad and pass them with `--body-file`, never inline.
    3. Link each issue to the epic as a sub-issue. Get node IDs with `gh issue view <n> --json id -q .id`, then:
        ```bash
        gh api graphql -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){issue{number}}}' -f p=<epicId> -f c=<childId>
        ```
    4. The intake workflow adds new issues to the board as `backlog`; do not set board fields by hand.
7. **Write the queue** (apply mode only) to `.claude/parity/state.json`:

    ```json
    {
    	"status": "running",
    	"branch": "feature/vue-parity",
    	"epic": 0,
    	"queue": [
    		{ "issue": 99, "title": "…", "dependsOn": [], "state": "pending" }
    	],
    	"stopBlocksWithoutProgress": 0,
    	"lastDoneCount": 0
    }
    ```

    - `queue` is in dependency order; `state` is `pending`, `done` or `needs-human`.
    - This file is gitignored; it is the hand-off to `/parity-run` and the `Stop` hook.

## Report

Reply with the action table, the epic link, and the queue order. Flag any work item that was too large to be one commit and how it was split.
