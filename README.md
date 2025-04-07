# trip-fotos-react

## Contents

- [About This Project](#about-this-project)
- [Stack](#stack)
- [Installation](#installation)
- [Setup](#setup)
- [Development](#development)
- [Testing](#testing)
- [Build](#build)
- [Deployment](#deployment)
- [Features](#features)

## About This Project

This project is a UI and functional conversion from Vue to React and extends the original Udemy Vue - The Complete Guide (incl. Router & Composition API) course > 'Find a coach' project. It has been reimagined as "finding popular travel destinations" tied to a registered traveller.

## Stack

This project uses the following technologies:

- [Vite](https://vite.dev/) for development and build.
- [React](https://react.dev/) as the front-end library.
- [React Router](https://reactrouter.com/) for routing.
- [Redux](https://redux.js.org/) for state management.
- [SCSS](https://sass-lang.com/) for CSS preprocessing.
- [ESLint](https://eslint.org/) for JavaScript linting.
- [Prettier](https://prettier.io/) for code formatting.
- [Cypress](https://www.cypress.io/) for end-to-end testing.
- [Firebase Realtime Database](https://firebase.google.com/docs/database) for storing travellers and messages.
- [Firebase Authentication](https://firebase.google.com/docs/auth) for managing sign-in credentials.
- [Firebase Cloud Storage](https://firebase.google.com/docs/storage) for storing uploaded traveller images.

## Installation

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

Run the following command to install all required dependencies:

```bash
npm install
```

## Setup

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

### Environment Variables

Create a `.env` file in the root directory and add the following key-value pairs:

```bash

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

# UNIQUE ID FOR 'EMAIL/PASSWORD' REGISTERED FIREBASE AUTHENTICATED USER THAT WILL HAVE ADMIN RIGHTS ON APP, ALLOWING FOR THE DELETION OF TRAVELLERS FROM THE UI FRONT END, EXCLUDING REGISTERED ADMIN USER *

VITE_ADMIN_ID=''

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

---

## Development

### Start the Development Server

Run the following command to start the local development server with hot module replacement:

```bash
npm run dev
```

### Linting and Formatting

- Run ESLint to check for issues:
    ```bash
    npm run lint:js
    ```
- Automatically fix linting issues:
    ```bash
    npm run lint:fix
    ```
- Format files using Prettier:
    ```bash
    npm run format
    ```

---

## Testing

This project uses [Cypress](https://www.cypress.io/) for end-to-end testing.

### Install Cypress

```bash
npm install cypress --save-dev
```

### Run Cypress Tests

- Open the Cypress Test Runner:
    ```bash
    npx cypress open
    ```
- Run all tests in headless mode:
    ```bash
    npx cypress run
    ```

### Test Directory Structure

```
cypress/
  ├── e2e/         # End-to-end test files (e.g., homepage.cy.js)
  ├── fixtures/    # Mock data used in tests
  ├── support/     # Custom commands and test setup
```

---

## Build

### Build for Production

Compile and minify the project for production:

```bash
npm run build
```

The output will be located in the `./dist` folder.

### Preview Production Build

Serve the production build locally:

```bash
npm run serve
```

---

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com/).

### Steps

1. Follow the [Vercel Getting Started Guide](https://vercel.com/docs/getting-started-with-vercel).
2. Deploy the project by linking your GitHub repository to Vercel.
3. Configure environment variables in the Vercel dashboard.

## Features

- **User Registration and Authentication**
  Users can sign up and log in using Firebase Authentication.

- **Admin Access**
  Assign admin rights to a specific user by adding their Firebase Auth User UID to the `.env` file under `VITE_ADMIN_ID`.

- **Traveller Profiles**
  Registered travellers can upload photos and leave personal messages on other traveller profiles.

NB: The trip-fotos-vue App requires registered login credentials for full access. By default, a user is only able to login.

To enable a user to 'Sign-up' and then register as a traveller uncomment the 'switch mode' button (src/pages/auth/UserAuth.vue), lines 38-43. Once a users have been signed-up, validate the entries in Firebase > Authentication > Users, and copy and paste the **User UID** of your choice into the .env **VITE_ADMIN_ID** property for user Admin access, allowing this user to delete registered travellers using the Front End UI. Deleting the traveller will delete all traveller information, including images, but their authenticated sign-up details will remain.

## Folder Structure

```
trip-fotos-react/
├── cypress/            # Cypress tests
├── public/             # Static assets
├── src/
│   ├── assets/         # Fonts, svg's
│   ├── components/     # Reusable React components
│   ├── constants/      # firebase, api
│   ├── pages/          # Page components for routing
│   ├── store/          # Redux store and slices
│   ├── styles/         # SCSS stylesheets
│   ├── utils/          # Utility functions
│   └── App.js          # Main application component
├── .firebaserc                 # Firebase project configuration
├── .gitignore                  # Git ignore rules
├── .prettierignore             # Prettier ignore rules
├── .prettierrc.json            # Prettier configuration
├── cypress.config.js           # Cypress testing configuration
├── eslint.config.mjs           # ESLint configuration
├── vercel.json                 # Vercel deployment configuration
├── vite.config.js              # Vite build tool configuration
├── package.json                # Project dependencies and scripts
├── README.md                   # Project documentation
└── .env                        # Environment variables (not committed to version control)
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

---
