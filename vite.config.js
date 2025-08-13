import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'
import fs from 'fs'
import os from 'os'

import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint2'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getHttpsConfig = () => {
	const keyPath = './certs/localhost.key'
	const certPath = './certs/localhost.crt'
	if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
		return {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath),
		}
	}
	return undefined
}

// Checks if Cypress is running to conditionally set HTTPS config
// If Cypress is not running, it will use the HTTPS configuration if available, otherwise it will fall back to HTTP.
const isCypress = !!process.env.CYPRESS
const httpsConfig = !isCypress ? getHttpsConfig() : undefined

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
		visualizer({
			open: true,
			filename: 'stats.html',
			gzipSize: true,
			brotliSize: true,
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
		setupFiles: './src/testUtils/vitest/testingLibrarySetup.js',
		// Performance optimisations - uses worker threads for parallel test execution
		// Dynamically sets thread count: 2 in CI, half of CPU cores locally (min 1)
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: false,
				minThreads: 1,
				maxThreads: process.env.CI
					? 2
					: Math.max(1, Math.ceil(os.cpus().length / 2)),
			},
		},
		// Optimises file watching - ignores coverage reports, dependencies, and E2E tests
		// Faster file watching and change detection
		watch: {
			ignored: ['**/coverage/**', '**/node_modules/**', '**/cypress/**'],
		},
		// Improves test isolation - automatically clears and restores mocks between tests
		clearMocks: true,
		restoreMocks: true,
		coverage: {
			testTimeout: 10000,
			hookTimeout: 10000,
			enabled: process.env.COVERAGE === 'true',
			provider: 'v8',
			reportsDirectory: './coverage',
			reporter: ['text', 'html'],
			exclude: [
				'node_modules/**',
				'cypress/**',
				'declarations/**',
				'rules/**',
				'**/*.config.*',
				'**/*.cy.jsx',
				'**/index.jsx',
				'**/LoadingFallback.jsx',
				'**/testUtils/**',
			],
		},
	},
})
