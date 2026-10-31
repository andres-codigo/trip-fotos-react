---
name: tailwind-styling-conventions
description: Use when styling components or pages, or editing src/styles/tailwind.css. Covers Tailwind utilities, cn(), semantic tokens, the global stylesheet, spacing and accessibility of states.
applyTo: 'src/**/*.{jsx,css}'
---

# Styling Guidance

The app is styled with Tailwind v4 utilities. There are no SCSS or CSS modules. The app is dark-only from the redesign in #383; until then the tokens hold the app's current light values.

## Utilities And `cn()`

- Style components and pages with utility classes in `className`. Combine and de-conflict them with `cn()` from `@/utils/cn`; use `class-variance-authority` (`cva`) for a component with variants (see `BaseButton`, `BaseBadge`, `Alerts`).
- A reusable component takes a `className` prop and merges it last through `cn()`, so the caller can override a conflicting utility.
- Do not add a stylesheet beside a component. A rule that cannot be a utility (a `@keyframes`, a `@font-face`, an element default) goes in `src/styles/tailwind.css`.
- Prettier sorts the classes (`prettier-plugin-tailwindcss`, including inside `cn()` and `cva()`); do not sort by hand.

## Semantic Tokens, Not Literal Colours

`src/styles/tailwind.css` holds the semantic tokens (`--background`, `--primary`, `--border`, `--destructive` and so on) and maps them to utilities (`bg-primary`, `text-muted-foreground`, `border-border`). Use a token, not a literal `white`, `#fff` or `rgb(0 0 0 / …)`. A value that two components need becomes a token or an `@theme` entry, not a second copy. Use `rem` for sizes and spacing, not `px`. The existing breakpoints are 768 and 480px (inclusive: use `mobile:` for `max-width: 768px`, and an arbitrary `[@media(width<=480px)]:` variant for 480px, because `max-[480px]` is exclusive).

## Layers And Specificity

- Tailwind's theme and utilities layers are imported; preflight is left out because its reset would change headings, lists and form controls.
- Utilities sit in a layer, and unlayered CSS always beats a layer. The global page-shell rules (`html`, `body`, `main`, `section`, `.mainContainer`, `.cardPage`) are unlayered on purpose. Element defaults that a utility must be able to override (`a`, `li`) sit in `@layer base`, wrapped in `:where()` so they have zero specificity.
- A utility that does not take effect is almost always an unlayered rule winning. Check `tailwind.css` before reaching for `!`.

## Spacing Between Siblings

Space a row or column of items with `gap` on the flex or grid parent, plus `items-center` for mixed-height rows. Do not give reusable components (`BaseButton`, `BaseBadge`, `BaseCard`, `BaseImage`) an outer margin to fake spacing: it compounds and misaligns wherever the component is reused. `BaseCard` keeps only `mx-auto` to centre itself; a page adds the global `cardPage` class for its vertical spacing.

## States And Accessibility

- Drive visual state from state, not class names: `aria-invalid:`, `data-[state=open]:`, `disabled:` and `aria-current:` variants, so a test can assert the attribute.
- Hover and active states must differ visibly from the resting state and keep text contrast at or above WCAG AA (4.5:1) in every state. Check the hover colour, not just the resting one: a lighter red hover under white text can fall below 4.5:1.
- Respect reduced motion for any animation that is not a spinner.

## Linting And Formatting

Ensure every edited file is ESLint-clean and Prettier-formatted before finishing work (`npm run lint`, `npm run format`).
