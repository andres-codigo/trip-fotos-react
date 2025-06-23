import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'
import fs from 'fs'

import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint2'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isCypress = !!process.env.CYPRESS

const httpsConfig = !isCypress
	? {
			key: fs.readFileSync('./certs/localhost.key'),
			cert: fs.readFileSync('./certs/localhost.crt'),
		}
	: undefined

export default defineConfig({
	server: {
		port: 3000,
		open: process.env.VITE_OPEN === 'true',
		https: httpsConfig,
	},
	preview: {
		port: 3001,
		open: true,
		https: httpsConfig,
	},
	plugins: [
		react(),
		eslint({
			include: ['src/**/*.js', 'src/**/*.jsx'],
			exclude: ['node_modules', 'dist'],
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
		extensions: ['.js', '.jsx', '.json', '.mjs', '.vue', '.svg', '.scss'],
	},
	optimizeDeps: {
		force: true,
	},
	build: {
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					react: ['react', 'react-dom'],
					redux: [
						'redux',
						'@reduxjs/toolkit',
						'react-redux',
						'redux-persist',
					],
					router: ['react-router-dom'],
					firebase: ['firebase/app'],
					analytics: ['@vercel/analytics'],
					transition: ['react-transition-group'],
				},
			},
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.js',
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage',
		},
	},
})
