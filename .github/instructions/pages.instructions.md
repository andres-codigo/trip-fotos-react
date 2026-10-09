---
name: page-development
description: Use when creating or modifying React pages. Covers page folder structure, route-level responsibilities, data loading orchestration, and page testing requirements.
applyTo: 'src/pages/**/*.{jsx,js}'
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

## Page Structure And Accessibility

Every page's root `<main>` must:

- Have `id={ACCESSIBILITY.MAIN_CONTENT_ID}` and `tabIndex={-1}`, so the skip link in `App.jsx` can move focus to it.
- Render its own `<title>` (React hoists it into `<head>`), in the form ``{`Page name · ${GLOBAL.SITE_NAME}`}``, so each route has a distinct browser tab title.
- Contain exactly one `<h1>` naming the page. The site name in the header is not a heading, so the page's own heading is the `<h1>`; nest section headings from `<h2>` down.

Do not render `<main>`, `<header>` or `<footer>` inside dialogs or other components: the dialog is portalled to `<body>`, where these would create duplicate page landmarks.

## Routing Rules

- Routing configuration is owned by `src/app/App.jsx`.
- Protected routes should redirect unauthorised users to `PATHS.AUTHENTICATION`.
- Do not hardcode route strings; use centralised constants from `src/constants`.

## Data Loading

- Trigger page data loading in lifecycle hooks (for example, `useEffect`) or RTK Query hooks.
- Keep loading and error state in Redux/store-backed logic rather than ad hoc local patterns.
- Reuse selectors where possible to avoid repetitive state mapping logic.

See [store.instructions.md](./store.instructions.md) for RTK Query/thunk conventions.

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

See [testing.instructions.md](./testing.instructions.md) for broader Vitest/Cypress conventions.

## Styling

- Prefer page-specific SCSS modules for page layout concerns.
- Reusable component styling must remain inside component-level style modules.
- Follow shared SCSS conventions in [styles.instructions.md](./styles.instructions.md).

## Linting And Formatting

- Ensure every edited or newly created page file, style module, and related test file is ESLint-clean and Prettier-formatted before finishing work.
