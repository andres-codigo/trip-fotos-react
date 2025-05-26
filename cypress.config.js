import { defineConfig } from 'cypress'

import { PATHS } from './src/constants/paths'

import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
	baseUrl: process.env.VITE_ROOT_URL || 'http://localhost:3000',
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
		USER_EMAIL: process.env.CYPRESS_USER_EMAIL,
		USER_PASSWORD: process.env.CYPRESS_USER_PASSWORD,
		// BACKEND
		VITE_DATABASE_URL: process.env.VITE_BACKEND_BASE_URL,
	},

	component: {
		devServer: {
			framework: 'react',
			bundler: 'vite',
		},
	},
})
