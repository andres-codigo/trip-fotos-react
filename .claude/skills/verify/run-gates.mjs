import { execSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
// node_modules is gitignored and shared by every worktree that links it, so the cache survives branch switches
const cacheDir = path.join(projectDir, 'node_modules', '.cache', 'verify')
const cacheFile = path.join(cacheDir, 'passed.json')

const GATES = {
	lint: {
		command: 'npm run lint',
		summary: /(\d+ problems?.*)/,
		// ESLint prints the file path, then indented line:column entries under it
		failure: /^\/\S+\.\w+$|^\s*\d+:\d+\s+(error|warning)/,
	},
	vitest: {
		command: 'npm run vitest:run',
		summary: /Tests\s+(.*)/,
		failure: /FAIL|AssertionError|Error:|❯ \S+:\d+:\d+/,
	},
	ct: {
		command: 'npm run cy:run:ct',
		summary: /(All specs passed!.*|\d+ of \d+ failed.*)/,
		failure: /^\s*\d+\) |AssertionError|Error:|✖/,
	},
	build: {
		command: 'npm run build',
		summary: /(built in .*)/,
		failure: /error|Error/,
	},
	e2e: {
		command: 'node .claude/skills/verify/run-e2e.mjs',
		summary: /(All specs passed!.*|\d+ of \d+ failed.*)/,
		failure: /^\s*\d+\) |AssertionError|Error:|✖|ECONNREFUSED/,
	},
}

const MAX_FAILURE_LINES = 20

const args = process.argv.slice(2)
const fresh = args.includes('fresh')
const requested = args.filter((arg) => arg in GATES)

// Hashing the working tree through a throwaway index covers uncommitted and untracked files, so any edit busts the cache
const treeHash = () => {
	const index = path.join(os.tmpdir(), `verify-index-${process.pid}`)
	const env = { ...process.env, GIT_INDEX_FILE: index }
	try {
		execSync('git add -A', { cwd: projectDir, env })
		return execSync('git write-tree', {
			cwd: projectDir,
			env,
			encoding: 'utf8',
		}).trim()
	} finally {
		fs.rmSync(index, { force: true })
	}
}

const readCache = () => {
	try {
		return JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
	} catch {
		return {}
	}
}

const hash = treeHash()
const cache = readCache()
const passed = new Set(
	!fresh && cache.tree === hash ? (cache.passed ?? []) : [],
)

fs.mkdirSync(cacheDir, { recursive: true })

for (const gate of requested) {
	if (passed.has(gate)) {
		console.log(`${gate}: cached (passed on this exact tree)`)
		continue
	}

	const { command, summary, failure } = GATES[gate]
	const result = spawnSync(command, {
		cwd: projectDir,
		shell: true,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
	})
	// Colour codes would stop the summary and failure patterns matching
	const output = stripVTControlCharacters(
		`${result.stdout}\n${result.stderr}`,
	)
	const log = path.join(cacheDir, `${gate}.log`)
	fs.writeFileSync(log, output)

	const lines = output.split('\n')
	const summaryLine =
		lines.map((line) => line.match(summary)?.[1]).findLast(Boolean) ?? ''

	if (result.status === 0) {
		passed.add(gate)
		console.log(`${gate}: pass ${summaryLine}`.trim())
	} else {
		console.log(`${gate}: FAIL (exit ${result.status}) ${summaryLine}`)
		lines
			.filter((line) => failure.test(line))
			.slice(0, MAX_FAILURE_LINES)
			.forEach((line) => console.log(`  ${line.trim()}`))
		console.log(`  full log: ${log}`)
	}
}

fs.writeFileSync(
	cacheFile,
	JSON.stringify({ tree: hash, passed: [...passed] }, null, '\t'),
)
