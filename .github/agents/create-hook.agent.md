---
name: create-hook
description: Use when scaffolding a new custom React hook. Decides where the hook lives (component-scoped or shared), creates the folder, hook file and Vitest test, and checks for existing hooks that already cover the need.
---

# Hook Scaffolding Workflow

Use this agent when you need a new custom React hook with tests.

## Workflow Steps

1. **Hook Details**
    - Get the hook name (`use{Something}`, camelCase) and what it returns
    - Confirm whether it holds state, wraps a side effect, or reads from the Redux store

2. **Check for Existing Hooks**
    - Search `src/utils/**` and every `src/components/**/hooks/` folder for a hook that already covers the need
    - Advise reusing or extending it instead of duplicating

3. **Placement**
    - Used by one component (or one component tree): `src/components/{category}/{component}/hooks/{useHookName}/index.js`, following `src/components/layout/main-nav/hooks/`
    - Used across unrelated components or pages: `src/utils/{useHookName}/index.js`, following `src/utils/useViewport/`
    - If unsure, start component-scoped — promoting later is cheap

4. **Hook Boilerplate**
    - Default-export the hook from `index.js` (no flat `hooks/useX.js` files, no named export)
    - Return a stable object (`{ value, action }`) with callbacks wrapped in `useCallback` where consumers may pass them to children; a tuple only for a `useState`-style pair
    - Read session data through store selectors, never `localStorage`; dispatch thunks for app data (a read-only third-party lookup such as the city search may `fetch` inside its hook)
    - Do not export constants from the hook file; put them in `src/constants/**`
    - Put magic values in `src/constants/**` and import them from the subdirectory barrel
    - Use the `@/` alias for every import

5. **Test File Setup**
    - Create `__tests__/{useHookName}.test.js` in the hook's own folder, next to `index.js`
    - Use `renderHook` and `act` from `@testing-library/react`
    - Cover the initial state, every returned action, and edge cases (duplicates, empty input, cleanup on unmount)
    - Put reusable test data in a sibling `__tests__/*TestData.js` file, following `src/utils/useViewport/__tests__/viewportTestData.js`

6. **Output**
    - Summarise the created files
    - Link to `.github/instructions/components.instructions.md` and `.github/instructions/testing.instructions.md`

## Notes

- **All generated files must end with a trailing newline at EOF**
- **Linting and formatting** — ensure all generated and edited files are ESLint-clean and Prettier-formatted before handing off
- Hooks must not touch the DOM directly unless that is their purpose (e.g. click-outside); prefer refs passed in by the caller
