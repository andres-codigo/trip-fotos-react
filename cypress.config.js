import { defineConfig } from 'cypress'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config.js'

import { PATHS } from './src/constants/ui/paths.js'

import dotenv from 'dotenv'
dotenv.config()

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
		CYPRESS_USER_EMAIL: process.env.CYPRESS_USER_EMAIL,
		CYPRESS_USER_PASSWORD: process.env.CYPRESS_USER_PASSWORD,
	},
	e2e: {
		baseUrl: process.env.VITE_ROOT_URL || 'http://localhost:3000',
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
		// Fixed so specs never depend on .env or CI secrets, and an unstubbed
		// request fails on the unresolvable .invalid host instead of reaching the live DB
		expose: {
			VITE_DATABASE_URL: 'https://component-tests.firebaseio.invalid',
		},
	},
})
