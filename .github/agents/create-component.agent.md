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
    - Create hooks subfolder if the component needs custom hooks

3. **Check for Reusable Patterns**
    - Review `src/components/ui` and `src/components/common` for existing reusable components (e.g., `Button`, `Input`, `Dialog`)
    - Advise the user to use existing components if they match the requirements
    - If creating a new reusable component, implement it and flag for immediate refactoring of similar patterns elsewhere

4. **Component Boilerplate**
    - Generate a functional component with hooks structure
    - Scaffold prop-types validation
    - Include a placeholder SCSS import with the correct naming convention
    - Add accessibility attributes if appropriate (form components, interactive elements)

5. **Test File Setup**
    - Create `{ComponentName}.cy.jsx` (Cypress component test) with mount setup
    - Create `{ComponentName}.test.js` (Vitest unit test) with render setup
    - Both test files should import the component and define placeholder test cases
    - Reference `src/testUtils` for mocking if needed

6. **Styling**
    - Review `src/styles` for available variables and mixins
    - Add SCSS module with proper imports and namespace usage for helpers/utilities

7. **Output**
    - Summarise the created structure
    - Link to `.github/instructions/components.instructions.md` for ongoing conventions
    - Provide next steps: implement component logic, add tests, and check for refactoring opportunities

## Notes

- Always check for reusable components already available in the UI and common folders
- When a new reusable component is created, the agent should flag that existing similar components should be refactored to use it
- All new components must have `prop-types` validation from the start
- All generated files must end with a trailing newline at EOF to satisfy linting rules
