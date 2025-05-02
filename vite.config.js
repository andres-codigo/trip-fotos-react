import { fileURLToPath, URL } from 'node:url';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint2';
import tailwindcss from '@tailwindcss/vite';

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
		tailwindcss(),
		{
			name: 'treat-js-files-as-jsx',
			async transform(code, id) {
				if (!id.match(/src\/.*\.js$/)) return null;
				return transformWithEsbuild(code, id, {
					loader: 'jsx',
					jsx: 'automatic',
				});
			},
		},
		react(),
		eslint({
			include: ['src/**/*.ts', 'src/**/*.tsx'],
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
		extensions: ['.js', '.json', '.mjs', '.vue', 'svg', 'scss'],
	},
	optimizeDeps: {
		force: true,
		esbuildOptions: {
			loader: {
				'.js': 'jsx',
			},
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.js',
		coverage: {
			provider: 'c8',
			reportsDirectory: './coverage',
		},
	},
});
