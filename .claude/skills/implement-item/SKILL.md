---
name: implement-item
description: Implement one Vue parity backlog issue end to end on the current branch — read the issue and the Vue source, build it with the scaffolding agents, keep routes and README in sync, pass /verify, and make exactly one commit that references the issue. Use for a single issue; /parity-run calls it for each queued issue.
argument-hint: '<issue-number>'
allowed-tools: Read, Write, Edit, Grep, Glob, Agent, Skill, Bash(gh issue view *), Bash(gh issue edit *), Bash(gh issue comment *), Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git add *), Bash(git commit *), Bash(npm run lint), Bash(npm run lint:fix), Bash(npm run vitest:run:fast), Bash(npm run cy:run:ct), Bash(npm run build), Bash(npx vitest *), Bash(npx cypress run --component *)
---

# Implement item

Arguments: `$ARGUMENTS` (a GitHub issue number)

## Steps

1. **Pre-flight**
    - `git status --short` must be clean. If not, stop: a previous item left changes behind.
    - The current branch must not be `main`.
    - `gh issue view $ARGUMENTS --json number,title,body,labels,state`. If closed, report "already done" and stop.
    - Every `Depends on` issue must be `done` in `.claude/parity/state.json` (or closed). If not, stop and report which.
2. **Understand the behaviour**
    - Read the Vue files listed under `## Vue source` (Vue repo path: `$VUE_REPO_PATH`, `/workspaces/trip-fotos-vue`, or `/tmp/trip-fotos-vue` — clone it shallowly there if none exists).
    - Read the matching section of `.claude/plans/parity-gap-report.md`.
    - Read the `.github/instructions/*.instructions.md` files for every area you will touch.
    - Read large files (`README.md`, workflows, the gap report) by section — `grep -n` for the heading, then read just that range.
3. **Build it**, using the scaffolding agents rather than writing structure by hand:
    - new component → `create-component` agent
    - new hook → `create-hook` agent
    - new page → `create-page` agent
    - new slice → `create-redux-slice` agent
    - Then fill in the behaviour so every acceptance criterion is met. Reuse `src/components/ui/**` atoms; do not duplicate them.
4. **Keep the repo's sync rules** (from `CLAUDE.md`):
    - New route → add to `PATHS` **and** the `rewrites` allow-list in `vercel.json`
    - New `src/` subfolder, feature or script → update the matching `README.md` section (Folder Structure, Features, Status)
    - Never mock the Firebase Realtime Database in integration tests
5. **Verify**: run the `/verify` skill once the item is complete — not after every edit.
    - While building and fixing, check only what you touched: `npx vitest run <test file> --reporter=dot` and `npx cypress run --component --spec <spec file> 2>&1 | tail -30`.
    - On a `/verify` failure, fix it using those targeted runs, then run `/verify` once more.
    - If it still fails after the **second** fix attempt, run `git stash push -u -m "parity #$ARGUMENTS"` so the tree is clean, label the issue `needs-human` (create the label if it is missing), comment the failing gate and first error on the issue, set the item to `needs-human` in `.claude/parity/state.json`, and stop.
6. **Commit** exactly once:
    - Tick the acceptance-criteria boxes in the issue body that are now met (`gh issue edit --body-file`).
    - Stage only files belonging to this item (`git add <paths>`, never `git add -A`).
    - Message in en-GB, conventional prefix, issue reference in the body; do **not** use `Closes` here (the final PR closes them):

        ```
        feat: add FilePreview component

        Ports FilePreview.vue from trip-fotos-vue. Refs #101.

        Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
        ```

    - Set the item to `done` in `.claude/parity/state.json`.

## Report

One line: `#<n> <title> — done (<short hash>)` or `#<n> — needs-human: <reason>`.
