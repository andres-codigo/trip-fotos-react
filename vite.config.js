import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint2'

export default defineConfig({
	server: {
		port: 3000,
		open: true,
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
		alias: [
			{
				find: '@',
				replacement: fileURLToPath(new URL('./src', import.meta.url)),
			},
		],
		extensions: ['.js', '.jsx', '.json', '.mjs', '.vue', 'svg', 'scss'],
	},
	optimizeDeps: {
		force: true,
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
