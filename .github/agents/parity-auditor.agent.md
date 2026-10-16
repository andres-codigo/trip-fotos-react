---
name: parity-auditor
description: Use when comparing the original trip-fotos-vue app against this React port. Inventories Vue routes, store modules, components and composables, maps each to its React equivalent, and writes a gap report rating every feature as done, partial or missing.
---

# Vue Parity Audit Workflow

Use this agent to find out what the React app still lacks compared with the Vue app it was ported from. It reads code and writes one report; it never changes source files.

## Workflow Steps

1. **Locate the Vue source**
    - Use the path in `$VUE_REPO_PATH` if set
    - Otherwise use `/workspaces/trip-fotos-vue` if it exists
    - Otherwise shallow-clone it outside this repo: `git clone --depth 1 https://github.com/andres-codigo/trip-fotos-vue /tmp/trip-fotos-vue` (reuse the clone if it is already there and run `git -C /tmp/trip-fotos-vue pull --ff-only`)
    - Record the Vue commit (`git -C <path> log -1 --format='%h %cs'`) in the report header

2. **Inventory the Vue app** — read, do not skim; a feature is defined by behaviour, not file names
    - Routes: `src/router.js` (path, component, auth guard)
    - Store: every module under `src/store/modules/` — actions (and the Firebase endpoints or SDK calls they use), getters, state shape
    - Pages: `src/pages/**` — what each renders, which store actions it dispatches, which user interactions it supports
    - Components: `src/components/**` — props, emitted events, validation rules, empty/loading/error states
    - Composables and directives: `src/composables/**`, `src/directives/**`
    - Firebase usage: Realtime Database paths, Auth flows, Cloud Storage uploads (`src/firebase.js`, `src/constants/firebase.js`)

3. **Map each Vue feature to React**
    - Routes: `src/constants/ui/paths.js` (`PATHS`) and `src/app/`
    - Store: `src/store/slices/**`
    - Pages and components: `src/pages/**`, `src/components/**` (including `hooks/` subfolders)
    - Shared hooks and utilities: `src/utils/**`
    - Treat a React stub (a page that only renders a heading) as **missing**, not partial

4. **Rate every feature**
    - **done** — equivalent behaviour exists and is tested
    - **partial** — exists but is missing behaviour; list exactly what is missing
    - **missing** — no equivalent
    - **superseded** — React deliberately does it differently (e.g. a directive replaced by a hook); say what replaced it
    - Cite evidence for every rating: Vue file(s) and React file(s), with line numbers for partial ratings

5. **Group into backlog-sized work items**
    - One item = one reviewable commit (roughly one component, page, hook, or slice plus its tests)
    - Give each item: a short title, the Vue source files to port, the React files to create or change, acceptance criteria as a checklist, suggested labels from the repo's label set (`gh label list`), and the items it depends on
    - Order items so dependencies come first (UI atoms → hooks → components → slices → pages)
    - Flag anything that needs a new route (it must also go in `PATHS` and `vercel.json` rewrites)

6. **Write the report** to `.claude/plans/parity-gap-report.md` using the format below, then reply with the summary table only.

## Report format

```markdown
# Parity gap report

Vue commit: `<hash> <date>` · React commit: `<hash>` · Generated: <date>

## Summary

| Area | Feature | Status | Vue | React |
| ---- | ------- | ------ | --- | ----- |

## Work items

### W1 — <title>

- **Depends on:** — / W<n>
- **Labels:** feature, frontend, …
- **Vue source:** `src/…`
- **React target:** `src/…`
- **Acceptance criteria:**
    - [ ] …
```

## Notes

- Read-only: the only file this agent writes is `.claude/plans/parity-gap-report.md`
- Do not propose porting Vue-specific mechanics literally — describe the behaviour and let the React conventions in `.github/instructions/` decide the shape
- Ignore Vue tooling differences (ESLint config, Vue plugins, Vite config) unless they change user-facing behaviour
- Use British English (`en-GB`) throughout the report
