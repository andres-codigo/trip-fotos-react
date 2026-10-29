import eslintJs from '@eslint/js'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'
import globals from 'globals'
import path from 'node:path'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

import pluginCypress from 'eslint-plugin-cypress'

import vitest from '@vitest/eslint-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const resolvePath = (file) => path.resolve(__dirname, file)
const gitignorePath = resolvePath('../.gitignore')

export default [
	// Cypress global configurations
	pluginCypress.configs.globals,

	// Include `.gitignore` for ignored files
	includeIgnoreFile(gitignorePath),

	// Base ESLint and Prettier configurations
	eslintJs.configs.recommended,
	react.configs.flat.recommended,
	prettierRecommended,

	// Environment settings
	{
		languageOptions: {
			globals: { ...globals.es2022, ...globals.node },
		},
	},

	// Global ignores
	{
		ignores: [
			'**/dist/',
			'**/node_modules/',
			'**/public/',
			'**/.cache/',
			'**/.vscode/',
			'**/*.min.js',
			'**/*.bundle.js',
		],
	},

	// React configurations
	{
		files: ['**/*.{js,jsx}'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2022,
			},
		},
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			// Additional React rules
			...react.configs['jsx-runtime'].rules,
			...reactHooks.configs.recommended.rules,

			'react/jsx-no-target-blank': 'off',
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
			'no-unused-vars': 'warn',
			'react/prop-types': 'error',
			'no-console': ['error', { allow: ['warn', 'error', 'log'] }],
			'no-debugger': 'warn',
		},
		settings: { react: { version: '19' } },
	},

	// Import conventions
	{
		files: ['src/**/*.{js,jsx}'],
		// Loaded by the Cypress E2E webpack bundle, which has no '@/' alias
		ignores: ['src/constants/**', 'src/testUtils/cypress/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '^\\.\\./',
							message:
								"Use the '@/' alias instead of parent-relative imports.",
						},
						{
							// test/selectors and test/utilities are nested barrels in their own right
							regex: '^@/constants/(?!test/(selectors|utilities)$)[^/]+/.+',
							message:
								"Import constants from the subdirectory barrel, e.g. '@/constants/ui'.",
						},
					],
				},
			],
		},
	},

	// cypress
	{
		plugins: { pluginCypress },
		files: ['**/*.cy.{js,jsx}'],
		ignores: ['cypress.config.js', '**/*.test.js', '**/*.test.jsx'],
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

	// Vitest
	{
		files: ['**/*.test.js', '**/*.test.jsx'],
		plugins: { vitest },
		languageOptions: {
			sourceType: 'module',
			globals: { ...globals.node, ...globals.es2022 },
		},
		rules: {
			...vitest.configs.recommended.rules,
			'vitest/no-focused-tests': 'warn',
			'react/display-name': 'off',
			'react/prop-types': 'off',
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'vitest/expect-expect': [
				'error',
				{
					assertFunctionNames: [
						'expect',
						'expectErrorDialog',
						'expectNoErrorDialog',
					],
				},
			],
		},
	},
]
