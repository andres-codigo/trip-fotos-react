---
name: tailwind-styling-conventions
description: Use when styling components or pages, or editing src/styles/tailwind.css. Covers Tailwind utilities, cn(), semantic tokens, the global stylesheet, spacing and accessibility of states.
applyTo: 'src/**/*.{jsx,css}'
---

# Styling Guidance

The app is styled with Tailwind v4 utilities. There are no SCSS or CSS modules. The app is dark only, with the design system's dark palette (`color-scheme: dark`); there is no light theme and no theme toggle.

## Utilities And `cn()`

- Style components and pages with utility classes in `className`. Combine and de-conflict them with `cn()` from `@/utils/cn`; use `class-variance-authority` (`cva`) for a component with variants (see `BaseButton`, `BaseBadge`, `Alerts`).
- A reusable component takes a `className` prop and merges it last through `cn()`, so the caller can override a conflicting utility.
- Do not add a stylesheet beside a component. A rule that cannot be a utility (a `@keyframes`, a `@font-face`, an element default) goes in `src/styles/tailwind.css`.
- Prettier sorts the classes (`prettier-plugin-tailwindcss`, including inside `cn()` and `cva()`); do not sort by hand.

## Semantic Tokens, Not Literal Colours

`src/styles/tailwind.css` holds the semantic tokens, named as in the design system (`--bg`, `--surface`, `--text`, `--accent`, `--border-card`, `--danger` and so on), and maps them to utilities (`bg-surface`, `text-text-muted`, `border-border-card`). Every fill that carries text has an `on-…` partner (`bg-accent text-on-accent`); `accent-text` is the accent as text or outline. A `surface` card on `bg` takes a 1px `border-card` edge, since the two grounds are only 1.12:1. A card nested inside a `surface` card takes `border-strong` instead, as `border-card` is only 2.71:1 on `surface`. `border` is for hairline dividers only.

Changing a token or colour value: before running `/verify`, search the specs (`src/**/__tests__/**`, `cypress/**`) for `rgb()`, `rgba()` and hex values and for the old class and token names, and update every assertion the change makes stale. Component specs assert computed colours, not only class names. Also fix any assertion the change makes meaningless, such as "the link is not black" on a dark page. Use a token, not a literal `white`, `#fff` or `rgb(0 0 0 / …)`. A value that two components need becomes a token or an `@theme` entry, not a second copy. Use `rem` for sizes and spacing, not `px`. The existing breakpoints are 1024, 768 and 480px. `lg:` (from 1024px) opens desktop layouts such as a page's two columns; take page widths and columns from `PAGE_LAYOUT` (`@/constants/ui`), not your own `lg:` classes. `mobile:` is `max-width: 768px` (inclusive); 480px takes an arbitrary `[@media(width<=480px)]:` variant, because `max-[480px]` is exclusive.

## Layers And Specificity

- Tailwind's theme and utilities layers are imported; preflight is left out because its reset would change headings, lists and form controls.
- Utilities sit in a layer, and unlayered CSS always beats a layer. The global page-shell rules (`html`, `body`, `main`, `section`, `.mainContainer`, `.cardPage`) are unlayered on purpose. Element defaults that a utility must be able to override (`a`, `li`) sit in `@layer base`, wrapped in `:where()` so they have zero specificity.
- A utility that does not take effect is almost always an unlayered rule winning. Check `tailwind.css` before reaching for `!`.

## Spacing Between Siblings

Space a row or column of items with `gap` on the flex or grid parent, plus `items-center` for mixed-height rows. Do not give reusable components (`BaseButton`, `BaseBadge`, `BaseCard`, `BaseImage`) an outer margin to fake spacing: it compounds and misaligns wherever the component is reused. `BaseCard` keeps only `mx-auto` to centre itself; a page adds the global `cardPage` class for its vertical spacing.

## States And Accessibility

- Drive visual state from state, not class names: `aria-invalid:`, `data-[state=open]:`, `disabled:` and `aria-current:` variants, so a test can assert the attribute.
- Hover and active states must differ visibly from the resting state and keep text contrast at or above WCAG AA (4.5:1) in every state. Check the hover colour, not just the resting one: a lighter red hover under white text can fall below 4.5:1.
- Focus: a global `:focus-visible` rule draws one cream `focus` ring (3px, 2px offset) on every control; do not add per-component focus colours or `outline-none`. A photo tile takes `tile-focus-ring`, which draws the ring outside the photo past a gap in the `surface` colour.
- Respect reduced motion for any animation. A spinner pulses instead of turning (`motion-reduce:animate-skeleton`) and always sits beside visible text.

## Linting And Formatting

Ensure every edited file is ESLint-clean and Prettier-formatted before finishing work (`npm run lint`, `npm run format`).
