# trip-fotos-react

[![Component - Run Cypress Component Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-component.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-component.yml)
[![E2E - Run Cypress Page Tests](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-e2e.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/cypress-e2e.yml)
[![Run Unit Tests (Vitest)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/unit-tests-vitest.yml/badge.svg)](https://github.com/andres-codigo/trip-fotos-react/actions/workflows/unit-tests-vitest.yml)

## Contents

- [📘 About This Project](#about-this-project)
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

To get started with the project, follow these steps:

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Clone the repository

```bash
git clone https://github.com/andres-codigo/trip-fotos-react
cd trip-fotos-react
```

### Install dependencies

Run the following command to install all required dependencies, including Cypress and Vitest:

```bash
npm install
```

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

# Open the Cypress E2E Test Runner in interactive mode
npm run cy:open:e2e

# Open the Cypress Component Test Runner in interactive mode
npm run cy:open:ct

# Run all tests using Vitest
npm run vitest

# Run tests in watch mode
npm run vitest:watch

# Generate a test coverage report
npm run vitest:coverage

# Visual Vite bundle analysis
npm run analyze

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
        - Update the database rules as follows:
            ```json
            {
            	"rules": {
            		"travellers": {
            			".read": true,
            			".write": "auth != null"
            		},
            		"messages": {
            			".read": "auth != null",
            			".write": true
            		}
            	}
            }
            ```

    - **Authentication**
        - Go to "Sign-in Method" and enable **Email/Password**. Ensure **Email link (passwordless sign-in)** is NOT enabled.

    - **Cloud Storage**
        - Set up a [Blaze Plan](https://firebase.google.com/pricing?hl=en) to enable storage capabilities.

3. **Add Firebase to Your Web App**
    - Register your app in the Firebase Console.
    - Copy the Firebase configuration values and add them to your `.env` file.

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
VITE_FIREBASE_MEASUREMENT_ID='' # firebaseConfig > measurementId

# Admin User ID
VITE_ADMIN_ID='' # Firebase authenticated User UID for deletion of users rights

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

---

<a id="testing"></a>

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, and [Cypress](https://www.cypress.io/) for end-to-end testing.

### 1. Vitest Setup

Vitest is already configured in the project.

To get started:

**Install Vitest** (if not already installed):

```bash
npm install vitest --save-dev
```

**Run Tests**

Refer to the [Scripts](#scripts) section for commands to run tests, such as:

```bash
npm run vitest         # Run all tests
npm run vitest:watch   # Run tests in watch mode
npm run vitest:coverage # Generate coverage report
```

**Vitest Directory Structure**

Vitest test files are located alongside the source files they test, following the convention `*.test.js`.

```
src/
    ├── store/
    │   ├── slices/
    │   │   ├── <test-file>.js
    │   │   ├── <test-file>.test.js
```

**Writing Tests**

```javascript
import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
	it('should pass this test', () => {
		expect(1 + 1).toBe(2)
	})
})
```

### Vitest Test Utilities

Reusable test utilities are located in the [testSetup](https://github.com/andres-codigo/trip-fotos-react/blob/main/src/testUtils/testSetup.js) file. These include:

- **Mock Setup**: Functions to mock `fetch`, `localStorage`, and other global objects.

Example usage:

```javascript
import { setupMocks, resetMocks } from '@/testUtils/testSetup'

beforeEach(() => {
	setupMocks()
	resetMocks()
})
```

### 2. Cypress Setup

Cypress is already configured in the project for both end-to-end (E2E) and component testing.

**Install Cypress**

Cypress is included in the project dependencies. If you haven't already installed dependencies, run:

```bash
npm install
```

**Cypress Configuration**

Cypress is pre-configured in this project. Feel free to customise the [cypress.config.js](https://github.com/andres-codigo/trip-fotos-react/blob/main/cypress.config.js) file as needed for your testing requirements.

**Run Cypress Tests**

- **Open Cypress E2E Test Runner (interactive mode):**
    ```bash
    npm run cy:open:e2e
    ```
- **Open Cypress Component Test Runner (interactive mode):**
    ```bash
    npm run cy:open:ct
    ```
- **Run Cypress E2E tests in headless mode:**
    ```bash
    npx cypress run
    ```
- **Run a specific test file:**
    ```bash
    npx cypress run --spec "cypress/e2e/<test-file>.cy.js"
    ```

**Cypress Directory Structure**

**End-to-End (E2E) Testing**: E2E test files are placed in the e2e directory.

**Fixtures**: Contains mock data used in tests (e.g., JSON files for API responses).

**Support**: Contains custom commands and global test setup files.

```
    cypress/
      ├── e2e/         # End-to-end test files (e.g., UserAuth.page.cy.js)
      ├── fixtures/    # Mock data used in tests
      ├── support/     # Custom commands and test setup
```

**Component Testing**: Component test files are placed in a **tests** folder located within each component’s directory. For example:

```
    src/
      ├── components/
            ├── ui/
                ├── button/
                    ├── __tests__/
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

- **Workflow File:** `.github/workflows/unit-tests-vitest.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `package.json`, or `vitest.config.*`)
    - On **pull requests** to `main`
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs the full Vitest unit/integration test suite to ensure code quality.
- **Merge Blocking:** Pull requests must pass this test workflow before merging into `main`.

#### Test Commands

```bash
npm run vitest          # Run all tests in CI mode
npm run vitest:watch    # Run tests in watch mode (local dev)
npm run vitest:coverage # Run tests with coverage reporting
```

---

### 2. Cypress E2E Tests

- **Workflow File:** `.github/workflows/cypress-e2e.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**`, `cypress/**`, `package.json`, or `cypress.config.*`)
    - On **pull requests** to `main`
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress end-to-end (E2E) tests against the running application to verify user flows and integration with backend services.

#### E2E Test Command

```bash
npx cypress run
```

---

### 3. Cypress Component Tests

- **Workflow File:** `.github/workflows/cypress-component.yml.yml`
- **Triggers:**
    - On **push** to `main` (for changes in `src/**/__tests__/**`, `src/**/*.jsx`, `src/**/*.tsx`, `cypress.config.*`, or `package.json`)
    - On **pull requests** to `main`
    - Manually via **Actions → "Run workflow"**
- **Purpose:** Runs Cypress component tests to verify individual React components in isolation.

#### Component Test Command

```bash
npx cypress run --component
```

### Clone Tracker Workflow

- **Location:** `.github/workflows/clone-tracker.yml`
- **Purpose:** Sends a webhook notification (e.g., to Discord) when the repository is cloned.
- **Use Case:** Useful for monitoring interest and visibility of the project.

> Note: This workflow uses the GitHub [Traffic API](https://docs.github.com/en/rest/metrics/traffic) and requires the appropriate permissions to access clone statistics.

---

### 🛠 Manual Triggers

Some workflows, like the **Vitest test runner**, can be manually executed from the GitHub UI:

1. Navigate to the **Actions** tab of the repository
2. Select the desired workflow (e.g., **"Run Unit Tests (Vitest)"**, **"E2E - Run Cypress Page Tests"**, or **"Component - Run Cypress Component Tests"**).
3. Click the **"Run workflow"** button on the right side
4. The workflow will be executed immediately (no input needed)

> This is useful for manually re-running workflows after configuration changes or failed automated runs.

---

### 📝 Summary Table

| Workflow Name                           | File                                          | Tests Type       | Triggered On   |
| --------------------------------------- | --------------------------------------------- | ---------------- | -------------- |
| Run Unit Tests (Vitest)                 | `.github/workflows/unit-tests-vitest.yml`     | Unit/Integration | Push/PR/Manual |
| E2E - Run Cypress Page Tests            | `.github/workflows/cypress-e2e.yml`           | E2E              | Push/PR/Manual |
| Component - Run Cypress Component Tests | `.github/workflows/cypress-component.yml.yml` | Component        | Push/PR/Manual |

---

> **Note:** Ensure all required environment variables and secrets are set in your repository settings for CI to work correctly.

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
npm run analyze
```

This will generate a visual interactive report (usually `stats.html`) showing the size of each module in your bundle. Open the generated file in your browser to explore and identify optimisation opportunities.

> **Tip:** Keeping your bundle size small improves load times and user experience.

<a id="deployment"></a>

## 📦 Deployment

This project is configured for deployment on [Vercel](https://vercel.com/).

### Steps

1. Follow the [Vercel Getting Started Guide](https://vercel.com/docs/getting-started-with-vercel).
2. Deploy the project by linking your GitHub repository to Vercel.
3. Configure environment variables in the Vercel dashboard.

<a id="features"></a>

## ✨ Features

- **User Registration and Authentication**
  Users can sign up and log in using Firebase Authentication.

- **Admin Access**
  Assign admin rights to a specific user by adding their Firebase Auth User UID to the `.env` file under `VITE_ADMIN_ID`. This allows the admin user to delete other travellers.

- **Traveller Profiles**
  Registered travellers can add a description of their travel destination, choose where they travelled to, the number of days spent there, as well as upload photos. They are also able to leave contact and send a messages on other traveller against their profile.

<a id="folder-structure"></a>

## 📁 Folder Structure

```
trip-fotos-react/
├── cypress/                    # Cypress tests
├── declarations/               # Breaking issue fix when using ESLint V9
├── public/                     # Static assets
├── rules/                      # ESLint configuration rules
├── src/
│   ├── assets/         # Fonts, SVGs, and other static assets
│   ├── components/     # Reusable React components
│   ├── constants/      # Global, Firebase, API, paths, and other constants
│   ├── pages/          # Page components for routing
│   ├── store/          # Redux store and slices
│   ├── styles/         # SCSS stylesheets
│   ├── testUtils/      # Vitest utility functions
│   ├── utils/          # General utility functions
│   ├── App.js          # Main application component
│   ├── firebase.js     # Firebase configuration
│   ├── index.js        # Root application entry point
│   └── setupTests.js   # Testing environment configuration
├── .env                        # Environment variables (not committed to version control)
├── .firebaserc                 # Firebase project configuration
├── .gitignore                  # Git ignore rules
├── .prettierignore             # Prettier ignore rules
├── .prettierrc.json            # Prettier configuration
├── cypress.config.js           # Cypress testing configuration
├── eslint.config.mjs           # ESLint configuration
├── jsconfig.json               # JS configuration
├── package.json                # Project dependencies and scripts
├── README.md                   # Project documentation
├── vercel.json                 # Vercel deployment configuration
└── vite.config.js              # Vite build tool configuration
```

### Explanation of Additional Files:

1. **`.firebaserc`**: Firebase project configuration file for managing Firebase environments.
2. **`.gitignore`**: Specifies files and directories to be ignored by Git (e.g., `node_modules`, `.env`).
3. **`.prettierignore`**: Specifies files and directories to be ignored by Prettier for formatting.
4. **`.prettierrc.json`**: Configuration file for Prettier to enforce consistent code formatting.
5. **`cypress.config.js`**: Configuration file for Cypress end-to-end testing.
6. **`eslint.config.mjs`**: ESLint configuration file for linting JavaScript/TypeScript code.
7. **`vercel.json`**: Configuration file for deploying the project to Vercel.
8. **`vite.config.js`**: Configuration file for Vite, specifying plugins, aliases, and build options.

<a id="troubleshooting"></a>

## 🧯 Troubleshooting

- **Issue**: `npm install` fails.
    - **Solution**: Ensure you have Node.js and npm installed. Check the required versions in the [Node.js](https://nodejs.org/) documentation.

- **Issue**: Firebase environment variables are not working.
    - **Solution**: Ensure you have created a [.env](http://_vscodecontentref_/1) file in the root directory with the correct Firebase configuration values.

- **Issue**: `Error: ENOENT: no such file or directory, open './certs/localhost.key'`
    - **Solution**: Make sure you have generated the SSL certificate and key as described above. In CI and production (e.g., Vercel), the build will fall back to HTTP if the certs are missing.

- **Issue**: Browser shows "Your connection is not private" on `https://localhost:3000`
    - **Solution**: This is normal for self-signed certificates. Click "Advanced" and "Proceed" to continue.
