---
name: components-development
description: Use when creating, modifying, or refactoring React components. Covers component folder structure, reusability patterns, hooks placement, testing requirements, and accessibility conventions.
applyTo: 'src/components/**/*.{jsx,js}'
---

# Component Development Guidance

Page-level guidance is maintained separately in [pages.instructions.md](./pages.instructions.md).

## Folder Structure

Each component must reside in its own contextual folder. Components are located in `src/components`, categorised by type: `ui` (generic, app-agnostic building blocks such as `BaseButton`, `Input`), `common` (app-wide pieces that are not generic UI, e.g. `LoadingFallback`), `forms`, `layout`, `messages`, `travellers`.

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
        UserAuthenticationForm.test.jsx
      hooks/
        useUserAuthentication/
          index.js
          __tests__/
            useUserAuthentication.test.js
    ```

### shadcn/ui components

`components.json` points the shadcn CLI at `@/components/ui`, which writes a flat `ui/<name>.jsx`. That breaks the folder-per-component rule, so after `npx shadcn@latest add <name>`:

- Move the generated file to `src/components/ui/<name>/<Name>.jsx` (PascalCase file, lowercase-hyphen folder) and give it a `__tests__/` folder with a test.
- Add `prop-types` for every prop, as the generated file has none.
- Keep the generated `cn` import (`@/utils/cn`) and fix any other import to the `@/` alias.
- If a component of that name already exists (e.g. `ui/badge/BaseBadge`), do not let the CLI overwrite or sit beside it: migrate the existing component to the shadcn one in the same change.
- Add `lucide-react` and Radix packages only when a component needs them.

### Refactoring Rule

If adding to a folder with flat components, refactor existing components into their own folders first. When a new reusable pattern emerges, create a new reusable component in the appropriate folder and immediately refactor existing code to utilise it.

## Component API

- Use **functional components with hooks**.
- Use **default exports** for the component.
- Each component must have a `__tests__` directory in its folder.
- Hooks specific to a component belong in a `hooks` subfolder within the component's folder, one folder per hook, default-exported from `index.js` (e.g., `hooks/useCitySearch/index.js`), with the test in that hook's own `__tests__/`. Hooks shared across components live in `src/utils/{useHookName}/index.js` (see `create-hook.agent.md`).
- A hook returns an object (`{ value, action }`). A tuple is only for a `useState`-style pair.
- Hooks do not read `localStorage`, call the database or define exported constants; use store selectors, thunks and `src/constants`.

### Prop Types

Use `prop-types` for **all component props** (a component that takes none, such as `Footer`, needs none). Define type-checking for each prop to maintain consistency and catch bugs early.

## Reusability

When creating or recreating components, check `src/components/ui` or `src/components/common` for existing reusable components (e.g., `Input`, `Button`) and use them.

### Buttons And Links

Choose the element by what it does, then choose the look with `modeType`:

- **Navigates to a route** → `<BaseButton isLink to={...}>` (renders a `<Link>`). Never a `<button>` with a navigate handler: links keep middle-click, open-in-new-tab and correct screen-reader semantics.
- **Performs an action** (submit, delete, open a dialog) → `<BaseButton type="button">` (renders a `<button>`).
- A link with no `modeType` renders as an inline text link. Give it a `modeType` to look like a button: `primary` (filled — the main action), `outline` (secondary), `danger` (destructive, e.g. Delete), `flat`, `text`. Use these rather than a local override class, so colours and hover states stay consistent; add a new mode to `BaseButton` if none fits.
- One `primary` per action group; actions sit in a flex row spaced with `gap` (see [styles.instructions.md](./styles.instructions.md#spacing-between-siblings)).

### Consistency

Maintain **API consistency** (prop names, validation patterns) when creating similar UI components. This ensures developers can switch between components with minimal cognitive load.

## Accessibility

- Ensure form components handle accessibility attributes (`aria-*`, `role`) for validation states.
- Render a control only while it can do something. An error, empty or unavailable state (e.g. `BaseImage`'s "Image unavailable" fallback) should drop its button or link rather than stay clickable, focusable and lead nowhere.
- **Form Errors**: When displaying form field errors, render both a visual error (if the design calls for one) AND a visually hidden error span with `role="alert"` for screen readers. Use the `renderVisuallyHiddenError` utility and `ErrorMessage` (`ui/error-message`, which `Input`/`Textarea` already use) for a single message; do not hand-roll another `<p role="alert">`. `AddFile` keeps one `<div role="alert">` because it announces several messages as a single region. Page-level request errors use `Alerts`.
- **Loading**: Show pending state with `BaseSpinner`; forms also set `aria-busy` from an `isLoading` prop. Forms announce loading with `LoadingAnnouncement` (`ui/loading-announcement`); do not hand-roll an `aria-live` loading span. Where a card shows a spinner, reuse `LoadingFallback`.

## Testing

When creating a new component, always create corresponding test files:

### Local Tests (in `__tests__` directory)

- **Cypress component test** (`*.cy.jsx`) for UI interaction and visual behaviour.
- **Vitest unit test** (`*.test.jsx` for a component, `*.test.js` for a hook or plain module) for component logic.

### Running Tests

- Component tests: `npm run cy:run:auto {path/to/component}`
- Unit tests: `npm run vitest:run` or `npm run vitest:watch`

### Test Data & Selectors

- For component tests, define reusable test constants (IDs, labels, error messages) in `src/constants/test`.
- Use mocking utilities from `src/testUtils` for consistent test setup.

See [testing.instructions.md](./testing.instructions.md) for broader Vitest/Cypress conventions.

## Linting And Formatting

- Ensure every edited or newly created component file, hook, style module, and related test file is ESLint-clean and Prettier-formatted before finishing work.

## Styling

- Use **SCSS modules** for component-specific styles.
- Import as `[componentName]Styles` (e.g., `import userAuthenticationFormStyles from './UserAuthenticationForm.module.scss'`), never a bare `styles`.
- When creating a new SCSS file, review `src/styles` for available variables and mixins to ensure consistency.
- Never use a bare element selector at the top level of a style module, and never import a plain `.scss` file from a component — both leak globally. `npm run lint:styles` enforces the first.

See [styles.instructions.md](./styles.instructions.md) for full SCSS conventions.
