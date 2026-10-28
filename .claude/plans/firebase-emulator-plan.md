# Plan — run Cypress E2E against the Firebase Emulator Suite

Status: **Backlog, optional but ordered** (#292). Do it after #378 (lean repo) and before #379 (Tailwind and shadcn/ui migration). The order is set in #379. Three migration issues (#370, #371, #373) call for `/verify e2e`, and the UI check in CLAUDE.md needs logged-in pages in states the shared live account cannot reach, so repeatable, seeded E2E is worth having first. CI is green and the Register photo test cleans up its own upload (`131d1c1`), backed by a 1-day Storage lifecycle rule on the test user's `images/<uid>/` prefix, so nothing is urgent.

Updated 2026-10-28 for the changes since this plan was written (see the review note on #292 and #465).

Branch: `test/firebase-emulators` (off `main`)

## Why

E2E currently signs in to, reads from and uploads to the live Firebase project:

- Every sign-in test fails if the `CYPRESS_USER_*` account is deleted
- `TravellersList` "register link when not a traveller" silently depends on that user never registering
- The Register photo test writes to production Storage on every run (now deleted in `afterEach`, with a lifecycle rule as backstop)
- CI needs Firebase secrets, so Dependabot PRs skip E2E entirely
- Network or rate-limit blips show up as flaky failures
- The shared account is the only traveller, so E2E and the UI check cannot reach the Contact button, the Contact page, a message with content, or a non-traveller sign-in

The emulators give each run a fresh, seeded Auth + Realtime Database + Storage backend. It is a real Firebase backend (rules included), not a mock, so it satisfies "do not mock the Realtime Database".

## How the app talks to Firebase today

| Service           | Access                                                                                | Emulator change                                              |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Auth (sign-in)    | SDK — `getFirebaseAuth()` in `src/services/firebase/firebase.js`                      | `connectAuthEmulator` behind a flag                          |
| Auth (profile)    | REST — `${API_DATABASE.URL}update?key=` in `travellersSlice.js`                       | Env only: `VITE_API_URL` → emulator identitytoolkit URL      |
| Realtime Database | REST `fetch` — `API_DATABASE.BASE_URL` in `travellersSlice.js`, `messagesSlice.js`    | Env only: `VITE_BACKEND_BASE_URL` → emulator URL (see spike) |
| Storage           | SDK — `getFirebaseStorage()` in `src/services/firebase/firebase.js` (upload + delete) | `connectStorageEmulator` behind a flag                       |

E2E intercepts match `SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD` (`${API_URL}signInWithPassword`). Setting `VITE_API_URL=http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:` keeps those aliases matching the SDK's emulator requests.

## Phase 0 — spike (half a day, decides Phase 2 detail)

1. Confirm how the RTDB emulator resolves the namespace for REST calls without a `?ns=` param. Options in order of preference:
    - `http://127.0.0.1:9000/` with the emulator's default namespace for a `demo-` project (`<projectId>-default-rtdb`)
    - `http://demo-trip-fotos-default-rtdb.localhost:9000/` (Chromium/Electron resolve `*.localhost` to loopback)
    - Last resort: add a `DATABASE_QUERY` constant (`ns=…`) that the slices append — touches every URL builder
2. Confirm the RTDB and Storage emulators accept the Auth emulator's ID tokens and evaluate `auth.uid` / `auth.token.admin` in `database.rules.json` and `storage.rules`.
3. Confirm Cypress's Electron browser reaches all three ports from the Vite app.

## Phase 1 — tooling and config

- Add `firebase-tools` as a devDependency (currently only used ad hoc via `npx` in `firebase:rules`). Check #363 and #361 first: the lean-repo issues prune scripts and dependencies, so add only what the plan needs.
- Use a `demo-trip-fotos` project ID: `demo-` projects never touch real resources and need no credentials.
- `firebase.json` — add an `emulators` block: auth 9099, database 9000, storage 9199, UI 4000, `singleProjectMode: true`. Rules files stay shared, so emulator runs also exercise the real rules.
- Scripts (`package.json` was slimmed in #431; keep the same ordering and add nothing else; sync README Scripts, CLAUDE.md Dev commands and `docs/testing.md`):
    - `emulators` — `firebase emulators:start --project demo-trip-fotos`
    - `emulators:seed` — `node scripts/seed-emulators.mjs`
    - `cy:run:e2e:emulators` — `firebase emulators:exec --project demo-trip-fotos "npm run emulators:seed && <start dev server> && cypress run --e2e"` (CI starts the dev server with `cypress-io/github-action`'s `start` and `wait-on`; locally `.claude/skills/verify/run-e2e.mjs` starts it, so reuse that rather than adding `start-server-and-test`)
- `.env.emulators` (committed, no secrets, beside `.env.example` in the root; new config other than env files and `firebase.json` goes under `config/`, since #433 and #435 tidied the root) holding the emulator URLs, `VITE_FIREBASE_PROJECT_ID=demo-trip-fotos`, a dummy API key, `VITE_USE_FIREBASE_EMULATORS=true` and the seeded test-user credentials. Load it with `vite --mode emulators`.
- Java (JDK 21) is required by the database and storage emulators — only as a runtime the Firebase CLI launches; no Java code is written: add `ghcr.io/devcontainers/features/java:1` to `.devcontainer/devcontainer.json` and forward ports 4000/9000/9099/9199.

## Phase 2 — app wiring

- `src/constants/firebase` — add `USE_EMULATORS` (from `VITE_USE_FIREBASE_EMULATORS`) and emulator host/ports.
- `src/services/firebase/firebase.js`
    - `getFirebaseAuth()` connects the Auth emulator once on first call when `USE_EMULATORS` is set (`connectAuthEmulator` must run before any auth operation — the lazy getter from `abf4b98` makes this straightforward)
    - `getFirebaseStorage()` (from `4816afd`, already initialises Auth first so uploads carry the token) does the same with `connectStorageEmulator`
- The flag is never set in Vercel, so production builds are unchanged; add a unit test asserting the emulators are not connected when the flag is off.

## Phase 3 — deterministic seed

`scripts/seed-emulators.mjs`, using `firebase-admin` (already a dependency) with `FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_DATABASE_EMULATOR_HOST` set, so no service-account key is needed:

- Auth users: a **standard** user (not a traveller), two or more **traveller** users, an **admin** user (custom claim `admin: true`, replacing the manual `npm run admin:claim` step for tests)
- RTDB: `travellers/` and `messages/` built from `src/constants/test/mock-data/` so Vitest, component and E2E share one data set. The data must satisfy the current `firebase/database.rules.json`: every image carries `width` and `height` (#459) and the description field is `tripDescription` (#458). `mock-travellers.js` already uses `tripDescription`; add image dimensions if its files lack them.
- Spread: one traveller with several photos and one with none, at least one message for the signed-in traveller, and cities that give all eight badge tones (#455), so the Contact button, the Contact page, the message list and the gallery are all reachable
- Clears everything first so it is safe to re-run; expose it as a `cy.task('seedEmulators')` for specs that mutate data

## Phase 4 — tests

- Point `TEST_USERS` at the seeded accounts; drop `CYPRESS_USER_*` from the emulator path.
- Remove data-tolerant assertions (`TravellersList` "list or empty state", the conditional refresh-button test) in favour of exact seeded expectations; un-comment "does not show register link when logged in as a traveller" now that a traveller user exists.
- Turn happy-path stubs into real emulator round trips where it adds confidence: registration PUT, photo upload, messages load/delete. Keep `cy.intercept` stubs for error states (500/403/network, `TOO_MANY_ATTEMPTS`), which the emulator cannot produce on demand.
- Re-seed in `beforeEach` of specs that write (Register, Messages) to keep specs order-independent.
- Cover the specs added since: `cypress/e2e/app/StalePersistedStore.cy.js` (#394), which clears the database and so becomes a native emulator reset, `ContactTraveller.cy.js` with a real Contact flow, the axe checks (#358) and the Register upload progress (#442), all against the seeded backend.

## Phase 5 — CI

`cypress-e2e.yml`:

- `actions/setup-java@v4` (temurin 21) and cache `~/.cache/firebase/emulators`
- Run `npm run cy:run:e2e:emulators` with `--mode emulators` (the job currently uses `cypress-io/github-action` with `start: npm run dev` and a `wait-on` on port 3000; keep that shape)
- Remove all Firebase/`CYPRESS_USER_*` secrets from the job and drop the Dependabot skip jobs — E2E then runs on every PR
- Vitest and component workflows keep the `VITE_FIREBASE_*` env from `abf4b98` for now; they no longer strictly need it (lazy Auth) and can drop it in a follow-up

## Phase 6 — local workflow and docs

- `/verify e2e` (`.claude/skills/verify/run-e2e.mjs`) runs against the emulators by default, removing the "uses live Firebase" approval caveat; keep a `live` option only if a live smoke test is retained (see open questions).
- The UI check (CLAUDE.md and `.github/instructions/testing.instructions.md`): point its logged-in screenshots at the emulators with the seeded accounts, so the pages and states (Contact, messages, a non-traveller) are repeatable.
- Update README (Scripts, Environment Variables, CI/CD Workflows, Folder Structure for `scripts/`), CLAUDE.md (dev commands, Environment), `.github/instructions/testing.instructions.md` (seeding and anti-flakiness rules), and the verify skill's SKILL.md.

## Risks

- RTDB REST namespace addressing (Phase 0) — the only change that might touch every URL builder
- Emulator start-up adds ~20–40 s to the E2E job; mitigated by caching the emulator JARs
- Emulator token checks are looser than production (unsigned tokens), so rules are verified but token signing is not — acceptable for E2E

## Open questions

1. Keep a small live smoke suite (sign in only, read-only) on `main` pushes, or go fully emulator-only?
2. Add Java to the devcontainer (larger image, emulator E2E runs locally), or run emulators in CI only?
