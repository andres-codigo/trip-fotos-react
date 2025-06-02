import { defineConfig } from 'cypress'
import viteConfig from './vite.config.js'

import { PATHS } from './src/constants/paths'

import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
	env: {
		// PATHS
		ROOT_URL: PATHS.HOME,
		AUTHENTICATION_URL: PATHS.AUTHENTICATION,
		TRIPS_URL: PATHS.TRIPS,
		MESSAGES_URL: PATHS.MESSAGES,
		PAGENOTFOUND_URL: PATHS.PAGENOTFOUND,
		// TEST PATHS
		NON_EXISTENT_URL: PATHS.NON_EXISTENT_PATH,
		// API
		API_URL: process.env.VITE_API_URL,
		API_KEY: process.env.VITE_API_KEY,
		// USER CREDENTIALS
		USER_EMAIL: process.env.CYPRESS_USER_EMAIL,
		USER_PASSWORD: process.env.CYPRESS_USER_PASSWORD,
		// BACKEND
		VITE_DATABASE_URL: process.env.VITE_BACKEND_BASE_URL,
	},
	e2e: {
		baseUrl: process.env.VITE_ROOT_URL || 'http://localhost:3000',
	},

	component: {
		devServer: {
			framework: 'react',
			bundler: 'vite',
			viteConfig,
		},
	},
})
