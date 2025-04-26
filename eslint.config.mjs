import eslintJs from '@eslint/js';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import { includeIgnoreFile } from '@eslint/compat';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import pluginCypress from 'eslint-plugin-cypress/flat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: eslintJs.configs.recommended,
});
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
	pluginCypress.configs.globals,
	includeIgnoreFile(gitignorePath),
	...compat.extends(
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:prettier/recommended',
	),
	...compat.env({
		es2020: true,
		node: true,
		vitest: true,
	}),
	{
		ignores: ['dist/'],
	},
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2020,
			},
			parserOptions: {
				jsx: true,
			},
		},
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			...eslintJs.configs.recommended.rules,
			...react.configs.recommended.rules,
			...react.configs['jsx-runtime'].rules,
			...reactHooks.configs.recommended.rules,
			'react/jsx-no-target-blank': 'off',
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
			'no-unused-vars': 'warn',
			'react/prop-types': 'error',
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'no-debugger': 'warn',
			'prettier/prettier': 'error',
			quotes: ['error', 'single'],
		},
		settings: { react: { version: '19' } },
	},
	// cypress
	{
		plugins: { pluginCypress },
		files: ['**/*.spec.cy.js'],
		ignores: ['cypress.config.js'],
		languageOptions: {
			sourceType: 'module',
			globals: { ...globals.node, ...globals.amd },
		},
		rules: {
			// https://github.com/cypress-io/eslint-plugin-cypress
			'cypress/no-assigning-return-values': 'error',
			'cypress/no-unnecessary-waiting': 'error',
			'cypress/assertion-before-screenshot': 'warn',
			'cypress/no-force': 'warn',
			'cypress/no-async-tests': 'error',
			'cypress/no-async-before': 'error',
			'cypress/no-pause': 'error',
		},
	},
];
