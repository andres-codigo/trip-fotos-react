---
paths:
    - 'vercel.json'
    - 'firebase/**'
    - 'src/constants/ui/paths.js'
    - 'src/services/**'
---

# Deploy config

- Do not add a route to `PATHS` without adding it to the `rewrites` allow-list in `vercel.json` (a Vitest drift check enforces it)
- Do not add a database or Storage field, or a write limit, without updating `firebase/database.rules.json` / `firebase/storage.rules` to match: client-side validation must mirror the rules. Deploy rule changes with `npm run firebase:rules` before the production deploy
- Do not call a new external origin without adding it to the CSP `connect-src` in `vercel.json`
