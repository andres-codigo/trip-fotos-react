---
name: create-component
description: Use when scaffolding a new React component. Automates folder structure creation, test file setup, checking for reusable UI patterns, and generating component and test boilerplate.
---

# Component Scaffolding Workflow

Use this agent when you need to create a new React component with full structure and tests.

## Workflow Steps

1. **Component Details**
    - Get the component name and category (`forms`, `common`, `ui`, `layout`, `travellers`)
    - Confirm the component's purpose and whether it will contain form logic, be purely presentational, or manage internal state

2. **Folder Structure Setup**
    - Create the component folder: `src/components/{category}/{component-name-kebab-case}/`
    - Create the component file: `{ComponentName}.jsx` (PascalCase)
    - Create the SCSS module: `{ComponentName}.module.scss`
    - Create the `__tests__` directory
    - Create `hooks/{useHookName}/index.js` (default export) if the component needs custom hooks; see `create-hook.agent.md`

3. **Check for Reusable Patterns**
    - Review `src/components/ui` and `src/components/common` for existing reusable components (e.g., `BaseButton`, `Input`, `BaseDialog`, `BaseSpinner`, `Alerts`)
    - Advise the user to use existing components if they match the requirements
    - If creating a new reusable component, implement it and flag for immediate refactoring of similar patterns elsewhere

4. **Component Boilerplate**
    - Generate a functional component with hooks structure
    - Scaffold prop-types validation
    - Include a placeholder SCSS import with the correct naming convention
    - Add accessibility attributes if appropriate (form components, interactive elements)
    - Add `data-cy` attributes to meaningful DOM elements (buttons, form inputs, containers, labels, values) for testability
    - Reuse the shared error and loading output (`renderVisuallyHiddenError`, `ErrorMessage`, `LoadingAnnouncement`, `BaseSpinner`); do not hand-roll `role="alert"` or `aria-live` markup

5. **Test File Setup**
    - Create `{ComponentName}.cy.jsx` (Cypress component test) with mount setup
    - Create `{ComponentName}.test.jsx` (Vitest unit test) with render setup
    - Both test files should import the component and define placeholder test cases
    - Reference `src/testUtils` for mocking if needed
    - For Cypress tests, do not use inline string selectors like `cy.get('[data-cy="..."]')`; create and use exported selector constants in `src/constants/test/selectors/components.js` using `getByDataCy`, following the `Header` and `Header.cy.jsx` pattern

6. **Styling**
    - Review `src/styles` for available variables and mixins
    - Add SCSS module with proper imports and namespace usage for helpers/utilities; import it as `{componentName}Styles`
    - Use colour variables from `src/styles/setup/_variables.scss` (add one, named per the Name that Colour convention, rather than a literal `white`/`rgba(...)`)
    - Scope every rule to a class — no top-level element selectors, no plain `.scss` side-effect imports (see `styles.instructions.md` → Scope Every Selector To A Class)
    - Space sibling items with `gap` on the parent, never an outer margin on a reusable component
    - For buttons and links, follow `components.instructions.md` → Buttons And Links: navigation is `BaseButton isLink` with a `modeType`, actions are `<button>`
    - Run `npm run lint:styles` on the new module

7. **Output**
    - Summarise the created structure
    - Link to `.github/instructions/components.instructions.md` for ongoing conventions
    - Provide next steps: implement component logic, add tests, and check for refactoring opportunities

## Notes

- Always check for reusable components already available in the UI and common folders
- When a new reusable component is created, the agent should flag that existing similar components should be refactored to use it
- All new components must have `prop-types` validation from the start
- **All generated files must end with a trailing newline at EOF** — enforce this during file creation to satisfy linting rules
- **Linting and formatting** — ensure all generated and edited files are ESLint-clean, Stylelint-clean and Prettier-formatted before handing off the component work.
- Every new component file must include `data-cy` attributes on all meaningful elements (buttons, inputs, containers, labels, values)
- When new component markup introduces `data-cy` attributes, add corresponding exported constants to `src/constants/test/selectors/components.js` via `getByDataCy` and use those constants in all new `*.cy.jsx` tests instead of literal selector strings
