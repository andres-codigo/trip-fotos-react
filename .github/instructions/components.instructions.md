---
name: components-development
description: Use when creating, modifying, or refactoring React components. Covers component folder structure, reusability patterns, hooks placement, testing requirements, and accessibility conventions.
applyTo:
  ['src/components/**/*.jsx', 'src/components/**/*.js']
---

# Component Development Guidance

## Folder Structure

Each component must reside in its own contextual folder. Components are located in `src/components`, categorised by type: `common`, `forms`, `layout`, `ui`, `travellers`.

Page-level guidance is maintained separately in `.github/instructions/pages.instructions.md`.

### Naming & Location

- **Component file**: PascalCase (e.g., `UserAuthenticationForm.jsx`). Use descriptive suffixes (e.g., `Form`, `List`, `Card`) to avoid conflicts with page names or other components.
- **Folder**: Match the component name, all lowercase with hyphens (e.g., `src/components/forms/user-authentication/`).
- **Example structure**:
    ```
    src/components/forms/user-authentication/
      UserAuthenticationForm.jsx
      UserAuthenticationForm.module.scss
      __tests__/
        UserAuthenticationForm.cy.jsx
        UserAuthenticationForm.test.js
        useUserAuthentication.test.js
      hooks/
        useUserAuthentication.js
    ```

### Refactoring Rule

If adding to a folder with flat components, refactor existing components into their own folders first. When a new reusable pattern emerges, create a new reusable component in the appropriate folder and immediately refactor existing code to utilise it.

## Component API

- Use **functional components with hooks**.
- Use **default exports** for the component.
- Each component must have a `__tests__` directory in its folder.
- Hooks specific to a component belong in a `hooks` subfolder within the component's folder (e.g., `src/components/forms/user-authentication/hooks/useUserAuthentication.js`).

### Prop Types

Use `prop-types` for **all component props**. Define type-checking for each prop to maintain consistency and catch bugs early.

## Reusability

When creating or recreating components, check `src/components/ui` or `src/components/common` for existing reusable components (e.g., `Input`, `Button`) and use them.

### Consistency

Maintain **API consistency** (prop names, validation patterns) when creating similar UI components. This ensures developers can switch between components with minimal cognitive load.

## Accessibility

- Ensure form components handle accessibility attributes (`aria-*`, `role`) for validation states.
- **Form Errors**: When displaying form field errors, render both a visual error (if the design calls for one) AND a visually hidden error span with `role="alert"` for screen readers. Use the `renderVisuallyHiddenError` utility where applicable.

## Testing

When creating a new component, always create corresponding test files:

### Local Tests (in `__tests__` directory)

- **Cypress component test** (`*.cy.jsx`) for UI interaction and visual behaviour.
- **Vitest unit test** (`*.test.js`) for component logic and hooks.

### Running Tests

- Component tests: `npm run cy:run:auto {path/to/component}`
- Unit tests: `npm run vitest:run` or `npm run vitest:watch`

### Test Data & Selectors

- For component tests, define reusable test constants (IDs, labels, error messages) in `src/constants/test`.
- Use mocking utilities from `src/testUtils` for consistent test setup.

## Styling

- Use **SCSS modules** for component-specific styles.
- Import as `[componentName]Styles` (e.g., `import userAuthenticationFormStyles from './UserAuthenticationForm.module.scss'`).
- When creating a new SCSS file, review `src/styles` for available variables and mixins to ensure consistency.
