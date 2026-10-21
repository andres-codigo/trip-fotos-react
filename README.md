# trip-fotos-react

[![Component - Run Cypress Component Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-component.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-component.yml)
[![E2E - Run Cypress Page Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-e2e.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-e2e.yml)
[![Vitest - Run Unit Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/vitest-unit-tests.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/vitest-unit-tests.yml)

## Contents

- [📘 About This Project](#about-this-project)
- [🚧 Status](#status)
- [🧱 Stack](#stack)
- [⚡ Quick Start](#quick-start)
- [💾 Installation](#installation)
- [🎯 Scripts](#scripts)
- [⚙️ Setup](#setup)
- [👨‍💻 Development](#development)
- [🧪 Testing](#testing)
- [🚀 CI/CD Workflows](#cicd-workflows)
- [🛠️ Build](#build)
- [📦 Deployment](#deployment)
- [✨ Features](#features)
- [📁 Folder Structure](#folder-structure)
- [🧯 Troubleshooting](#troubleshooting)

<a id="about-this-project"></a>

## 📘 About This Project

This project is a UI and functional conversion from Vue to React and extends the original Udemy Vue - The Complete Guide (incl. Router & Composition API) course > 'Find a coach' project. It has been reimagined as "finding popular travel destinations" tied to a registered traveller.

<a id="status"></a>

## 🚧 Status

Feature parity with the original Vue app is complete: every user-facing feature has been ported on top of the engineering foundation.

### Done

- **Authentication** — email/password sign-up and log-in with Firebase Authentication, session persistence and auto-logout
- **Traveller registration** — form with validation that saves a traveller profile to the Realtime Database; cities visited are chosen through an accessible type-ahead city search ([Photon](https://photon.komoot.io), OpenStreetMap data) that stores each city with its country
- **Photo uploads** — drag-and-drop or file-picker uploader with previews and type/size validation on the registration form; photos are compressed and uploaded to Cloud Storage as the signed-in user
- **Traveller cards** — the travellers list shows each traveller's name, registration date, description, days in city, city badges and up to five photos, with contact and details links and an admin-only delete button
- **Traveller details** — `/travellers/:id` shows a traveller's full profile, cities and every photo, with a contact link for other travellers; unknown ids show a not-found message
- **Contact a traveller** — `/travellers/:id/contact` (signed-in users only) sends a traveller a message from the user's email address, with email and message validation, a success alert on the travellers list and an error dialog if sending fails
- **City filter** — checkboxes above the travellers list, built from the cities the loaded travellers have visited, narrow the list by city; all cities start selected
- **Messaging** — travellers can be sent messages, and read and delete the messages they have received on the messages page
- **Admin tools** — the admin role is a Firebase custom claim (`admin: true`) enforced by the database and Storage rules; the admin can remove a traveller, with their database record, photos and messages, from the travellers list
- **Routing and pages** — home, authentication, travellers, traveller details, contact traveller, register, messages, privacy policy and 404 pages
- **Accessibility** — skip link, landmark structure and per-page titles, following an audit against [The Website Specification](https://specification.website)
- **Testing and CI** — Vitest unit and integration tests, plus Cypress component and E2E tests, run in GitHub Actions on every pull request
- **Deployment and security** — Vercel deployment with a route allow-list, real 404s, an enforced Content Security Policy and other security headers
- **AI-assisted workflow** — shared Copilot and Claude Code instructions, scaffolding agents, a lint-on-edit hook and a `/verify` skill

<a id="stack"></a>

## 🧱 Stack

This project uses the following technologies:

- [Vite](https://vite.dev/) for development and build.
- [React](https://react.dev/) as the front-end library.
- [React Router](https://reactrouter.com/) for routing.
- [Redux](https://redux.js.org/) for state management.
- [SASS](https://sass-lang.com/) for CSS preprocessing.
- [ESLint](https://eslint.org/) for JavaScript linting.
- [Prettier](https://prettier.io/) for code formatting.
- [Vitest](https://vitest.dev/) for unit and integration testing.
- [Cypress](https://www.cypress.io/) for end-to-end and component testing.
- [Firebase Realtime Database](https://firebase.google.com/docs/database) for storing travellers and messages.
- [Firebase Authentication](https://firebase.google.com/docs/auth) for managing sign-in credentials.
- [Firebase Cloud Storage](https://firebase.google.com/docs/storage) for storing uploaded traveller images.

<a id="quick-start"></a>

## ⚡ Quick Start

1. Clone the repository:

    ```bash
    git clone https://github.com/andres-codigo/trip-fotos-react
    cd trip-fotos-react
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open the app in your browser at http://localhost:3000

<a id="installation"></a>

## 💾 Installation

See [Quick Start](#quick-start) to clone the repo and install dependencies (this also installs Cypress and Vitest).

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Dev Container Prerequisites (Optional)

This project includes a [VS Code Dev Container](.devcontainer/devcontainer.json) for a reproducible, containerised development environment. It bind-mounts the following files/folders from your **host machine** into the container, so make sure they exist and are configured on your host before opening the project in the container. If they're missing, Docker silently creates empty placeholders instead of erroring, and the corresponding tool will simply be unauthenticated inside the container:

- `~/.gitconfig` — Git identity (set via `git config --global user.name`/`user.email`)
- `~/.config/gh` — GitHub CLI authentication (set via `gh auth login`)
- `~/.claude` and `~/.claude.json` — Claude Code configuration/authentication

<a id="scripts"></a>

## 🎯 Scripts

Below are the available npm scripts for this project:

```bash
# Start the development server with linting
npm run dev

# Run ESLint to check for issues
npm run lint

# Automatically fix linting issues and format files
npm run lint:fix

# Format files using Prettier
npm run format

# NPM package dependency check
npm run check:dependencies

# Deploy Realtime Database and Storage security rules
npm run firebase:rules

# Grant or remove the admin custom claim (see Setup > Admin Role)
npm run admin:claim -- <email> [--remove]

# Open the Cypress E2E Test Runner in interactive mode
npm run cy:open:e2e

# Open the Cypress Component Test Runner in interactive mode
npm run cy:open:ct

# Run Cypress E2E tests in headless mode
npm run cy:run:e2e

# Run Cypress Component tests in headless mode
npm run cy:run:ct

# Run a specific test file (E2E or component based on path)
npm run cy:run:one

# Smart test runner - automatically detects component vs E2E tests
npm run cy:run:auto [file-path]

# File watcher - automatically runs tests when files change
npm run cy:watch

# Run all tests in CI mode (single run)
npm run vitest:run

# Run tests quickly without coverage using dot reporter
npm run vitest:run:fast

# Run tests with coverage reporting enabled
npm run vitest:coverage

# Visual Vite bundle analysis
npm run analyse

# Build the project for production
npm run build

# Preview the production build locally
npm run preview
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
        - Rules live in [`database.rules.json`](database.rules.json) and are deployed with `npm run firebase:rules` (see [Firebase Security Rules](#firebase-security-rules)).
          Travellers can only change their own record, and only the recipient (or an admin) can read or delete messages; anyone can send a new message, but not edit an existing one.

    - **Authentication**
        - Go to "Sign-in Method" and enable **Email/Password**. Ensure **Email link (passwordless sign-in)** is NOT enabled.

    - **Cloud Storage**
        - Set up a [Blaze Plan](https://firebase.google.com/pricing?hl=en) to enable storage capabilities.
        - Rules live in [`storage.rules`](storage.rules): signed-in users write only to their own `images/{uid}/` folder (the app signs in through the Firebase Auth SDK, so uploads carry the user's ID token), and an admin (see [Admin Role](#admin-role)) can delete other travellers' photos.

3. **Add Firebase to Your Web App**
    - Register your app in the Firebase Console.
    - Copy the Firebase configuration values and add them to your `.env` file.

<a id="firebase-security-rules"></a>

#### Firebase Security Rules

`firebase.json` points the Firebase CLI at `database.rules.json` and `storage.rules`, so the rules are versioned with the code. Edit them there, never in the Console, then deploy to the project in `.firebaserc`:

```bash
npx firebase-tools login      # once
npm run firebase:rules        # firebase-tools deploy --only database,storage
```

Use the Console's Rules Playground to try a rule before deploying it.

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

### HTTPS for Local Development

This project supports running the local development server over **HTTPS** for a more production-like environment.

#### 1. Generate Self-Signed Certificates

You need a self-signed SSL certificate and key for local HTTPS.
Run the following command in your project root to generate them:

```sh
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

#### 2. Move Certificates to the `certs` Folder

Create a `certs` directory in your project root and move the generated files:

```sh
mkdir -p certs
mv localhost.crt certs/
mv localhost.key certs/
```

Your project structure should now include:

```
trip-fotos-react/
  certs/
    localhost.crt
    localhost.key
  ...
```

#### 3. Update `.gitignore`

Add the `certs/` folder to your `.gitignore` to prevent committing sensitive certificate files:

```
certs/
```

#### 4. Vite HTTPS Configuration

The Vite config is set up to use these certificates for HTTPS **only in local development**.
If the `certs` folder or files are missing, Vite will fall back to HTTP (as in CI or Vercel deployments).

#### 5. Start the Development Server

```sh
npm run dev
```

Visit [https://localhost:3000](https://localhost:3000) in your browser.
You may see a browser warning about the self-signed certificate—this is expected for local development.

---

### Environment Variables

Create a `.env` file in the root directory and add the following key-value pairs:

**Note:**
Do not commit your `.env` file to version control.
Instead, create a `.env.example` file (without sensitive values) to document required environment variables for collaborators.

```bash

VITE_ROOT_URL='http://localhost:3000'

# Firebase Auth REST API
VITE_API_URL='https://identitytoolkit.googleapis.com/v1/accounts:'
VITE_API_KEY='' # firebaseConfig > apiKey

# Firebase Realtime Database
VITE_BACKEND_BASE_URL='' # firebaseConfig > databaseURL

# Firebase App Configuration
VITE_FIREBASE_API_KEY='' # firebaseConfig > apiKey
VITE_FIREBASE_AUTH_DOMAIN='' # firebaseConfig > authDomain
VITE_DATABASE_URL=$VITE_BACKEND_BASE_URL
VITE_FIREBASE_PROJECT_ID='' # firebaseConfig > projectId
VITE_FIREBASE_STORAGE_BUCKET='' # firebaseConfig > storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID='' # firebaseConfig > messagingSenderId
VITE_FIREBASE_APP_ID='' # firebaseConfig > appId

# CYPRESS TESTING
CYPRESS_USER_EMAIL=''
CYPRESS_USER_PASSWORD=''

# HTTPS CONFIGURATION
HTTPS=true
SSL_CRT_FILE=./certs/localhost.crt
SSL_KEY_FILE=./certs/localhost.key

```

### Firebase Project Configuration File

Create a `.firebaserc` file in the root directory with the following content:

```json
{
	"projects": {
		"default": "your-project-name"
	}
}
```

<a id="development"></a>

## 👨‍💻 Development

### Start the Development Server

Run the following command to start the local development server with hot module replacement:

```bash
npm run dev
```

### Linting and Formatting

Refer to the [Scripts](#scripts) section for commands to run ESLint, fix linting issues, and format files using Prettier.

### AI Assistance & Copilot Guidance

This project includes structured guidance files for GitHub Copilot to ensure generated code adheres to project standards.

#### Workspace-Level Instructions

- **File**: `.github/copilot-instructions.md`
- **Purpose**: Global rules for language, imports, naming conventions, and type safety.
- **Usage**: Copilot automatically references this file for behaviour guidance on all files.

#### Domain-Specific Instructions

Detailed guidance for specific areas of the codebase:

- **Components**: `.github/instructions/components.instructions.md` — Folder structure, reusability patterns, testing, and accessibility.
- **Pages**: `.github/instructions/pages.instructions.md` — Route-level composition, data loading orchestration, and page testing.
- **Redux Store**: `.github/instructions/store.instructions.md` — Slices, thunks, error handling, persistence, and testing.
- **Styling**: `.github/instructions/styles.instructions.md` — SCSS modules, variables, mixins, and naming conventions.
- **Testing**: `.github/instructions/testing.instructions.md` — Vitest/Cypress standards, shared test data paths, and anti-flakiness practices.

#### Workflow Agents

Automated scaffolding workflows for common tasks:

- **Create Component**: Use the `create-component` agent to scaffold new components with full structure and tests.
- **Create Page**: Use the `create-page` agent to scaffold new pages with route integration and tests.
- **Create Redux Slice**: Use the `create-redux-slice` agent to scaffold new Redux slices with RTK Query/thunks and tests.
- **Create Hook**: Use the `create-hook` agent to scaffold new custom hooks with tests, component-scoped or shared.

### AI Assistance & Claude Code Guidance

Claude Code shares the Copilot guidance above rather than keeping its own copy, so both tools follow a single source of truth. Claude-specific automation — hooks, permissions, and skills — lives in `.claude/`.

#### Workspace-Level Instructions

- **File**: `CLAUDE.md`
- **Purpose**: Global rules — branch naming, conventions, dev commands, environment, and pointers to detailed guidance (the stack, full script list and folder structure live in this README, not duplicated there, to keep the per-request context small).
- **Usage**: Claude Code automatically reads this file at the start of every session in this repo.

#### Domain-Specific Guidance

`CLAUDE.md` points Claude Code to the `.github/instructions/*.instructions.md` files listed above, which it reads on demand when working in the relevant area.

#### Workflow Agents

Scaffolding subagents in `.claude/agents/` (invoke via the Agent tool). Each is a thin wrapper that delegates to the matching `.github/agents/*.agent.md` workflow, and runs on Sonnet (`model: sonnet`) to keep mechanical scaffolding cheap:

- **create-component**: Scaffold new components with full structure and tests.
- **create-page**: Scaffold new pages with route integration and tests.
- **create-redux-slice**: Scaffold new Redux slices with RTK Query/thunks and tests.
- **create-hook**: Scaffold new custom hooks with tests.

#### Hooks & Permissions

- **File**: `.claude/settings.json` (committed; personal overrides go in the gitignored `.claude/settings.local.json`)
- **Hook**: a `PostToolUse` hook runs `.claude/hooks/lint-edited-file.mjs` after every edit, applying Prettier and `eslint --fix`. Any remaining ESLint errors are fed back to Claude so they are fixed in the same turn.
- **Permissions**: routine checks (lint, Vitest, component tests, build, read-only git) run without prompting; read-only `gh issue`/`gh project` queries also run without prompting; pushes, PR creation, installs, and E2E runs ask first; reading `.env`/`certs/`, force-pushes, hard resets, pushes to `main`, and `gh pr merge` are denied.

#### Skills

- **`/verify`** (`.claude/skills/verify/`): runs ESLint, Vitest, Cypress component tests, and the production build, then reports a pass/fail table. `changed-gates.mjs` compares the branch with `main` and picks only the gates the change can affect (e.g. a `cypress/e2e/` change runs ESLint only; docs, `.claude/` or `.github/` changes run none), so CI on the pull request, which runs every workflow, stays the full check. `/verify all` forces every gate. Use before committing or opening a pull request. It runs on Haiku (`model: haiku`) in a forked context (`context: fork`), so test and build logs stay out of the main conversation. `run-gates.mjs` runs the gates in one call, writes full logs to `node_modules/.cache/verify/` and prints a line per gate with any error lines, and caches passes against a hash of the working tree (including uncommitted and untracked files), so a gate that already passed on identical code reports `cached` instead of running again — e.g. `/verify e2e` straight after `/verify` runs only E2E. `/verify all` bypasses the cache. A run reflects the code as it was when it started, so if the code changes mid-run, stop it and run it again.
- **`/verify e2e`**: additionally runs the Cypress E2E suite via `.claude/skills/verify/run-e2e.mjs`, which reuses a dev server on port 3000 or starts one over HTTP (as CI does) and stops it afterwards. Opt-in and approval-gated, because the tests use the live Firebase project and `.env` credentials. `/verify` prints an `E2E advised` line, without running E2E, when a change touches routing, pages, the store, Firebase services, route or API constants, or the E2E specs — see [testing.instructions.md](.github/instructions/testing.instructions.md#when-to-run-e2e-locally) for when to run it locally.

#### Archived: Vue parity programme

The tooling that ported the remaining Vue features (epic #274, delivered in #291) — the `parity-auditor` agent, the `/backlog-sync`, `/implement-item` and `/parity-run` skills, and the `Stop` hook guard — has been retired from `.claude/` so it no longer loads in every session. It is kept for reference, with the plan, gap report and a write-up, in [`_ai-assisted-dev-story/vue-parity-programme/`](_ai-assisted-dev-story/vue-parity-programme/README.md).

---

<a id="testing"></a>

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, and [Cypress](https://www.cypress.io/) for end-to-end testing.

### 1. Vitest Setup

Vitest is already configured and included as a dev dependency — running `npm install` (see [Installation](#installation)) is all that's needed to get started. See [Scripts](#scripts) for the `vitest:*` commands.

**Vitest Directory Structure**

Vitest test files are located alongside the source files they test, following these conventions:

- For store logic: `*.test.js` files are placed next to the source file.
- For components and utility files: tests are typically placed in a `__tests__` folder within the component/utility directory.

```
src/
  ├── components/
  │   ├── forms/
  │   │   ├── __tests__/
  │   │   │   ├── UserAuthenticationForm.test.jsx
  │   │   │   └── ...
  │   │   ├── FormComponent.jsx
  │   ├── ui/
  │   │   ├── __tests__/
  │   │   │   ├── Button.test.jsx
  │   │   │   └── ...
  │   │   ├── Button.jsx
  ├── store/
  │   ├── slices/
  │   │   ├── <slice-file>.js
  │   │   ├── <test-file>.test.js
  ├── utils/
  │   ├── errorHandler/
  │   │   ├── __tests__/
  │   │   │   ├── errorHandler.test.js
  │   │   │   └── ...
  │   │   ├── index.js
```

### Vitest Test Utilities

Reusable test utilities are located in [testingLibrarySetup.js](https://github.com/andres-codigo/trip-fotos-react/blob/main/src/testUtils/vitest/testingLibrarySetup.js). This includes:

- **Mock Setup**: `setupMocks()` mocks `fetch` and `localStorage`, and runs automatically when the module is imported (e.g. via the Vitest `setupFiles` config).

### 2. Cypress Setup

Cypress is already configured in the project (both E2E and component testing) and included in the project dependencies — `npm install` is all that's needed. Feel free to customise [cypress.config.js](https://github.com/andres-codigo/trip-fotos-react/blob/main/cypress.config.js) as needed. See [Scripts](#scripts) for the `cy:*` commands.

**Cypress Directory Structure**

**End-to-End (E2E) Testing**: E2E test files are placed in the e2e directory.

**Fixtures**: Contains mock data used in tests (e.g., JSON files for API responses).

**Support**: Contains custom commands and global test setup files.

```
    cypress/
      ├── e2e/         # End-to-end test files (e.g., Authentication.page.cy.js)
      ├── fixtures/    # Mock data used in tests
      ├── support/     # Custom commands and test setup
```

**Component Testing**: Component test files are placed in a **tests** folder located within each component’s directory. For example:

```
src/
  ├── components/
  │   ├── forms/
  │   │   ├── __tests__/
  │   │   │   ├── UserAuthenticationForm.cy.jsx
  │   │   │   └── ...
  │   │   ├── FormComponent.jsx
  │   ├── ui/
  │   │   ├── __tests__/
  │   │   │   ├── Button.cy.jsx
  │   │   │   └── ...
  │   │   ├── Button.jsx
```

**Test Artifacts**

Cypress stores screenshots and videos (if enabled) in the following directories:

- **Screenshots**: `cypress/screenshots/`
- **Videos**: `cypress/videos/`

You can configure these paths in the [cypress.config.js](https://github.com/andres-codigo/trip-fotos-react/blob/main/cypress.config.js) file.

**Debugging Cypress Tests**

To debug tests, use the Cypress Test Runner in interactive mode (`npx cypress open`). You can inspect elements and view console logs using the browser's developer tools.

<a id="cicd-workflows"></a>

## 🚀 CI/CD Workflows

This project uses GitHub Actions to automate key development and monitoring tasks.

### 1. Vitest Unit Tests

- **Workflow File:** `.github/workflows/vitest-unit-tests.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `package.json`, or `vitest.config.*`)
    - On **pull requests** to `main`
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs the full Vitest unit/integration test suite to ensure code quality.
- **Merge Blocking:** Pull requests must pass this test workflow before merging into `main`.

Runs `npm run vitest:run` — see [Scripts](#scripts) for other Vitest commands.

---

### 2. Cypress E2E Tests

- **Workflow File:** `.github/workflows/cypress-e2e.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `cypress/**`, `package.json`, or `cypress.config.*`)
    - On **pull requests** to `main`
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress end-to-end (E2E) tests against the running application to verify user flows and integration with backend services. Runs `npm run cy:run:e2e` — see [Scripts](#scripts).

---

### 3. Cypress Component Tests

- **Workflow File:** `.github/workflows/cypress-component.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**/__tests__/**`, `src/**/*.jsx`, `src/**/*.tsx`, `cypress.config.*`, or `package.json`)
    - On **pull requests** to `main`
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress component tests to verify individual React components in isolation. Runs `npm run cy:run:ct` — see [Scripts](#scripts).

---

### 4. GitHub Auto Label Pull Requests

- **Workflow File:** `.github/workflows/github-auto-label-prs.yml`
- **Triggers:**
    - On **pull request** events (`opened`, `synchronize`, `reopened`)
- **Purpose:** Automatically applies relevant labels (e.g. `feature`, `documentation`, `dependencies`, `testing`, `styling`, `redux/state`, `firebase`) to pull requests based on the files changed, using glob-pattern rules defined in [`.github/labeler.yml`](.github/labeler.yml) — edit that file to change which files trigger which labels.

---

### 5. GitHub Issue Intake

- **Workflow File:** `.github/workflows/github-issue-intake.yml`
- **Triggers:**
    - On **issue** events (`opened`, `reopened`, `edited`, `labeled`, `unlabeled`)
    - Manually via **Actions → "Run workflow"** (takes an issue number)
- **Purpose:** Adds new issues to the `Trip Fotos React` GitHub Project in **Triage**, auto-labels them and assigns the default assignee. Editing an issue never changes its status. Labels you add move it across the board (see [Project Board Statuses](#project-board-statuses)).

---

### 6. GitHub Project Item Lifecycle

- **Workflow File:** `.github/workflows/project-item-lifecycle.yml`
- **Triggers:**
    - On **pull_request_target** events (`opened`, `reopened`, `synchronize`, `edited`, `ready_for_review`, `converted_to_draft`, `closed`)
- **Purpose:** Keeps pull requests and the issues they close (`Closes #N`, one or more) in sync with the `Trip Fotos React` GitHub Project lifecycle. A PR with no linked issue gets a tracking issue (Dependabot PRs excepted).
- **Secret (Optional but Recommended):** `PROJECT_AUTOMATION_TOKEN`
    - Used for Project v2 write operations when `github.token` does not have enough access.

#### Token Rotation / Recovery Guide

If the workflow logs `Resource not accessible by integration`, check the runbook:

- `.github/project-automation-token.md`

The runbook includes expiry handling, recreation steps, secret update instructions, and post-rotation validation.

---

<a id="project-board-statuses"></a>

#### Project Board Statuses

Every Status is set by the two workflows above. Items also carry **Kind** (Epic / Feature / Bug / Chore / Deps) and **Workstream** (Vue parity / Tooling & AI / Maintenance) fields, set by hand.

| Status      | Meaning                  | Moved there when                                                    |
| ----------- | ------------------------ | ------------------------------------------------------------------- |
| Triage      | New, not yet assessed    | An issue is opened                                                  |
| Backlog     | Accepted, not scheduled  | You add any label to an issue in Triage, or reopen a Done issue     |
| Ready       | Queued, dependencies met | You add the `ready` label, or a linked PR is closed without merging |
| In progress | Being built              | A draft PR that closes the issue is opened                          |
| Blocked     | Needs a human decision   | You add the `blocked` label; removing it restores the status        |
| In review   | PR open for review       | The PR is opened (not as a draft) or marked ready for review        |
| Done        | Merged                   | The PR is merged                                                    |

While an issue has the `blocked` label its PR events leave it in Blocked; only a merge moves it on.

---

### 7. CodeQL Code Scanning

- **Configured In:** **Settings → Advanced Security → CodeQL analysis** (GitHub-managed **Default setup** — no workflow file)
- **Triggers:** On push and pull requests to `main`, plus a weekly scheduled scan
- **Purpose:** Scans JavaScript/TypeScript and the GitHub Actions workflows for security vulnerabilities. Results appear under **Security → Code scanning**.
- **Note:** Code scanning requires the repository to be **public** — on a private personal repository it is unavailable and the check will fail.

### 🛠 Manual Triggers

Some workflows, like the **Vitest test runner**, can be manually executed from the GitHub UI:

1. Navigate to the **Actions** tab of the repository
2. Select the desired workflow (e.g., **"Run Unit Tests (Vitest)"**, **"E2E - Run Cypress Page Tests"**, or **"Component - Run Cypress Component Tests"**).
3. Click the **"Run workflow"** button on the right side
4. The workflow will be executed immediately (no input needed)

> This is useful for manually re-running workflows after configuration changes or failed automated runs.

---

### 📝 Summary Table

| Workflow Name                     | File                                           | Tests Type       | Triggered On     |
| --------------------------------- | ---------------------------------------------- | ---------------- | ---------------- |
| Vitest - Run Unit Tests           | `.github/workflows/vitest-unit-tests.yml`      | Unit/Integration | Push/PR/Manual   |
| Cypress - Run E2E Page Tests      | `.github/workflows/cypress-e2e.yml`            | E2E              | Push/PR/Manual   |
| Cypress - Run Component Tests     | `.github/workflows/cypress-component.yml`      | Component        | Push/PR/Manual   |
| GitHub - Auto Label Pull Requests | `.github/workflows/github-auto-label-prs.yml`  | Automation       | PR Events        |
| GitHub - Issue Intake             | `.github/workflows/github-issue-intake.yml`    | Automation       | Issue Events     |
| GitHub - Project Item Lifecycle   | `.github/workflows/project-item-lifecycle.yml` | Automation       | PR Target Events |

---

> **Note:** Ensure all required environment variables and secrets are set in your repository settings for CI to work correctly. The Vitest, component and E2E workflows read the Firebase config from the `VITE_FIREBASE_*` and `VITE_DATABASE_URL` secrets; E2E also needs `VITE_API_URL`, `VITE_API_KEY`, `VITE_BACKEND_BASE_URL` and `CYPRESS_USER_*`.

<a id="build"></a>

## 🛠️ Build

### Build for Production

Compile and minify the project for production:

```bash
npm run build
```

The output will be located in the `./dist` folder.

### Preview Production Build

Serve the production build locally:

```bash
npm run preview
```

---

### Analyse Bundle Size (Vite Bundle Visualizer)

You can analyse your production bundle to identify large dependencies and optimise performance using [Vite Bundle Visualizer](https://github.com/btd/vite-plugin-visualizer):

```bash
npm run analyse
```

This will generate a visual interactive report (`dist/stats.html`) showing the size of each module in your bundle, then serve it with `vite preview` and open `https://localhost:3001/stats.html` in your browser — this also works from the devcontainer. Stop the server with `Ctrl+C` when you are done.

> **Tip:** Keeping your bundle size small improves load times and user experience.

<a id="deployment"></a>

## 📦 Deployment

This project is configured for deployment on [Vercel](https://vercel.com/).

### Steps

1. Follow the [Vercel Getting Started Guide](https://vercel.com/docs/getting-started-with-vercel).
2. Deploy the project by linking your GitHub repository to Vercel.
3. Configure environment variables in the Vercel dashboard.

### Routing, Headers and Static Files

`vercel.json` controls how the production deployment responds:

- **Route allow-list** — only the app's known routes (`/authentication`, `/travellers`, `/travellers/:id`, `/travellers/:id/contact`, `/register`, `/messages`, `/privacy`, `/404`) are rewritten to the single-page app. Any other path falls through to `public/404.html` with a real `404` status, so crawlers do not see soft 404s. **When you add a route to `PATHS`, add it to the `rewrites` source in `vercel.json` too**, or it will 404 on a hard refresh in production.
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` are set on every response. An enforced `Content-Security-Policy` limits scripts to the site itself and network requests to Firebase. If you add a new third-party service (a CDN, an analytics provider or another Firebase product), add its origin to the matching directive in `vercel.json`, or the browser will block it. To trial a change safely, rename the header to `Content-Security-Policy-Report-Only` on a preview: violations are then logged to the console without blocking.
- **Caching** — fingerprinted build output in `/assets/` is cached for a year as `immutable`; fonts are cached for a week.

`public/` also holds `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest` and `.well-known/security.txt`. These contain the production URL, so update them if the domain changes. `security.txt` has an `Expires` date that must be renewed before it passes.

<a id="features"></a>

## ✨ Features

See [🚧 Status](#status) for a fuller list of what is live.

- **User Registration and Authentication**
  Users can sign up and log in using Firebase Authentication.

- **Traveller Profiles**
  Registered travellers can describe their travel destination, choose where they travelled to and record the number of days spent there. Travellers can upload photos, the travellers list can be filtered by city, and signed-in users can send a traveller a message from their profile and read and delete their own messages.

- **Admin Access**
  Admin rights are a Firebase custom claim granted with `npm run admin:claim` (see [Admin Role](#admin-role)). When logged in, the admin can remove other travellers, along with their photos and messages.

- **Privacy Policy**
  A public `/privacy` page, linked from the site footer, explains what data the app collects (account, traveller registration, city search via Photon with the OpenStreetMap credit, browser storage and cookieless Vercel analytics) and where it is stored.

<a id="folder-structure"></a>

## 📁 Folder Structure

```
trip-fotos-react/
├── .devcontainer/               # VS Code Dev Container configuration
├── .claude/
│   ├── agents/                 # Claude Code subagent wrappers (delegate to .github/agents)
│   ├── hooks/                  # Claude Code hook scripts (lint/format after edits)
│   ├── plans/                  # Committed work plans (e.g. deferred Firebase emulator plan)
│   ├── skills/                 # Claude Code skills (e.g. /verify)
│   ├── settings.json           # Shared Claude Code permissions and hooks
│   └── settings.local.json     # Personal Claude Code overrides (gitignored)
├── .github/
│   ├── agents/                 # Scaffolding workflows (shared by Copilot and Claude Code)
│   ├── instructions/           # Domain-specific guidance (shared by Copilot and Claude Code)
│   ├── workflows/              # GitHub Actions workflow files for CI/CD automation
│   └── copilot-instructions.md # Workspace-level Copilot guidelines
├── .vscode/                     # Shared VS Code editor settings
├── cypress/                    # Cypress tests
├── declarations/               # Breaking issue fix when using ESLint V9
├── public/                     # Static assets, app icons, social image, 404 page, robots.txt, sitemap, manifest and .well-known files
├── rules/                      # ESLint configuration rules
├── scripts/                    # Repo maintenance scripts (set-admin-claim.mjs, dependency-check output)
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
├── .env                         # Environment variables (not committed to version control)
├── .firebaserc                  # Firebase project configuration
├── .gitignore                   # Git ignore rules
├── .npmrc                       # Configuration file for custom npm settings and registry options
├── .nvmrc                       # Specifies the Node.js version for Node Version Manager (nvm)
├── .prettierignore              # Prettier ignore rules
├── .prettierrc.json             # Prettier configuration
├── CLAUDE.md                    # Workspace-level Claude Code guidelines
├── cypress.config.js            # Cypress testing configuration
├── database.rules.json          # Realtime Database security rules
├── eslint-plugin-react-hooks.d.ts # Type declaration shim for the ESLint React Hooks plugin
├── eslint.config.mjs            # ESLint configuration
├── firebase.json                # Firebase CLI config (points at the rules files)
├── index.html                   # Vite HTML entry point
├── jsconfig.json                # JavaScript project configuration for editor support (paths, aliases, IntelliSense)
├── package.json                 # Project dependencies and scripts
├── README.md                    # Project documentation
├── storage.rules                # Cloud Storage security rules
├── vercel.json                  # Vercel deployment configuration
└── vite.config.js               # Vite build tool configuration
```

> **Note:** `jsconfig.json` provides editor IntelliSense/module resolution support; the `@/` path alias itself is configured in `vite.config.js`.

<a id="troubleshooting"></a>

## 🧯 Troubleshooting

- **Issue**: `npm install` fails.
    - **Solution**: Ensure you have Node.js and npm installed. Check the required versions in the [Node.js](https://nodejs.org/) documentation.

- **Issue**: Firebase environment variables are not working.
    - **Solution**: Ensure you have created a `.env` file in the root directory with the correct Firebase configuration values.

- **Issue**: `Error: ENOENT: no such file or directory, open './certs/localhost.key'`
    - **Solution**: Make sure you have generated the SSL certificate and key as described above. In CI and production (e.g., Vercel), the build will fall back to HTTP if the certs are missing.

- **Issue**: Browser shows "Your connection is not private" on `https://localhost:3000`
    - **Solution**: This is normal for self-signed certificates. Click "Advanced" and "Proceed" to continue.
