---
name: parity-run
description: Run the whole Vue to React parity programme unattended — audit, backlog sync, one commit per issue on feature/vue-parity, final checks, and a single PR for review. Resumable; re-run it to pick up where it stopped.
argument-hint: '[--skip-audit] [--one]'
---

# Parity run

Arguments: `$ARGUMENTS`

The plan this executes is `.claude/plans/vue-parity-plan.md`. The user only reviews the final PR, so do not stop to ask questions — make the conventional choice, note it in the PR body, and carry on.

## Steps

1. **Pre-flight**
    - `git status --short` is clean.
    - `gh project field-list 2 --owner andres-codigo` succeeds; if not, stop and tell the user to run `! gh auth refresh -s read:project,project`.
    - `.env` exists (do not read it — just `test -f .env`); E2E needs it.
2. **Branch**: switch to `feature/vue-parity`, creating it from `origin/main` if it does not exist (`git fetch origin` first). If it exists, stay on it — this is a resume.
3. **Audit** (skip if `--skip-audit` or the report is newer than the last commit on `main`): run the `parity-auditor` agent. Commit the report on its own: `docs: add Vue parity gap report`.
4. **Backlog**: if `.claude/parity/state.json` is missing, run `/backlog-sync --apply`. If it exists, re-use its queue (resume). Either way, set its `status` to `running` so the `Stop` hook is active; a status of `awaiting-review` means the user has approved the previous item.
5. **Implement**: for each queue item in order whose state is `pending`, run `/implement-item <issue>`.
    - Skip items whose dependencies are `needs-human`; mark them `needs-human` with reason "blocked by #<n>".
    - The `Stop` hook (`.claude/hooks/parity-stop-guard.mjs`) will send you back here if you try to finish while items are still pending.
    - With `reviewEachItem: true` in the state file, `/implement-item` stops after each commit for human review; reply with that item's one-line report and the commit hash, and do not continue until the user says so.
    - With `--one`, implement only the next pending item, then stop without running steps 6–7. `run-fresh.sh` uses this to give each item a fresh session.
6. **Final checks**
    1. Run `/verify e2e`. Fix regressions as a separate `fix:` commit.
    2. Run `/code-review medium --fix` against `origin/main...HEAD` (medium, because each commit already passed `/verify` and the full diff is large); commit any fixes as `refactor: apply review fixes`.
    3. Check `README.md` Features, Status and Folder Structure against what was built; commit any updates as `docs: sync README with parity work`.
7. **PR**
    - `git push -u origin feature/vue-parity`
    - `gh pr create --base main --title "feat: Vue parity — <n> features ported" --body-file <scratchpad file>` with:
        - a summary table of the gap report (before → after)
        - one line per commit: hash, title, `Closes #<n>` (only for `done` items) and `Closes #<epic>` if every item is done
        - a **Needs human** section for any `needs-human` items with the reason and stash name
        - a **Decisions made** section for every judgement call
        - a **How to test** section
        - end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
    - Set `status` to `complete` in `.claude/parity/state.json` and reply with the PR link.

## Running it

Interactive (approve the push and PR prompts yourself):

```bash
claude "/parity-run"
```

Unattended — the extra `--allowedTools` cover the steps that normally ask, scoped to this branch:

```bash
claude -p "/parity-run" \
  --permission-mode acceptEdits \
  --allowedTools "Bash(git push -u origin feature/vue-parity)" "Bash(gh pr create *)" "Bash(node .claude/skills/verify/run-e2e.mjs*)" "Bash(gh issue *)" "Bash(gh project *)" "Bash(gh api graphql *)" "Bash(git checkout *)" "Bash(git switch *)" "Bash(git fetch *)" "Bash(git stash *)" "Bash(git add *)" "Bash(git commit *)" "Bash(test -f .env)"
```

Cheapest unattended option — one fresh session per item, so no item carries earlier items' context; it stops if an item makes no progress:

```bash
.claude/skills/parity-run/run-fresh.sh
```

Pushing to `main` and merging PRs are denied in `.claude/settings.json`, so neither mode can bypass review.
