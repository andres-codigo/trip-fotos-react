---
paths:
    - 'package.json'
    - '.env.example'
    - '.env.emulators'
    - '.github/**'
    - '.claude/**'
    - 'docs/**'
    - 'README.md'
---

# Keeping README.md in sync

`README.md` is the user-facing source of truth for setup, scripts and structure; it stays a summary, with detail in `docs/` (`ci-cd.md`, `testing.md`, `ai-assistance.md`, `local-https.md`). Update both in the same change whenever you:

- Add, remove or rename an `npm run` script (Scripts section)
- Add, remove or rename a `.env` variable (`.env.example` and the Environment Variables table)
- Add, remove or rename a top-level folder, or a `src/` subfolder (Folder Structure tree)
- Add or change a GitHub Actions workflow (`docs/ci-cd.md` and the README Testing and CI table)
- Add, remove or materially change a user-facing feature (Features section)
- Add or restructure `.claude/` or `.github/` guidance files (`docs/ai-assistance.md` and the README AI Assistance summary)
- Change the README's About, Features, Stack or Status sections (the GitHub Project README too)

The Status refresh, Project README and status update at the end of a change are in `/finish-pr`.
