import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'

import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint2'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
	server: {
		port: 3000,
		open: process.env.VITE_OPEN === 'true',
	},
	preview: {
		port: 3001,
		open: true,
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
					redux: ['redux', '@reduxjs/toolkit', 'react-redux'],
					router: ['react-router-dom'],
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
