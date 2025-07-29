import eslintJs from '@eslint/js'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import path from 'node:path'

import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

import pluginCypress from 'eslint-plugin-cypress/flat'

import vitest from '@vitest/eslint-plugin'

import languageOptions from './rules/language-options.js'
import reactRules from './rules/react.js'
import cypressRules from './rules/cypress.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: eslintJs.configs.recommended,
})

const resolvePath = (file) => path.resolve(__dirname, file)
const gitignorePath = resolvePath('.gitignore')

export default [
	// Cypress global configurations
	pluginCypress.configs.globals,

	// Include `.gitignore` for ignored files
	includeIgnoreFile(gitignorePath),

	// Base ESLint and Prettier configurations
	...compat.extends(
		'eslint:recommended',
		'plugin:react/recommended',
		'plugin:prettier/recommended',
	),

	// Environment settings
	...compat.env({
		es2022: true,
		node: true,
		vitest: true,
	}),

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
		languageOptions,
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			// Additional React rules
			...react.configs['jsx-runtime'].rules,
			...reactHooks.configs.recommended.rules,

			// Custom project rules
			...reactRules,
		},
		settings: { react: { version: '19' } },
	},

	// cypress
	{
		plugins: { pluginCypress },
		files: ['**/*.spec.cy.js'],
		ignores: ['cypress.config.js', '**/*.test.js', '**/*.test.jsx'],
		languageOptions: {
			sourceType: 'module',
			globals: { ...globals.node, ...globals.amd },
		},
		rules: cypressRules,
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
		},
	},
]
