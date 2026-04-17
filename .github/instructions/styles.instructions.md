---
name: scss-styling-conventions
description: Use when creating or modifying SCSS files. Covers SCSS module naming, mixin and variable usage, imports, and colour naming conventions.
applyTo: ['src/**/*.module.scss', 'src/styles/**/*.scss']
---

# SCSS Styling Guidance

## SCSS Modules

- Use **SCSS modules** for component-specific styles.
- Import as `[componentName]Styles` (e.g., `import travellerRegistrationFormStyles from './TravellerRegistrationForm.module.scss'`).
- Module filename should match the component filename: `ComponentName.module.scss`.

## Variables & Mixins

When creating a new SCSS file, **always review `src/styles`** for available variables and mixins to ensure consistency throughout the application.

### Namespaced Imports

Prefer using **namespaced imports** for variables and mixins (e.g., `@use '@/styles/setup/mixins/helpers' as helpers`). This keeps the namespace clear and avoids naming conflicts.

### Using Common Helpers

Instead of re-implementing CSS patterns, use common helpers provided by the project (e.g., `helpers.visually-hidden` for screen-reader-only content).

## Colour Naming

New colour variables should follow the existing naming convention. When possible, reference the "Name that Colour" tool to maintain consistency with the project's colour palette.

## Global Styles

Global styles are located in `src/styles/global.scss`. Component-specific styles should always use SCSS modules, not global styles. This maintains clear style scoping and makes it easier to refactor or remove components later.

## Linting And Formatting

- Ensure every edited or newly created SCSS file is Prettier-formatted and remains compatible with the repository's linting rules before finishing work.
