---
name: page-development
description: Use when creating or modifying React pages. Covers page folder structure, route-level responsibilities, data loading orchestration, and page testing requirements.
applyTo: ['src/pages/**/*.jsx', 'src/pages/**/*.js']
---

# Page Development Guidance

## Folder Structure

Pages are located in `src/pages` and should be grouped by route or feature area.

### Naming & Location

- **Page file**: PascalCase (e.g., `Authentication.jsx`, `Register.jsx`, `Travellers.jsx`).
- **Folder**: Lowercase with hyphens based on route/feature (e.g., `src/pages/page-not-found/`).
- **Example structure**:
    ```
    src/pages/authentication/
      Authentication.jsx
      Authentication.module.scss
      __tests__/
        Authentication.cy.jsx
        Authentication.test.js
    ```

## Page Responsibilities

Pages should focus on route-level orchestration and composition:

- Handle route and query parameters when needed.
- Orchestrate data loading via Redux thunks or RTK Query hooks.
- Compose reusable UI/components from `src/components`.
- Keep reusable view logic in components/hooks instead of embedding all logic in pages.

## Routing Rules

- Routing configuration is owned by `src/app/App.jsx`.
- Protected routes should redirect unauthorised users to `PATHS.AUTHENTICATION`.
- Do not hardcode route strings; use centralised constants from `src/constants`.

## Data Loading

- Trigger page data loading in lifecycle hooks (for example, `useEffect`) or RTK Query hooks.
- Keep loading and error state in Redux/store-backed logic rather than ad hoc local patterns.
- Reuse selectors where possible to avoid repetitive state mapping logic.

## Error Handling

- Use existing error handling utilities and constants.
- Prefer recoverable UI states (loading, empty, error) instead of page crashes.
- If page-level fallback UI is needed, use a boundary/fallback pattern consistent with existing app behaviour.

## Testing

When creating or modifying pages, keep both local and end-to-end coverage aligned with project patterns:

### Local tests (page folder `__tests__`)

- Cypress component-style page test: `*.cy.jsx`.
- Vitest page/unit logic test: `*.test.js`.

### E2E tests (`cypress/e2e/pages`)

- Create or update page flows as `[PageName].page.cy.js`.
- Use shared constants from `src/constants/test` and helper utilities from `cypress/support/utils`.

### Run commands

- Cypress auto detection: `npm run cy:run:auto {path/to/test-file}`
- Cypress E2E: `npm run cy:run:e2e`
- Vitest: `npm run vitest:run` or `npm run vitest:watch`

## Styling

- Prefer page-specific SCSS modules for page layout concerns.
- Reusable component styling must remain inside component-level style modules.
- Follow shared SCSS conventions in `.github/instructions/styles.instructions.md`.
