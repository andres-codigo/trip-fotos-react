# Plan — run Cypress E2E against the Firebase Emulator Suite

Status: **Epic #292, optional but ordered**; children #499 to #504, grouped by the board's Workstream field. Do it after #378 (lean repo) and before #379 (Tailwind and shadcn/ui migration). The order is set in #379. Three migration issues (#370, #371, #373) call for `/verify e2e`, and the UI check in CLAUDE.md needs logged-in pages in states the shared live account cannot reach, so repeatable, seeded E2E is worth having first. CI is green and the Register photo test cleans up its own upload (`131d1c1`), backed by a 1-day Storage lifecycle rule on the test user's `images/<uid>/` prefix, so nothing is urgent.

Updated 2026-10-29: the plan became epic #292 with six children, one PR each, and the review findings and decisions below were folded in.

Updated 2026-10-29: the #499 spike is done (go); its findings are in Phase 0.

## Epic structure and decisions

| Child | Phase                                          | Do after |
| ----- | ---------------------------------------------- | -------- |
| #499  | 0 — spike, the go or no-go gate                | —        |
| #500  | 1 and 2 — tooling and app wiring behind a flag | #499     |
| #501  | 3 — deterministic seed script                  | #500     |
| #502  | 4 — emulator E2E run alongside the live suite  | #501     |
| #503  | 5 — emulator job in CI alongside the live job  | #502     |
| #504  | 6 — retire the live path, main-only smoke test | #503     |

Decisions:

- **Java 21 goes in the devcontainer** (a runtime the Firebase CLI launches; no Java code is written). It needs a devcontainer rebuild.
- **Live smoke test on `main` pushes only:** one read-only sign-in and read against the live project. It catches drift the emulators cannot see (keys, console settings, deployed rules, real token signing). Pull requests are emulator-only.
- **The live path stays until #504.** Every child before it is additive and removable, so the epic can stop after any of them; #504 is the one real commitment, and #499 is the go or no-go gate.

Gaps found in review, each placed in the child that fixes it:

- `cypress.config.js` uses `dotenv.config()`, which reads only `.env`, so `vite --mode emulators` does not reach it: Cypress would keep the live URLs and credentials (#502).
- The seed script must refuse to run unless the emulator host variables are set (#501).
- The flag must never be set in any Vercel environment, production or preview (#500).
- `firebase-tools` is heavy: pinned dev dependency or `npx` (#499 measures, #500 decides); non-interactive CLI settings in CI (#503).
- HTTPS app against HTTP emulators, and ports (#499, #500).
- The 1-day lifecycle rule stays while the live account exists, and `/verify e2e` keeps its approval gate until the live path is gone (#504).

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

| Service           | Access                                                                                | Emulator change                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Auth (sign-in)    | SDK — `getFirebaseAuth()` in `src/services/firebase/firebase.js`                      | `connectAuthEmulator` behind a flag                                                        |
| Auth (profile)    | REST — `${API_DATABASE.URL}update?key=` in `travellersSlice.js`                       | Env only: `VITE_API_URL` → emulator identitytoolkit URL                                    |
| Realtime Database | REST `fetch` — `API_DATABASE.BASE_URL` in `travellersSlice.js`, `messagesSlice.js`    | Env: `VITE_BACKEND_BASE_URL` → `http://127.0.0.1:9000`, plus `?ns=` in `databaseRequest()` |
| Storage           | SDK — `getFirebaseStorage()` in `src/services/firebase/firebase.js` (upload + delete) | `connectStorageEmulator` behind a flag                                                     |

E2E intercepts match `SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD` (`${API_URL}signInWithPassword`). Setting `VITE_API_URL=http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:` keeps those aliases matching the SDK's emulator requests.

## Phase 0 — spike (#499; done 2026-10-29): go

Run with `firebase-tools@15.34.2`, Java 21 (`openjdk-21-jre-headless`), the repo's real `firebase/database.rules.json` and `firebase/storage.rules`, the `demo-trip-fotos` project and Cypress 16 (Electron 146). Verdict: **go**. The only app change the spike found is one query parameter in one URL builder.

1. **Namespace: add `?ns=demo-trip-fotos-default-rtdb`.**
    - A request with no `ns` is not served from the default namespace: it lands in a separate `fake-server` namespace that has **no rules loaded**, so every read and write succeeds, unauthenticated writes included. Pointing the app at plain `http://127.0.0.1:9000/` would silently skip the rules.
    - `http://demo-trip-fotos-default-rtdb.localhost:9000/` enforces the rules from `curl`, but **fails in Cypress's Electron** (`Failed to fetch`; Node's resolver does not resolve `*.localhost`). Ruled out.
    - `http://127.0.0.1:9000/<path>.json?ns=demo-trip-fotos-default-rtdb&auth=<token>` enforces the rules from the browser. Use it.
    - Cost is small: every Realtime Database call goes through `databaseRequest()` in `src/store/databaseRequest.js`, which already merges a `params` object into the query string. #500 adds a `DATABASE_NAMESPACE` constant (from an env var, unset in production) merged there; no thunk changes. Cypress intercepts for these URLs need to allow the extra parameter (#502).
    - The seed script uses `firebase-admin`, which derives the namespace from its `databaseURL`, so it needs no parameter (#501).
2. **Tokens and rules: confirmed.** The Auth emulator's ID tokens (unsigned, `alg: none`) are accepted by the Database and Storage emulators.
    - Database: a user can write `travellers/<own uid>` but not another uid (`Permission denied`); an unauthenticated write is denied; `messages/<uid>` is readable by that uid and by an `admin: true` token but not by another user; an anonymous message `POST` for a traveller is allowed.
    - Storage: an own-uid upload to `images/<uid>/` returns 200; unauthenticated and other-uid uploads return 403. Admin may delete other users' files but cannot create them, as the rules say.
    - `auth.token.admin` works: set `customAttributes: {"admin":true}` through the Auth emulator's `POST /identitytoolkit.googleapis.com/v1/projects/demo-trip-fotos/accounts:update` (`Authorization: Bearer owner`) and sign in again; the claim appears in the token. #501 can use `firebase-admin`'s `setCustomUserClaims` instead.
    - Default Storage bucket for a `demo-` project: `demo-trip-fotos.appspot.com`.
3. **Browser reach: confirmed, no mixed-content blocking.** From a page served over HTTPS (self-signed, as in `docs/local-https.md`) and from plain HTTP, Electron reached the Auth (9099), Database (9000) and Storage (9199) emulators on `127.0.0.1`, including `PUT`/`POST` with `Authorization` headers (the emulators answer CORS preflights). Chromium treats `127.0.0.1` as potentially trustworthy. Cypress runs already serve the app over HTTP (`vite.config.js` skips HTTPS when `isCypress`), so only manual `/ui-check` runs meet HTTPS. Use `127.0.0.1`, not `localhost`, in the emulator URLs. Forward ports 9000, 9099, 9199 and 4000 in the devcontainer.
    - Two traps for #502: `Cypress.env()` no longer exists in Cypress 16 (use `Cypress.expose()` for values the app reads), and a JWT passed as a `CYPRESS_*` variable reached the browser corrupted, so specs should sign in through the app or the Auth emulator rather than receive a token from the environment.
4. **`firebase-tools` cost.**

    | Option                                  | Cost                                                                            |
    | --------------------------------------- | ------------------------------------------------------------------------------- |
    | Pinned devDependency                    | 445 packages, 263 MB in `node_modules`, 58 s to install; paid by every `npm ci` |
    | `npx firebase-tools@15.34.2`            | 63 s cold (432 MB npm cache), 3 s warm; paid only by jobs that call it          |
    | Emulator jars (database + storage)      | 84 MB in `~/.cache/firebase/emulators`, downloaded on first start               |
    | Emulator start-up (Auth + DB + Storage) | 35 s with jars downloading, 26 s warm                                           |

    **Recommendation for #500: a pinned `npx`** (also pin `firebase:rules`, which is unpinned today). A devDependency would add 58 s and Dependabot noise to every job, Vitest and component jobs included, for a tool only the E2E job runs. Cache `~/.npm` and `~/.cache/firebase/emulators` in the E2E job.

Not covered by the spike, for #500 to confirm: the profile-update REST call (`${API_DATABASE.URL}update?key=`) against the Auth emulator's `accounts:update`.

## Phase 1 — tooling and config (#500)

- Use a pinned `npx firebase-tools@<version>` call (the spike measured it lighter than a devDependency; see Phase 0) (it is currently only used ad hoc via `npx` in `firebase:rules`, and as a dev dependency it adds a large install to every CI job and Dependabot noise). Check #363 and #361 first: the lean-repo issues prune scripts and dependencies, so add only what the plan needs.
- Use a `demo-trip-fotos` project ID: `demo-` projects never touch real resources and need no credentials.
- `firebase.json` — add an `emulators` block: auth 9099, database 9000, storage 9199, UI 4000, `singleProjectMode: true`. Rules files stay shared, so emulator runs also exercise the real rules.
- Scripts (`package.json` was slimmed in #431; keep the same ordering and add nothing else; sync README Scripts, CLAUDE.md Dev commands and `docs/testing.md`):
    - `emulators` — `firebase emulators:start --project demo-trip-fotos`
    - `emulators:seed` — `node scripts/seed-emulators.mjs`
    - `cy:run:e2e:emulators` — `firebase emulators:exec --project demo-trip-fotos "npm run emulators:seed && <start dev server> && cypress run --e2e"` (CI starts the dev server with `cypress-io/github-action`'s `start` and `wait-on`; locally `.claude/skills/verify/run-e2e.mjs` starts it, so reuse that rather than adding `start-server-and-test`)
- `.env.emulators` (committed, no secrets, beside `.env.example` in the root; new config other than env files and `firebase.json` goes under `config/`, since #433 and #435 tidied the root) holding the emulator URLs, `VITE_FIREBASE_PROJECT_ID=demo-trip-fotos`, a dummy API key, `VITE_USE_FIREBASE_EMULATORS=true` and the seeded test-user credentials. Load it with `vite --mode emulators`.
- Java (JDK 21) is required by the database and storage emulators — only as a runtime the Firebase CLI launches; no Java code is written: add `ghcr.io/devcontainers/features/java:1` to `.devcontainer/devcontainer.json` (decided: yes) and forward ports 4000/9000/9099/9199. This needs a devcontainer rebuild.

## Phase 2 — app wiring (#500)

- `src/constants/firebase` — add `USE_EMULATORS` (from `VITE_USE_FIREBASE_EMULATORS`) and emulator host/ports.
- `src/services/firebase/firebase.js`
    - `getFirebaseAuth()` connects the Auth emulator once on first call when `USE_EMULATORS` is set (`connectAuthEmulator` must run before any auth operation — the lazy getter from `abf4b98` makes this straightforward)
    - `getFirebaseStorage()` (from `4816afd`, already initialises Auth first so uploads carry the token) does the same with `connectStorageEmulator`
- The flag must never be set in any Vercel environment, production or preview, so production builds are unchanged; add a unit test asserting the emulators are not connected when the flag is off.

## Phase 3 — deterministic seed (#501)

`scripts/seed-emulators.mjs`, using `firebase-admin` (already a dependency) with `FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_DATABASE_EMULATOR_HOST` set, so no service-account key is needed. The script refuses to run unless both host variables are set, so it can never write to the live project (`trip-fotos-react-18f70`):

- Auth users: a **standard** user (not a traveller), two or more **traveller** users, an **admin** user (custom claim `admin: true`, replacing the manual `npm run admin:claim` step for tests)
- RTDB: `travellers/` and `messages/` built from `src/constants/test/mock-data/` so Vitest, component and E2E share one data set. The data must satisfy the current `firebase/database.rules.json`: every image carries `width` and `height` (#459) and the description field is `tripDescription` (#458). `mock-travellers.js` already uses `tripDescription`; add image dimensions if its files lack them.
- Spread: one traveller with several photos and one with none, at least one message for the signed-in traveller, and cities that give all eight badge tones (#455), so the Contact button, the Contact page, the message list and the gallery are all reachable
- Clears everything first so it is safe to re-run; expose it as a `cy.task('seedEmulators')` for specs that mutate data

## Phase 4 — tests (#502 adds the emulator run; exact seeded assertions wait for #504)

- `cypress.config.js` loads the emulator env explicitly when emulator mode is on (`API_URL`, `VITE_DATABASE_URL`, the test-user credentials): it uses `dotenv.config()`, which reads only `.env`, so Vite's `--mode emulators` does not reach it.
- Point `TEST_USERS` at the seeded accounts in emulator mode; drop `CYPRESS_USER_*` from the emulator path. The specs must pass in both modes until #504.
- In #504, once the live path is gone, remove data-tolerant assertions (`TravellersList` "list or empty state", the conditional refresh-button test) in favour of exact seeded expectations; un-comment "does not show register link when logged in as a traveller" now that a traveller user exists.
- Turn happy-path stubs into real emulator round trips where it adds confidence: registration PUT, photo upload, messages load/delete. Keep `cy.intercept` stubs for error states (500/403/network, `TOO_MANY_ATTEMPTS`), which the emulator cannot produce on demand.
- Re-seed in `beforeEach` of specs that write (Register, Messages) to keep specs order-independent.
- Cover the specs added since: `cypress/e2e/app/StalePersistedStore.cy.js` (#394), which clears the database and so becomes a native emulator reset, `ContactTraveller.cy.js` with a real Contact flow, the axe checks (#358) and the Register upload progress (#442), all against the seeded backend.

## Phase 5 — CI (#503 adds the job; #504 removes the live one)

`cypress-e2e.yml`:

- `actions/setup-java@v4` (temurin 21) and cache `~/.cache/firebase/emulators`
- Non-interactive Firebase CLI settings (no usage-reporting or update prompts), or the job can hang
- Run `npm run cy:run:e2e:emulators` with `--mode emulators` (the job currently uses `cypress-io/github-action` with `start: npm run dev` and a `wait-on` on port 3000; keep that shape)
- The emulator job needs no secrets, so it runs on Dependabot PRs too. The live job, its secrets and the Dependabot skip stay until #504, which removes them so E2E runs on every PR. Do not delete the `CYPRESS_USER_*` and `VITE_FIREBASE_*` secrets: the other workflows still use the latter, and the smoke test needs both
- Vitest and component workflows keep the `VITE_FIREBASE_*` env from `abf4b98` for now; they no longer strictly need it (lazy Auth) and can drop it in a follow-up

## Phase 6 — local workflow, smoke test and docs (#504)

- `/verify e2e` (`.claude/skills/verify/run-e2e.mjs`) runs against the emulators by default, removing the "uses live Firebase" approval caveat in `.claude/settings.json` and `docs/ai-assistance.md`; keep a `live` option for the smoke test.
- **Live smoke test:** one read-only spec (sign in, one read) that runs on pushes to `main` only, with the secrets.
- Keep the 1-day lifecycle rule on the test user's `images/<uid>/` prefix while the live account exists.
- The UI check (CLAUDE.md and `.github/instructions/testing.instructions.md`): point its logged-in screenshots at the emulators with the seeded accounts, so the pages and states (Contact, messages, a non-traveller) are repeatable.
- Update README (Scripts, Environment Variables, CI/CD Workflows, Folder Structure for `scripts/`), CLAUDE.md (dev commands, Environment), `.github/instructions/testing.instructions.md` (seeding and anti-flakiness rules), and the verify skill's SKILL.md.

## Risks

- RTDB REST namespace addressing — resolved by the spike: one query parameter in `databaseRequest()`; without it requests silently bypass the rules
- Emulator start-up adds ~20–40 s to the E2E job; mitigated by caching the emulator JARs
- Emulator and `firebase-tools` versions drift from production Firebase: pin the version and bump it on purpose
- E2E on every PR adds Actions minutes, Dependabot PRs included
- Storage rules are enforced on real uploads: compression output and file fixtures may need adjusting to pass
- Emulator token checks are looser than production (unsigned tokens), so rules are verified but token signing is not — acceptable for E2E

## Open questions

None: Java in the devcontainer and a main-only live smoke test are decided above.
