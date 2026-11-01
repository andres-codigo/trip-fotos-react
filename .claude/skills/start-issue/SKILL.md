---
name: start-issue
description: Start a GitHub issue end to end (Triage → Backlog → Ready → In progress, branch, draft PR). Use on "start #N", or after creating an issue for work in hand, before changing any file.
argument-hint: '<issue number>'
model: sonnet
---

# Start issue

Run `node scripts/start-issue.mjs $ARGUMENTS`, yourself and without asking. It reads the Status, stops on blockers, sets Kind and Workstream, adds the labels in order, branches, makes the empty commit, pushes, opens the draft PR and prints one summary line. Recovery and the manual steps are in [Starting an issue](../../../docs/ci-cd.md#starting-an-issue).

- Exit 2 means a choice is needed: the script lists the options. Pick the closest Workstream, Kind and area label and re-run with `--workstream`, `--kind` and `--label`; never ask, and report what you chose.
- Exit 3 means another issue in the workstream is already `ready`: ask which goes first.
- Exit 4 means an open `#N` follows "before" on the `Do after` line. Read the line: if that issue is what this one unblocks, re-run with `--ignore N`; if it is a real blocker, stop and report it.
- Any other stop (Done, In review or In progress, or an open blocker, or a label Issue Intake refused) is reported as is.

When the issue is the last child of an epic, finishing it ends with [Closing an epic](../../../docs/ci-cd.md#closing-an-epic).
