---
name: start-issue
description: Start a GitHub issue end to end (Triage → Backlog → Ready → In progress, branch, draft PR). Use on "start #N", or after creating an issue for work in hand, before changing any file.
argument-hint: '<issue number>'
---

# Start issue

Run the sequence in [Starting an issue](../../../docs/ci-cd.md#starting-an-issue) for issue `$ARGUMENTS`, yourself and without asking. That section is the single source of truth; do not restate it here.

Ask only when a hard blocker leaves no sensible default:

- another issue in the same workstream is already `ready` (ask which goes first)
- the issue is Done, In review or In progress by someone else, or has an open blocker (stop and report)

Never ask about Kind, Workstream or labels: pick the closest option and report what you chose. Finish by re-reading the Status.
