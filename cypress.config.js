import { defineConfig } from 'cypress';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	e2e: {
		baseUrl: 'http://localhost:3000',
		env: {
			ROOT_URL: '/',
			AUTHENTICATION_URL: '/authentication',
			TRIPS_URL: '/trips',
			USER_EMAIL: process.env.CYPRESS_USER_EMAIL,
			USER_PASSWORD: process.env.CYPRESS_USER_PASSWORD,
			VITE_DATABASE_URL: process.env.VITE_BACKEND_BASE_URL,
		},
	},

	component: {
		devServer: {
			framework: 'react',
			bundler: 'vite',
		},
	},
});
