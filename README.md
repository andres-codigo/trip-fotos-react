# trip-fotos-react

[![Component - Run Cypress Component Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-component.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-component.yml)
[![E2E - Run Cypress Page Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-e2e.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-e2e.yml)
[![Vitest - Run Unit Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/vitest-unit-tests.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/vitest-unit-tests.yml)

## Contents

- [📘 About This Project](#about-this-project)
- [✨ Features](#features)
- [🚧 Status](#status)
- [🧱 Stack](#stack)
- [⚡ Quick Start](#quick-start)
- [🎯 Scripts](#scripts)
- [⚙️ Setup](#setup)
- [🤖 AI Assistance](#ai-assistance)
- [🧪 Testing and CI](#testing-and-ci)
- [📦 Build and Deployment](#build-and-deployment)
- [📁 Folder Structure](#folder-structure)
- [🧯 Troubleshooting](#troubleshooting)

<a id="about-this-project"></a>

## 📘 About This Project

This project is a UI and functional conversion from Vue to React and extends the original Udemy Vue - The Complete Guide (incl. Router & Composition API) course > 'Find a coach' project. It has been reimagined as "finding popular travel destinations" tied to a registered traveller.

**Live:** [trip-fotos-project-react.vercel.app](https://trip-fotos-project-react.vercel.app)

It is also a working example of AI-assisted development: GitHub Copilot and Claude Code share one set of repository instructions, and hooks, a `/verify` skill and CI enforce the quality gates. The Vue port was largely delivered by an agent pipeline under human review — see [AI-Assisted Development Story](docs/ai-assisted-dev-story/README.md).

<a id="features"></a>

## ✨ Features

- **Authentication** — email/password sign-up and log-in with Firebase Authentication, session persistence and auto-logout
- **Traveller registration** — form with validation that saves a traveller profile to the Realtime Database; cities visited are chosen through an accessible type-ahead city search ([Photon](https://photon.komoot.io), OpenStreetMap data) that stores each city with its country
- **Photo uploads** — drag-and-drop or file-picker uploader with previews and type/size validation on the registration form; photos are compressed and uploaded to Cloud Storage as the signed-in user; a progress bar shows how many photos have uploaded while registering
- **Traveller cards** — the travellers list shows each traveller's name, registration date, trip description, days in city, city badges and up to five photos, with contact and details links and an admin-only delete button
- **Traveller details** — `/travellers/:id` shows a traveller's full profile, cities and every photo (each opens in a dialog that fits the screen, with next/previous buttons and a shareable `?photo=N` link), with a contact link for other travellers; unknown ids show a not-found message
- **Messaging** — `/travellers/:id/contact` (signed-in users only) sends a traveller a message from the user's email address, with email and message validation, a success alert on the travellers list and an error dialog if sending fails; travellers read and delete the messages they have received on the messages page
- **City filter** — checkboxes above the travellers list, built from the cities the loaded travellers have visited, narrow the list by city; all cities start selected
- **Admin tools** — the admin role is a Firebase custom claim (`admin: true`) enforced by the database and Storage rules; the admin can remove a traveller, with their database record, photos and messages, from the travellers list
- **Routing and pages** — home, authentication, travellers, traveller details, contact traveller, register, messages, privacy policy and 404 pages
- **Privacy policy** — a public `/privacy` page, linked from the footer, explains what data the app collects (account, traveller registration, Photon city search, browser storage and cookieless Vercel analytics) and where it is stored
- **Accessibility** — skip link, landmark structure and per-page titles, following an audit against [The Website Specification](https://specification.website)
- **Testing and CI** — Vitest unit and integration tests, plus Cypress component and E2E tests, run in GitHub Actions on every pull request; CodeQL scanning and a ruleset protecting `main`
- **Deployment and security** — Vercel deployment with a route allow-list, real 404s, an enforced Content Security Policy and other security headers; versioned Firebase security rules
- **Project automation** — issues and pull requests are labelled from one `labels.json` and moved across the GitHub Project board by workflows
- **AI-assisted workflow** — shared Copilot and Claude Code instructions, scaffolding agents, a lint-on-edit hook, an issue-before-edit hook, and `/verify`, `/start-issue`, `/finish-pr` and `/ui-check` skills (see [AI Assistance](#ai-assistance))

<a id="status"></a>

## 🚧 Status

Feature parity with the original Vue app is complete (epic [#274](https://github.com/andres-codigo/trip-fotos-react/issues/274)), and the app is live. Current work is polish, consistency and tooling rather than new features.

**Recently shipped**

- Gallery thumbnails reserve their space before the image loads: each photo's dimensions are stored at upload (`fileDimensions`) so the page no longer jumps; photos registered earlier shift once ([#452](https://github.com/andres-codigo/trip-fotos-react/issues/452))
- The photo dialog fits the screen at any width, adds next/previous buttons and arrow-key navigation, and reflects the open photo in the URL as `?photo=N` ([#445](https://github.com/andres-codigo/trip-fotos-react/issues/445))
- The Register dialog shows image upload progress (a progress bar with a photo count) instead of only a spinner ([#438](https://github.com/andres-codigo/trip-fotos-react/issues/438))
- City badges get a distinct colour per city instead of all rendering grey ([#441](https://github.com/andres-codigo/trip-fotos-react/issues/441))
- Consistency refactors: one Realtime Database request helper, one user-facing error path, one hook layout and one form-error and loading pattern ([#396](https://github.com/andres-codigo/trip-fotos-react/issues/396)–[#401](https://github.com/andres-codigo/trip-fotos-react/issues/401))
- Leaner repo: unused scripts, dependencies and a duplicate CI test run removed, `vitest:run:fast` folded into `vitest:run`, a shared `format` script, a faster dev server (no ESLint on transform, no forced dependency re-optimisation) and a single-file ESLint config on native flat config, and the Firebase rules, lint configs and release-please config moved into `firebase/` and `config/` ([#430](https://github.com/andres-codigo/trip-fotos-react/issues/430), [#432](https://github.com/andres-codigo/trip-fotos-react/issues/432), [#434](https://github.com/andres-codigo/trip-fotos-react/issues/434), [#361](https://github.com/andres-codigo/trip-fotos-react/issues/361), [#363](https://github.com/andres-codigo/trip-fotos-react/issues/363), [#364](https://github.com/andres-codigo/trip-fotos-react/issues/364), [#365](https://github.com/andres-codigo/trip-fotos-react/issues/365))
- Process: `/start-issue`, `/finish-pr` and `/ui-check` skills and a hook that blocks edits on `main`, a branch without a type prefix or a branch with no open PR, a stop check that a ready PR has refreshed the README Status, and a weekly cloud sweep for stale release PRs and docs drift, so work cannot start without an issue, plus documented steps for finishing an issue and closing an epic, and CI drift checks that fail when a route lacks a Vercel rewrite, a store collection lacks a database rule, or the README scripts and env tables drift ([#460](https://github.com/andres-codigo/trip-fotos-react/issues/460), [#473](https://github.com/andres-codigo/trip-fotos-react/issues/473), [#475](https://github.com/andres-codigo/trip-fotos-react/issues/475), [#477](https://github.com/andres-codigo/trip-fotos-react/issues/477), [#480](https://github.com/andres-codigo/trip-fotos-react/issues/480), [#481](https://github.com/andres-codigo/trip-fotos-react/issues/481), [#482](https://github.com/andres-codigo/trip-fotos-react/issues/482), [#484](https://github.com/andres-codigo/trip-fotos-react/issues/484), [#485](https://github.com/andres-codigo/trip-fotos-react/issues/485), [#486](https://github.com/andres-codigo/trip-fotos-react/issues/486), [#487](https://github.com/andres-codigo/trip-fotos-react/issues/487), [#488](https://github.com/andres-codigo/trip-fotos-react/issues/488))
- Fixes: the Messages nav count, the Register file input, stale traveller data after a cleared database, and the traveller Auth display name

**Next up** — in this order:

- [#292](https://github.com/andres-codigo/trip-fotos-react/issues/292) — Epic: run E2E against the Firebase Emulator Suite instead of the live project (optional; six children, [#499](https://github.com/andres-codigo/trip-fotos-react/issues/499) to [#504](https://github.com/andres-codigo/trip-fotos-react/issues/504); the #499 spike says go and #500 added the local emulators and the app flag; #501 added the seed script; #502 added the emulator E2E run)
- [#379](https://github.com/andres-codigo/trip-fotos-react/issues/379) — Epic: Tailwind v4 + shadcn/ui design system migration (after #292)
- [#383](https://github.com/andres-codigo/trip-fotos-react/issues/383) — dark-only Claude-inspired redesign, with a multi-column Travellers grid (last step of #379)
- [#321](https://github.com/andres-codigo/trip-fotos-react/issues/321) — ESLint 10, blocked on `eslint-plugin-react` support

<a id="stack"></a>

## 🧱 Stack

This project uses the following technologies:

- [Vite](https://vite.dev/) for development and build.
- [React](https://react.dev/) as the front-end library.
- [React Router](https://reactrouter.com/) for routing.
- [Redux Toolkit](https://redux-toolkit.js.org/) for state management, with [Redux Persist](https://github.com/rt2zz/redux-persist) for session persistence.
- [SASS](https://sass-lang.com/) for CSS preprocessing.
- [ESLint](https://eslint.org/) for JavaScript linting.
- [Stylelint](https://stylelint.io/) to keep component and page styles scoped (no bare element selectors in CSS modules).
- [Prettier](https://prettier.io/) for code formatting.
- [Vitest](https://vitest.dev/) for unit and integration testing.
- [Cypress](https://www.cypress.io/) for end-to-end and component testing.
- [Firebase Realtime Database](https://firebase.google.com/docs/database) for storing travellers and messages.
- [Firebase Authentication](https://firebase.google.com/docs/auth) for managing sign-in credentials.
- [Firebase Cloud Storage](https://firebase.google.com/docs/storage) for storing uploaded traveller images.
- [Photon](https://photon.komoot.io) (OpenStreetMap data) for the city search.
- [Vercel](https://vercel.com/) for hosting, with cookieless Web Analytics and Speed Insights.

<a id="quick-start"></a>

## ⚡ Quick Start

Requires [Node.js](https://nodejs.org/) 24 or later (see `.nvmrc`) and npm.

```bash
git clone https://github.com/andres-codigo/trip-fotos-react
cd trip-fotos-react
npm install       # also installs Cypress and Vitest
npm run dev       # http://localhost:3000
```

The app needs a Firebase project and a `.env` file first — see [Setup](#setup).

A [VS Code Dev Container](.devcontainer/devcontainer.json) is included. It bind-mounts `~/.gitconfig`, `~/.config/gh` and `~/.claude` from the host, so set those up first; if they are missing, Docker creates empty placeholders and the matching tool is unauthenticated inside the container. Claude Code keeps its config in `~/.claude/.claude.json` (via `CLAUDE_CONFIG_DIR`) rather than a bind-mounted `~/.claude.json`, because a single-file mount breaks when Claude Code replaces the file on save.

<a id="scripts"></a>

## 🎯 Scripts

Below are the available npm scripts for this project:

```bash
# Start the development server
npm run dev

# Build the project for production
npm run build

# Preview the production build locally
npm run build:preview

# Visual Vite bundle analysis
npm run analyse

# Run ESLint and Stylelint to check for issues
npm run lint

# Run Stylelint only (component and page stylesheets)
npm run lint:styles

# Format files with Prettier
npm run format

# Automatically fix linting issues and format files
npm run lint:fix

# Run all tests once with the dot reporter (no coverage)
npm run vitest:run

# Run Vitest in watch mode
npm run vitest:watch

# Run tests with coverage reporting enabled
npm run vitest:coverage

# Open the Cypress E2E Test Runner in interactive mode
npm run cy:open:e2e

# Open the Cypress Component Test Runner in interactive mode
npm run cy:open:ct

# Run Cypress E2E tests in headless mode
npm run cy:run:e2e

# Run the same E2E specs against the local Firebase emulators (no live project or secrets)
npm run cy:run:e2e:emulators

# Run Cypress Component tests in headless mode
npm run cy:run:ct

# Smart test runner - automatically detects component vs E2E tests
npm run cy:run:auto [file-path]

# Deploy Realtime Database and Storage security rules
npm run firebase:rules

# Start the Firebase emulators (Auth, Realtime Database, Storage) with the real rules
npm run emulators

# Reset the running emulators to the deterministic seed data (refuses to run without the emulator host variables)
npm run emulators:seed

# Grant or remove the admin custom claim (see Setup > Admin Role)
npm run admin:claim -- <email> [--remove]
```

<a id="setup"></a>

## ⚙️ Setup

### Firebase Configuration

#### Prerequisites

- A [Google Account](https://accounts.google.com/) is required.
- A [Blaze Plan](https://firebase.google.com/pricing?hl=en) is necessary for database and storage capabilities.

#### Steps

1. **Create a Firebase Project**
   Sign in to your [Firebase Console](https://console.firebase.google.com) and create a new project.

2. **Enable Required Firebase Products**
   Navigate to the "Build" dropdown menu in your Firebase project and enable the following:
    - **Realtime Database**
        - Set the location to **United States (us-central1, us-east1, or us-west1)**.
        - Copy the database URL and add it to your `.env` file under `VITE_BACKEND_BASE_URL`.
        - Rules live in [`database.rules.json`](firebase/database.rules.json) and are deployed with `npm run firebase:rules` (see [Firebase Security Rules](#firebase-security-rules)).
          Travellers can only change their own record, and only the recipient (or an admin) can read or delete messages; anyone can send a new message, but not edit an existing one.

    - **Authentication**
        - Go to "Sign-in Method" and enable **Email/Password**. Ensure **Email link (passwordless sign-in)** is NOT enabled.

    - **Cloud Storage**
        - Set up a [Blaze Plan](https://firebase.google.com/pricing?hl=en) to enable storage capabilities.
        - Rules live in [`firebase/storage.rules`](firebase/storage.rules): signed-in users write only to their own `images/{uid}/` folder (the app signs in through the Firebase Auth SDK, so uploads carry the user's ID token), and an admin (see [Admin Role](#admin-role)) can delete other travellers' photos.

3. **Add Firebase to Your Web App**
    - Register your app in the Firebase Console.
    - Copy the Firebase configuration values and add them to your `.env` file.

<a id="firebase-security-rules"></a>

#### Firebase Security Rules

`firebase.json` points the Firebase CLI at `firebase/database.rules.json` and `firebase/storage.rules`, so the rules are versioned with the code. Edit them there, never in the Console, then deploy to the project in `.firebaserc`:

```bash
npx firebase-tools login      # once
npm run firebase:rules        # firebase-tools deploy --only database,storage
```

Use the Console's Rules Playground to try a rule before deploying it.

<a id="firebase-emulators"></a>

#### Firebase Emulators

The Auth, Realtime Database and Storage emulators run locally against the same rules files, with no credentials (the `demo-trip-fotos` project never touches real resources). They need Java 21, which the dev container installs (rebuild it after pulling).

```bash
npm run emulators                 # Auth 9099, Database 9000, Storage 9199, UI http://127.0.0.1:4000
npm run dev -- --mode emulators   # in a second terminal: the app against them
```

`--mode emulators` loads [`.env.emulators`](.env.emulators), which sets `VITE_USE_FIREBASE_EMULATORS` (the dev server only; a production build ignores it) and `VITE_DATABASE_NAMESPACE`. The namespace is added to every Realtime Database request as `?ns=`, because the emulator serves a request without one from a namespace that has no rules. **Never set either variable in Vercel.**

`npm run emulators:seed` clears the emulators and loads a fixed data set: a standard user (not a traveller), two travellers (one with four photos and all eight badge tones, one with none), an admin (`admin: true` claim) and two messages for the first traveller. Run it through `firebase emulators:exec` so the host variables are set; it refuses to run without them, so it can never write to the live project. The accounts are listed in [`scripts/seed-emulators.mjs`](scripts/seed-emulators.mjs), and `cy.task('seedEmulators')` re-seeds from a spec.

<a id="admin-role"></a>

#### Admin Role

The admin role is a Firebase Auth custom claim (`admin: true`), so the database and Storage rules enforce it and no admin ID is bundled into the client.

1. In the Firebase Console, go to Project settings > Service accounts and generate a new private key. Save it **outside the repo** — `.gitignore` also ignores common key file names as a safety net.
2. Grant (or remove) the claim:

    ```bash
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run admin:claim -- admin@example.com
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run admin:claim -- admin@example.com --remove
    ```

3. The user must sign out and in again: claims are read from the ID token at sign-in, and stored as `isAdmin` in the authentication slice (`selectIsAdmin`).

### Environment Variables

Copy [`.env.example`](.env.example) to `.env` and fill in the values from your Firebase web app's `firebaseConfig`:

```bash
cp .env.example .env
```

| Variable                                      | Used for                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `VITE_FIREBASE_*`, `VITE_DATABASE_URL`        | Firebase SDK (Auth, Realtime Database, Storage)                          |
| `VITE_BACKEND_BASE_URL`                       | Realtime Database REST calls                                             |
| `VITE_API_URL`, `VITE_API_KEY`                | Firebase Auth REST API — profile updates, and the E2E sign-in intercepts |
| `VITE_ROOT_URL`                               | Cypress `baseUrl`                                                        |
| `CYPRESS_USER_EMAIL`, `CYPRESS_USER_PASSWORD` | An existing test account the E2E suite signs in with                     |
| `VITE_OPEN` (optional)                        | `true` opens the browser when the dev server starts                      |

[`.env.emulators`](.env.emulators) is committed (no secrets) and holds the emulator values; see [Firebase Emulators](#firebase-emulators).

`.env` is gitignored — never commit it. When you add, rename or remove a variable, update `.env.example` and this table together.

### Firebase Project Configuration File

Create a `.firebaserc` file in the root directory with the following content:

```json
{
	"projects": {
		"default": "your-project-name"
	}
}
```

### HTTPS for Local Development

Optional: with a self-signed certificate in `certs/`, `npm run dev` serves over HTTPS; without one it falls back to HTTP, as in CI and on Vercel. See [docs/local-https.md](docs/local-https.md).

<a id="ai-assistance"></a>

## 🤖 AI Assistance

GitHub Copilot and Claude Code share one set of guidance, so the two tools do not drift apart:

- **Shared conventions** — `.github/copilot-instructions.md` and `CLAUDE.md` hold the workspace rules; `.github/instructions/*.instructions.md` hold the component, page, store, styling and testing guidance both tools read.
- **Scaffolding agents** — `create-component`, `create-page`, `create-redux-slice` and `create-hook` live in `.github/agents/`, with thin Claude Code wrappers in `.claude/agents/`.
- **Enforced quality** — a Claude Code `PostToolUse` hook formats and lints every edited file, and the `/verify` skill runs only the lint, Vitest, Cypress component and build gates a change can affect, caching passes per working-tree hash. `/verify e2e` adds the live-Firebase E2E suite.
- **Permissions** — `.claude/settings.json` allows routine checks, commits, pushes and draft PRs, asks before merges, installs and E2E runs, and denies force-pushes and reading `.env` or `certs/`.

Full detail is in [docs/ai-assistance.md](docs/ai-assistance.md). How the tools are used day to day, and the agent pipeline that delivered the Vue port, are written up in the [AI-Assisted Development Story](docs/ai-assisted-dev-story/README.md).

<a id="testing-and-ci"></a>

## 🧪 Testing and CI

- **Vitest** unit and integration tests sit beside the code they test, in `__tests__/` folders or as `*.test.js` next to store files.
- **Cypress** component tests (`*.cy.jsx`) sit in the same `__tests__/` folders; E2E specs live in `cypress/e2e/` and run against the live Firebase project.
- **GitHub Actions** run Vitest, Cypress component and Cypress E2E tests on pull requests that touch code, label issues and PRs from [`.github/labels.json`](.github/labels.json) and move them across the project board. CodeQL scans every PR, and the **Protect main** ruleset requires a pull request to change `main`.

| Workflow                          | File                                           | Triggered On     |
| --------------------------------- | ---------------------------------------------- | ---------------- |
| Vitest - Run Unit Tests           | `.github/workflows/vitest-unit-tests.yml`      | Push/PR/Manual   |
| Cypress - Run E2E Page Tests      | `.github/workflows/cypress-e2e.yml`            | Push/PR/Manual   |
| Cypress - Run Component Tests     | `.github/workflows/cypress-component.yml`      | Push/PR/Manual   |
| GitHub - Auto Label Pull Requests | `.github/workflows/github-auto-label-prs.yml`  | PR Target Events |
| GitHub - Issue Intake             | `.github/workflows/github-issue-intake.yml`    | Issue Events     |
| GitHub - Project Item Lifecycle   | `.github/workflows/project-item-lifecycle.yml` | PR Target Events |
| GitHub - Label Sync               | `.github/workflows/github-label-sync.yml`      | Push/Manual      |
| Release - Release Please          | `.github/workflows/release-please.yml`         | Push             |

The workflows read the Firebase config from the `VITE_FIREBASE_*` and `VITE_DATABASE_URL` repository secrets; E2E also needs `VITE_API_URL`, `VITE_API_KEY`, `VITE_BACKEND_BASE_URL` and `CYPRESS_USER_*`.

Details: [docs/testing.md](docs/testing.md) (test layout and utilities) and [docs/ci-cd.md](docs/ci-cd.md) (each workflow's triggers, project board statuses, labels, branch protection and token rotation).

<a id="build-and-deployment"></a>

## 📦 Build and Deployment

`npm run build` writes the production build to `dist/`; `npm run build:preview` serves it, and `npm run analyse` opens a bundle-size report at `https://localhost:3001/stats.html`.

The app deploys to [Vercel](https://vercel.com/) from the GitHub repository, with the environment variables set in the Vercel dashboard. Deploy rule changes with `npm run firebase:rules` before the production deploy.

### Routing, Headers and Static Files

`vercel.json` controls how the production deployment responds:

- **Route allow-list** — only the app's known routes (`/authentication`, `/travellers`, `/travellers/:id`, `/travellers/:id/contact`, `/register`, `/messages`, `/privacy`, `/404`) are rewritten to the single-page app. Any other path falls through to `public/404.html` with a real `404` status, so crawlers do not see soft 404s. **When you add a route to `PATHS`, add it to the `rewrites` source in `vercel.json` too**, or it will 404 on a hard refresh in production.
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` are set on every response. An enforced `Content-Security-Policy` limits scripts to the site itself and network requests to Firebase and the Photon city search. If you add a new third-party service (a CDN, an analytics provider or another Firebase product), add its origin to the matching directive in `vercel.json`, or the browser will block it. To trial a change safely, rename the header to `Content-Security-Policy-Report-Only` on a preview: violations are then logged to the console without blocking.
- **Caching** — fingerprinted build output in `/assets/` is cached for a year as `immutable`; fonts are cached for a week.

`public/` also holds `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest` and `.well-known/security.txt`. These contain the production URL, so update them if the domain changes. `security.txt` has an `Expires` date that must be renewed before it passes.

<a id="folder-structure"></a>

## 📁 Folder Structure

```
trip-fotos-react/
├── .devcontainer/               # VS Code Dev Container configuration
├── .claude/
│   ├── agents/                 # Claude Code subagent wrappers (delegate to .github/agents)
│   ├── hooks/                  # Claude Code hook scripts (lint/format after edits, issue-before-edit guard, Status-refresh stop check)
│   ├── plans/                  # Committed work plans (e.g. deferred Firebase emulator plan)
│   ├── rules/                  # Path-scoped Claude Code rules (comment style)
│   ├── skills/                 # Claude Code skills (/verify, /start-issue, /finish-pr, /ui-check)
│   ├── settings.json           # Shared Claude Code permissions and hooks
│   └── settings.local.json     # Personal Claude Code overrides (gitignored)
├── .github/
│   ├── agents/                 # Scaffolding workflows (shared by Copilot and Claude Code)
│   ├── instructions/           # Domain-specific guidance (shared by Copilot and Claude Code)
│   ├── rulesets/               # Repository rulesets as JSON (applied via gh api)
│   ├── scripts/                # Shared workflow logic (labels.mjs) with its Vitest tests
│   ├── workflows/              # GitHub Actions workflow files for CI/CD automation
│   ├── copilot-instructions.md # Workspace-level Copilot guidelines
│   └── labels.json             # Single source of truth for every label
├── .vscode/                     # Shared VS Code editor settings
├── config/                     # ESLint, Stylelint and release-please configuration
├── cypress/                    # Cypress tests
├── docs/                       # Detailed guides: CI/CD, testing, AI assistance, local HTTPS, and the AI-assisted development story
├── firebase/                   # Realtime Database and Cloud Storage security rules
├── public/                     # Static assets, app icons, social image, 404 page, robots.txt, sitemap, manifest and .well-known files
├── scripts/                    # Repo maintenance scripts (set-admin-claim.mjs, seed-emulators.mjs with its test, dependency-check output)
├── src/
│   ├── app/            # Main application component
│   ├── assets/         # Fonts, SVGs, and other static assets
│   ├── components/     # Reusable React components
│   ├── constants/      # Global, Firebase, API, paths, and other constants
│   ├── pages/          # Page components for routing
│   ├── services/       # External service configurations (Firebase, APIs, etc.)
│   ├── store/          # Redux store and slices
│   ├── styles/         # SCSS stylesheets
│   ├── testUtils/      # Testing environment configuration and Cypress and Vitest utility functions
│   ├── utils/          # General utility functions
│   └── index.jsx       # Root application entry point
├── .dockerignore                # Files excluded from the dev container build context
├── .env                         # Environment variables (gitignored; copy from .env.example)
├── .env.emulators               # Environment variables for the local Firebase emulators (no secrets)
├── .env.example                 # Template listing every environment variable
├── .firebaserc                  # Firebase project configuration
├── .gitignore                   # Git ignore rules
├── .npmrc                       # Configuration file for custom npm settings and registry options
├── .nvmrc                       # Specifies the Node.js version for Node Version Manager (nvm)
├── .prettierignore              # Prettier ignore rules
├── .prettierrc.json             # Prettier configuration
├── CHANGELOG.md                 # Release notes, created by the first release-please release
├── CLAUDE.md                    # Workspace-level Claude Code guidelines
├── cypress.config.js            # Cypress testing configuration
├── firebase.json                # Firebase CLI config (the rules in `firebase/` and the emulator ports)
├── index.html                   # Vite HTML entry point
├── jsconfig.json                # JavaScript project configuration for editor support (paths, aliases, IntelliSense)
├── package.json                 # Project dependencies and scripts
├── README.md                    # Project documentation
├── vercel.json                  # Vercel deployment configuration
└── vite.config.js               # Vite build tool configuration
```

> **Note:** `jsconfig.json` provides editor IntelliSense/module resolution support; the `@/` path alias itself is configured in `vite.config.js`.

<a id="troubleshooting"></a>

## 🧯 Troubleshooting

- **Issue**: `npm install` fails.
    - **Solution**: Ensure you have Node.js and npm installed. Check the required versions in the [Node.js](https://nodejs.org/) documentation.

- **Issue**: Firebase environment variables are not working.
    - **Solution**: Copy `.env.example` to `.env` in the project root and fill in the Firebase configuration values, then restart `npm run dev` (Vite reads `.env` only at start-up).

- **Issue**: `Error: ENOENT: no such file or directory, open './certs/localhost.key'`
    - **Solution**: Make sure you have generated the SSL certificate and key as described in [docs/local-https.md](docs/local-https.md). In CI and production (e.g., Vercel), the build will fall back to HTTP if the certs are missing.

- **Issue**: Browser shows "Your connection is not private" on `https://localhost:3000`
    - **Solution**: This is normal for self-signed certificates. Click "Advanced" and "Proceed" to continue.
