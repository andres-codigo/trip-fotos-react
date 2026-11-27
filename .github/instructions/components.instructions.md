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
- Name and folder follow the existing component, so call sites and the folder-per-component rule stay consistent: when a shadcn component replaces one (e.g. `ui/badge/BaseBadge`), keep its exported name, folder and file name (`BaseBadge`) and put the shadcn code inside it, in the same change. A shadcn component with no counterpart takes the shadcn name in PascalCase (`Tooltip` in `ui/tooltip/Tooltip.jsx`).
- Generated components are styled with Tailwind classes through `cn()`; there are no style modules.
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

### Forms

Build a form from the parts in `src/components/ui/form/`, not hand-rolled fields:

- `Input`, `Textarea` and `Combobox` share `fieldClasses.js`: field, label, required-mark and help-text classes, and `describedBy(id, helpText, hasError)`. That helper points `aria-describedby` at `${id}-help`, then `${id}-error`. A custom field (such as a file drop) uses the same classes and helper.
- A form with required fields shows `RequiredLegend` once, above its fields, and marks each required field with `showRequiredMark`. Help text says the rule before the user breaks it.
- A form with several fields shows `ErrorSummary` above them. Pass the errors as `{ id, message }`, with `id` matching the field's id, and bump `focusKey` once per failed submit, so the summary takes focus then and not on every edit.

- Check a field when it is left and on submit, never while typing. Login and Reset have no summary: focus moves to the first invalid field.
- Set `autocomplete` on every identity field (`email`, `current-password` on Log in, `new-password` on Create an account, `given-name`, `family-name`), and `off` on search boxes.

### Copy

Messages, labels and status text live in `src/constants` (long-form prose such as Privacy may stay in the page), and all copy follows the design system's content rules:

- British English, sentence case, second person kept to a minimum. The app's words: "Email", "Log in", "Log out", "Create an account".
- A button is one word where possible (Register, Refresh, Cancel, Delete). One that leads to a person or page says so: "Message {first name}", "View trip", "Go to Travellers".
- A loading button keeps its width and swaps its label for the -ing form with an ellipsis ("Sending…", "Saving…").
- An error says what to do, starting with the verb and ending with a full stop: "Enter your first name.", "Add at least one city." Never count characters down in an error.
- Dates read "12 Mar 2025" and a trip "12–19 Mar 2025 · 8 days"; city names come from one formatter. Use `@/utils/tripDates` and `@/utils/formatCity`, never a local format.
- Signed-in users see full names ("Amara Okafor"); logged-out visitors see the first name and last initial ("Amara O.").

### Destructive And Failed Actions

- Prefer Undo to a confirm dialog for what can be put back: the `toast` shows Undo for 8 seconds without moving focus, and the delete waits until it closes, so Undo never waits on the network.
- What cannot be undone (deleting a profile) is confirmed in a dialog that spells out the consequence, with Cancel first and focused; Escape cancels and focus returns to the button that opened it.
- A failed load is an inline alert (`InlineAlert`) with Try again, never a dialog. A failed save keeps every edit and says what was not saved.
- Do not lose focus when a control disappears: move it to what replaced it (the first card "Show more" added, the next conversation).

### Consistency

Maintain **API consistency** (prop names, validation patterns) when creating similar UI components. This ensures developers can switch between components with minimal cognitive load.

## Accessibility

- Ensure form components handle accessibility attributes (`aria-*`, `role`) for validation states.
- Render a control only while it can do something. An error, empty or unavailable state (e.g. `BaseImage`'s "Image unavailable" fallback) should drop its button or link rather than stay clickable, focusable and lead nowhere.
- **Form Errors**: When displaying form field errors, render both a visual error (if the design calls for one) AND a visually hidden error span with `role="alert"` for screen readers. Use the `renderVisuallyHiddenError` utility and `ErrorMessage` (`ui/error-message`, which `Input`/`Textarea` already use) for a single message; do not hand-roll another `<p role="alert">`. `AddFile` keeps one `<div role="alert">` because it announces several messages as a single region. Page-level request errors use `Alerts`; an error that stays until the user acts, inside a card, uses `InlineAlert` (`ui/inline-alert`).
- **Loading**: Show pending state with `BaseSpinner`, passing a label from `GLOBAL.SPINNER_LABEL` that says what is loading ("Loading messages…"; add an entry for a new context). The label is always visible beside the spinner, which turns, or shows three brightening dots under reduced motion (`SpinnerIcon`, shared with the busy `BaseButton`); forms also set `aria-busy` from an `isLoading` prop. Forms announce loading with `LoadingAnnouncement` (`ui/loading-announcement`); do not hand-roll an `aria-live` loading span. Where a card shows a spinner, reuse `LoadingFallback`.

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

- Ensure every edited or newly created component file, hook and related test file is ESLint-clean and Prettier-formatted before finishing work.

## Styling

- Style components with Tailwind utilities through `cn()`; use `cva` for a component with variants. Never add a stylesheet beside a component.
- Use semantic tokens (`bg-surface`, `text-text-muted`), not literal colours.
- Accept a `className` prop and merge it last through `cn()`, so a caller can override a conflicting utility.
- Put `leading-*` after the `text-[size]` in a class list: `tailwind-merge` drops an earlier `leading-*` when a later `text-[size]` is merged.

See [styles.instructions.md](./styles.instructions.md) for full styling conventions.
