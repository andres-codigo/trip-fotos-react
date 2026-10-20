# Parity gap report

> **Archived.** Retired after the Vue parity epic (#274) closed in #291. Paths in this file refer to where it lived while active (`.claude/…`, `.github/agents/…`); see [the case study](README.md) for context.

Vue commit: `c0287e6 2026-06-04` · React commit: `b7820e0` · Generated: 2026-10-16

## Summary

| Area | Feature | Status | Vue | React |
| ---- | ------- | ------ | --- | ----- |
| Routing | Auth guards (requiresAuth/requiresUnauth), 404 catch-all | done | `src/router.js` | `src/app/App.jsx` |
| Routing | `/` redirect to trips list | superseded (Home stub page at `/`, list at `/travellers`) | `src/router.js` | `src/pages/home/Home.jsx` |
| Routing | `/trips/:id` traveller detail + nested `/contact` | missing | `src/router.js`, `TravellerDetail.vue` | none |
| Routing | `/privacy` | React-only | none | `src/pages/privacy/Privacy.jsx` |
| Auth | Login/signup, auto-logout timer, tryLogin, logout | done | `store/modules/auth/actions.js` | `authenticationSlice.js` |
| Auth | Auth page | done | `UserAuth.vue` | `Authentication.jsx`, `UserAuthenticationForm.jsx` |
| Travellers | registerTraveller thunk incl. Storage upload | done | `travellers/actions.js` | `travellersSlice.js:73-150` |
| Travellers | loadTraveller(s), updateTravellers, travellerName | done | `travellers/actions.js` | `travellersSlice.js:31,184,264,302` |
| Travellers | deleteTraveller (DB record + Storage images) and deleteTravellerMessages | missing | `actions.js:242-326` | no thunk |
| Travellers | Registration form fields and validation | partial: no AddFile (`TODO` in form) | `TravellerForm.vue:91,204` | `TravellerRegistrationForm.jsx` |
| Travellers | Registration page | done | `TravellerRegistration.vue` | `Register.jsx` |
| Travellers | List page shell, refresh, register button, spinner, empty state | done | `TripsList.vue` | `TravellersList.jsx` |
| Travellers | List items (TripItem: name, date, description, days, badges, images, links, delete, dialog) | missing (placeholder `<li>Trip Item</li>` at `TravellersList.jsx:~115`) | `TripItem.vue` | none |
| Travellers | City filter (TripFilter) and filtered list | missing | `TripFilter.vue`, `TripsList.vue:114` | none |
| Travellers | Traveller detail page | missing | `TravellerDetail.vue` | none |
| Messages | contactTraveller, loadMessages, deleteMessage | missing | `messages/actions.js` | no slice |
| Messages | ContactTravellerForm / ContactTraveller page | missing | `ContactTravellerForm.vue` | none |
| Messages | MessageItem and MessagesReceived page | missing (`Messages.jsx` is a heading stub) | `MessageItem.vue`, `MessagesReceived.vue` | `Messages.jsx` |
| File upload | AddFile, DropZone, FilePreview | missing | `components/file-uploader/*` | none |
| File upload | file-list / file-uploader composables | missing | `composables/*` | none |
| UI | BaseCard, BaseButton, BaseSpinner, BaseDialog | done | `components/ui/*` | `components/ui/*` |
| UI | BaseBadge | missing | `BaseBadge.vue` | none |
| UI | BaseImage | missing | `BaseImage.vue` | none |
| Layout | Header/nav, logout, mobile menu | done | `TheHeader.vue` | `components/layout/**` |
| Layout | click-outside directive | superseded by `useClickOutsideToClose` | `directives/click-outside-directive.js` | `main-nav/hooks/useClickOutsideToClose` |
| Pages | 404 page | done | `PageNotFound.vue` | `PageNotFound.jsx` |

Note: ratings of "done" for list shell/auth are based on behaviour read in code; "tested" was confirmed only by presence of `__tests__`/`*.test.js` files, not a coverage run.

## Work items

### W1 — BaseBadge and BaseImage UI atoms

- **Depends on:** —
- **Labels:** feature, frontend, styling, testing
- **Vue source:** `src/components/ui/BaseBadge.vue`, `src/components/ui/BaseImage.vue`
- **React target:** `src/components/ui/badge/`, `src/components/ui/image/` (component, SCSS module, `__tests__`)
- **Acceptance criteria:**
    - [ ] Badge renders type-specific styling for city areas
    - [ ] Image handles load/error fallback and alt text from title
    - [ ] Prop-types, tests, accessibility per `components.instructions.md`

### W2 — File uploader hooks and components (AddFile, DropZone, FilePreview)

- **Depends on:** —
- **Labels:** feature, frontend, form, testing
- **Vue source:** `components/file-uploader/*`, `composables/file-list.js`, `composables/file-uploader.js`
- **React target:** `src/components/forms/file-uploader/` (with `hooks/useFileList`, `hooks/useFileUploader`), constants in `src/constants/`
- **Acceptance criteria:**
    - [ ] Drag-and-drop and file-picker add files; duplicates ignored
    - [ ] Preview with remove; type/size validation errors shown accessibly
    - [ ] Exposes the file list to the parent form

### W3 — Wire file uploader into registration form

- **Depends on:** W2
- **Labels:** enhancement, frontend, form, firebase
- **Vue source:** `TravellerForm.vue:91,204-225`
- **React target:** `TravellerRegistrationForm.jsx`, `useTravellerRegistration.js`
- **Acceptance criteria:**
    - [ ] Replace the `TODO: AddFile` with the uploader
    - [ ] Selected files passed to `registerTraveller` (already uploads to Storage)
    - [ ] Tests extended; E2E registration with image

### W4 — deleteTraveller and deleteTravellerMessages thunks

- **Depends on:** —
- **Labels:** feature, redux/state, firebase, testing
- **Vue source:** `travellers/actions.js:242-326`
- **React target:** `src/store/slices/travellersSlice.js` (+ tests)
- **Acceptance criteria:**
    - [ ] Deletes DB record, associated Storage images and messages
    - [ ] Follows the store error-handling pattern; forces list refresh
    - [ ] Unit tests including failure paths

### W5 — TravellerItem component

- **Depends on:** W1, W4
- **Labels:** feature, frontend, testing
- **Vue source:** `components/trips/TripItem.vue`
- **React target:** `src/components/travellers/TravellerItem/`; replace placeholder in `TravellersList.jsx`
- **Acceptance criteria:**
    - [ ] Name, registered date, shortened description, days in city, area badges
    - [ ] Up to 5 images plus "See all N photos" link
    - [ ] Contact/details links (contact hidden for own record and non-travellers); delete for own record with error dialog
    - [ ] Loading state; tests

### W6 — TravellerFilter and filtered list

- **Depends on:** W5
- **Labels:** feature, frontend, form, testing
- **Vue source:** `TripFilter.vue`, `TripsList.vue:114-130`
- **React target:** `src/components/travellers/TravellerFilter/`, `TravellersList.jsx`
- **Acceptance criteria:**
    - [ ] City checkboxes (tokyo, prague, sydney, canberra) all active by default
    - [ ] List filters by area; empty-state when none match
    - [ ] Tests

### W7 — Messages slice

- **Depends on:** —
- **Labels:** feature, redux/state, firebase, testing
- **Vue source:** `store/modules/messages/*`
- **React target:** `src/store/slices/messagesSlice.js`, register in `store.js`, constants in `src/constants/`
- **Acceptance criteria:**
    - [ ] `contactMessage`, `loadMessages`, `deleteMessage` thunks, selectors
    - [ ] Persistence decision documented; unit tests

### W8 — ContactTravellerForm and traveller detail page (new route)

- **Depends on:** W1, W5, W7
- **Labels:** feature, frontend, form, testing
- **Vue source:** `TravellerDetail.vue`, `ContactTraveller.vue`, `ContactTravellerForm.vue`, router children
- **React target:** `src/pages/travellers/TravellerDetail.jsx`, `src/components/forms/contact-traveller/`, routes in `App.jsx`
- **Acceptance criteria:**
    - [ ] NEW ROUTES: `/travellers/:id` and `/travellers/:id/contact` added to `PATHS` and to the `vercel.json` rewrites allow-list (the current rewrite pattern is a fixed list and will not match dynamic ids)
    - [ ] Detail shows full profile and all photos; contact link only for non-owners who are travellers
    - [ ] Contact form validates email and message, submits via W7, shows success/error
    - [ ] Unknown id handled; auth-guarded; tests

### W9 — Messages page and MessageItem

- **Depends on:** W7
- **Labels:** feature, frontend, testing
- **Vue source:** `MessagesReceived.vue`, `MessageItem.vue`
- **React target:** `src/pages/messages/Messages.jsx`, `src/components/messages/MessageItem/`
- **Acceptance criteria:**
    - [ ] Loads messages on mount with spinner, error dialog and empty state
    - [ ] Each message shows sender email and text, with delete
    - [ ] Replace the heading stub; tests and E2E

### W10 — Home route decision

- **Depends on:** —
- **Labels:** enhancement, frontend
- **Vue source:** `router.js` (`/` redirects to trips)
- **React target:** `src/app/App.jsx`, `Home.jsx`
- **Acceptance criteria:**
    - [ ] Confirm whether the Home stub is intentional (it may be deliberate site-spec work); either redirect to the travellers list or mark as superseded

## Backlog sync decisions (agreed 2026-10-18 — `/backlog-sync --apply` must follow these)

- **W10 — dropped.** Keep the React Home page (deliberate site-spec work, #263); do not redirect `/`. No issue, not queued.
- **W2 — use the existing issues, do not create a new one:**
    - **#99** (`useFileList`) — stale: append file type/size validation with limits in `src/constants/`. Depends on none.
    - **#101** (FilePreview) — current: no body change. Depends on #99.
    - **#100** (FileDrop) — stale: append an `AddFile` wrapper exposing the file list to the parent form, accessible validation errors, target `src/components/forms/file-uploader/`. Depends on #99, #101.
    - Add labels `enhancement`, `form`, `testing` to #99 and #100, and `enhancement` to #101.
- **W8 — split into two issues:** W8a "Traveller detail page (`/travellers/:id`)" (depends W1, W5) and W8b "ContactTravellerForm and contact route" (depends W7, W8a). W8a must add a `vercel.json` rewrite that matches dynamic ids (the current allow-list is fixed paths).
- **W3** depends on #100 (not W2).
- Every new issue gets the `enhancement` triage label in addition to the report's labels.
- Epic: create `Vue parity` (none exists).
- **Queue order:** W1 → #99 → #101 → #100 → W3 → W4 → W5 → W6 → W7 → W8a → W8b → W9
