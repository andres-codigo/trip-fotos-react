---
name: scss-styling-conventions
description: Use when creating or modifying SCSS files. Covers SCSS module naming, mixin and variable usage, imports, and colour naming conventions.
applyTo: 'src/**/*.scss'
---

# SCSS Styling Guidance

## SCSS Modules

- Use **SCSS modules** for component-specific styles.
- Import as `[componentName]Styles` (e.g., `import travellerRegistrationFormStyles from './TravellerRegistrationForm.module.scss'`).
- Module filename should match the component filename: `ComponentName.module.scss`.

### Scope Every Selector To A Class

CSS Modules hash class names only. An element selector (`a`, `button`, `label`, `h1`) at the top level of a component stylesheet is emitted unchanged, so it restyles that element across the whole app — and only once the component's chunk has loaded, so the bug comes and goes with navigation.

- Every rule in a component or page stylesheet must start from a class: `.label`, not `label`. Element selectors are fine nested under a class (`.formControl label`) or compounded with one (`a.navLink`).
- Plain `.scss` files imported for side effects (`import './input.scss'`) are global stylesheets. Components must import a `.module.scss` instead.
- Mixins that emit element selectors (`valid.label`, `valid.input`, `valid.input-textarea`) may only be included inside a class block.
- Element-level defaults belong in `src/styles` (see Global Styles below), wrapped in `:where()` (e.g. `:where(a)`) so they have zero specificity and never override a component's class. Do not rely on stylesheet order to settle a tie: in production Vite splits shared component CSS into chunks that can load before `global.scss`. `BaseButton`'s base sits at one element's specificity for this reason — above the `:where()` globals, below any component class.
- Hover and active states must differ visibly from the resting state and keep text contrast at or above WCAG AA (4.5:1) in every state. Check the hover colour, not just the resting one: a lighter red hover under white text can fall below 4.5:1.

`npm run lint:styles` (Stylelint `selector-max-type`, part of `npm run lint`) rejects bare element selectors in `src/components` and `src/pages`. It cannot see inside mixins, so the mixin rule above still needs a reviewer's eye.

### Spacing Between Siblings

Space a row or column of items with `gap` on the flex/grid parent, plus `align-items: center` for mixed-height rows. Do not give reusable components (`BaseButton`, `BaseBadge`) an outer margin to fake spacing — it compounds and misaligns wherever the component is reused.

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
