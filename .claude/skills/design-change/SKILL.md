---
name: design-change
description: Guide a UI design change from brief to build (design system artifact first, 2–3 options with every state, then the issue, branch, build and /ui-check). Use when asked to redesign, restyle or propose a layout for a page or component, or when work starts from a Claude Design session.
argument-hint: '[page or component]'
---

# Design change

Design in the design system artifact first, build second. The work does not land on `main` directly (see `CLAUDE.md`).

## Brief

Before designing, make sure you have all five. Ask for any that is missing:

1. The problem, not just the fix.
2. Who uses it, and on what device.
3. What must not change: the dark-only theme, the moss accent, existing patterns, British English copy.
4. One to three references, each with a reason. Screenshots show how something looks; a URL gives only text and markup. For the app itself, capture the "before" with `/ui-check` at 390, 768 and 1280px.
5. The size of the change: a one-component tweak or a redesign.

## Options

- Offer 2–3 options with a recommendation. Check each against the tokens in [styles.instructions.md](../../../.github/instructions/styles.instructions.md) and the artifact's accessibility rules: 4.5:1 text contrast, 44px touch targets, visible focus, no colour-only states.
- Draw every state: empty, loading, error, one item, many items, long text, keyboard focus, mobile.
- Reuse existing tokens and patterns, and flag anything new.
- Sample people get invented names (e.g. Amara Okafor, Jonas Weber). Before publishing, grep the artifact for the repo owner's name and initials, since the design system's sample signed-in traveller is copied into new pages.
- Update the artifact for this change only, never all pending changes at once. A section whose final look this change settles carries an "Agreed #N" chip. One a later issue still changes carries "Due #N". When an issue lands, flip its Due tags to Agreed and mark its row in the artifact README's Review status table Done, in the same publish.

## Build

Once the user picks an option:

1. Create the issue linking that artifact version, then run `/start-issue` (a `feature/` or `enhancement/` branch).
2. Build the change. A layout change to a shared component gets a size or position component test first ([testing.instructions.md](../../../.github/instructions/testing.instructions.md#visual-check-for-ui-changes)).
3. Run `/ui-check` and fix what it finds, then `/verify`, commit and `/finish-pr`.
