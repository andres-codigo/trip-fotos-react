---
name: design-change
description: Guide a UI design change from brief to build (2–3 options with every state in their own choices artifact, the chosen one drawn into the design system, then the issue, branch, build and /ui-check). Use when asked to redesign, restyle or propose a layout for a page or component, or when work starts from a Claude Design session.
argument-hint: '[page or component]'
---

# Design change

Design first, build second. The design system artifact (https://claude.ai/artifact/AjzwYiSyS7wJZqgKPRBhdC) is the single source of truth: it only ever shows decided designs, never options. The work does not land on `main` directly (see `CLAUDE.md`).

## Brief

Before designing, make sure you have all five. Ask for any that is missing:

1. The problem, not just the fix.
2. Who uses it, and on what device.
3. What must not change: the dark-only theme, the moss accent, existing patterns, British English copy.
4. One to three references, each with a reason. Screenshots show how something looks; a URL gives only text and markup. For the app itself, capture the "before" with `/ui-check` at 390, 768 and 1280px.
5. The size of the change: a one-component tweak or a redesign.

## Options

- Draw the options in their own choices artifact, never in the design system: one page per decision, named for it (e.g. "Reduced Motion Spinner Choices 834"), with what is wrong today, each option with its states and For and Against, a recommendation, and a "To decide" block ending in a Decision line. The #650 (city filter) [choices](https://claude.ai/artifact/E5BnwdmwuqyPj2rZ2ZRv2m) is the model. Discuss the options with the user, with both links, before drawing.
- Offer 2–3 options with a recommendation. Check each against the tokens in [styles.instructions.md](../../../.github/instructions/styles.instructions.md) and the artifact's accessibility rules: 4.5:1 text contrast, 44px touch targets, visible focus, no colour-only states.
- Draw every state: empty, loading, error, one item, many items, long text, keyboard focus, mobile.
- Draw dark only (the app has one theme), at the design system's frames: 375, 768 and 1280px. The breakpoints (640, 768/769, 1024) are where layouts change, not draw widths: add a frame at one only where that page's layout changes there.
- Reuse existing tokens and patterns, and flag anything new.
- Sample people get invented names (e.g. Amara Okafor, Jonas Weber). Before publishing, grep the artifact for the repo owner's name and initials, since the design system's sample signed-in traveller is copied into new pages.
- Update the design system for this change only, never all pending changes at once. A section whose final look this change settles carries an "Agreed #N" chip. One a later issue still changes carries "Due #N". When an issue lands, flip its Due tags to Agreed and mark its row in the artifact README's Review status table Done, in the same publish.

## Build

Once the user picks an option:

1. Record the decision in the choices artifact (its Decision line, and the chosen option marked). Then draw only the chosen design into the design system before the build, tagged "Due #N", with a link to the choices artifact in its Review status row; it turns Agreed and the row Done when the issue lands.
2. Create the issue linking the choices artifact and the design system version (or, when the work is already an issue, add both links to it), then run `/start-issue` (a `feature/` or `enhancement/` branch). When the option replaces a component or variant, the issue lists what the old one leaves unused (its tests, `data-cy` selectors, constants, mock data and docs) and removes it ([Writing an issue](../../../docs/ci-cd.md#writing-an-issue)).
3. Build the change. A layout change to a shared component gets a size or position component test first ([testing.instructions.md](../../../.github/instructions/testing.instructions.md#visual-check-for-ui-changes)).
4. Run `/ui-check` and fix what it finds, then `/verify`, commit and `/finish-pr`.
