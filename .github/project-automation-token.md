# Project Automation Token Runbook

This repository uses the optional `PROJECT_AUTOMATION_TOKEN` secret for GitHub Project v2 write operations in `.github/workflows/project-item-lifecycle.yml`.

## When To Rotate

Rotate the token when any of the following happens:

- The token is close to expiry.
- The token has expired.
- You suspect token leakage.
- A maintainer with token ownership leaves the team.

## Recreate The Token

1. Open <https://github.com/settings/tokens>.
2. Create a new classic token.
3. Give it a clear name, for example `trip-fotos-react project automation`.
4. Set an expiry date according to your policy.
5. Grant required scopes:

- `project`
- `repo` (required if the repository is private)

6. Generate the token and copy it immediately.

## Update The Repository Secret

1. Open repository settings for Actions secrets:

- <https://github.com/andres-codigo/trip-fotos-react/settings/secrets/actions>

2. Create or update the secret named `PROJECT_AUTOMATION_TOKEN`.
3. Paste the new token value.
4. Save.

## Validate After Rotation

1. Trigger a `pull_request_target` event (open, reopen, synchronise, or close a PR).
2. Confirm `GitHub - Project Item Lifecycle / sync-project-lifecycle` succeeds.
3. Confirm PR/issue items are added or updated in project `Trip Fotos React`.

## Failure Signal

If the workflow logs `Resource not accessible by integration`, token permissions are missing or the secret is not available to the workflow run.
