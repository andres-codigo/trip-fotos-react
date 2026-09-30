import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const bin = (name) => path.join(projectDir, 'node_modules', '.bin', name)

const input = JSON.parse(readFileSync(0, 'utf8'))
const filePath = input.tool_input?.file_path

if (!filePath) process.exit(0)

const relativePath = path.relative(projectDir, path.resolve(filePath))

if (relativePath.startsWith('..') || relativePath.includes('node_modules'))
	process.exit(0)

const run = (command, args) =>
	spawnSync(bin(command), args, { cwd: projectDir, encoding: 'utf8' })

run('prettier', ['--write', '--ignore-unknown', relativePath])

if (!/\.(js|jsx|mjs)$/.test(relativePath)) process.exit(0)

const eslint = run('eslint', ['--fix', '--no-warn-ignored', relativePath])

if (eslint.status !== 0) {
	// Exit code 2 feeds stderr back to Claude so it fixes what --fix could not
	process.stderr.write(
		`ESLint errors remain in ${relativePath}:\n${eslint.stdout}${eslint.stderr}`,
	)
	process.exit(2)
}
