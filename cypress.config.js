import { defineConfig } from 'cypress'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config.js'

import { PATHS } from './src/constants/ui/paths.js'

import {
	seedEmulators,
	SEED_USERS,
	SEED_PASSWORD,
} from './scripts/seed-emulators.mjs'

import dotenv from 'dotenv'
dotenv.config()

// `npm run cy:run:e2e:emulators` sets this. Cypress reads only `.env` here, so
// Vite's `--mode emulators` does not reach it: load the emulator values over it
const useEmulators = process.env.E2E_EMULATORS === 'true'
if (useEmulators) {
	dotenv.config({ path: '.env.emulators', override: true })
}

const testUser = useEmulators
	? { email: SEED_USERS.STANDARD.email, password: SEED_PASSWORD }
	: {
			email: process.env.CYPRESS_USER_EMAIL,
			password: process.env.CYPRESS_USER_PASSWORD,
		}

export default defineConfig({
	env: {
		// PATHS
		HOME_URL: PATHS.HOME,
		AUTHENTICATION_URL: PATHS.AUTHENTICATION,
		TRAVELLERS_URL: PATHS.TRAVELLERS,
		REGISTER_URL: PATHS.REGISTER,
		MESSAGES_URL: PATHS.MESSAGES,
		PAGE_NOT_FOUND_URL: PATHS.PAGE_NOT_FOUND,
		// TEST PATHS
		NON_EXISTENT_URL: PATHS.NON_EXISTENT_PATH,
	},
	// Public config values intentionally readable by app/test code running
	// in the browser (AUT). See Cypress.expose() in src/constants/api/endpoints.js
	// and src/constants/config/users.js.
	expose: {
		API_URL: process.env.VITE_API_URL,
		API_KEY: process.env.VITE_API_KEY,
		VITE_DATABASE_URL: process.env.VITE_BACKEND_BASE_URL,
		VITE_DATABASE_NAMESPACE: process.env.VITE_DATABASE_NAMESPACE,
		USE_EMULATORS: String(useEmulators),
		EMULATOR_TRAVELLER_EMAIL: SEED_USERS.TRAVELLER_ONE.email,
		EMULATOR_TRAVELLER_UID: SEED_USERS.TRAVELLER_ONE.uid,
		EMULATOR_STANDARD_UID: SEED_USERS.STANDARD.uid,
		EMULATOR_OTHER_TRAVELLER_UID: SEED_USERS.TRAVELLER_TWO.uid,
		EMULATOR_ADMIN_EMAIL: SEED_USERS.ADMIN.email,
		CYPRESS_USER_EMAIL: testUser.email,
		CYPRESS_USER_PASSWORD: testUser.password,
	},
	e2e: {
		// The live smoke spec signs in to the real project, so only its own run picks it up
		specPattern: useEmulators
			? 'cypress/e2e/**/*.cy.js'
			: 'cypress/e2e-live/**/*.cy.js',
		baseUrl: process.env.VITE_ROOT_URL || 'http://localhost:3000',
		setupNodeEvents(on) {
			on('task', { seedEmulators })
		},
	},

	component: {
		devServer: {
			framework: 'react',
			bundler: 'vite',
			// Vite only scans index.html for deps, so spec-only imports were
			// found mid-run and the optimiser reload failed the next spec
			viteConfig: mergeConfig(viteConfig, {
				optimizeDeps: {
					entries: [
						'cypress/support/component.{js,jsx}',
						'src/**/*.cy.{js,jsx}',
					],
				},
			}),
		},
		specPattern: '**/*.cy.{js,jsx,ts,tsx}',
		// Cypress only skips the E2E folder by matching the E2E pattern, which now varies by mode
		excludeSpecPattern: ['cypress/e2e/**', 'cypress/e2e-live/**'],
		// Fixed so specs never depend on .env or CI secrets, and an unstubbed
		// request fails on the unresolvable .invalid host instead of reaching the live DB
		expose: {
			VITE_DATABASE_URL: 'https://component-tests.firebaseio.invalid',
		},
	},
})
