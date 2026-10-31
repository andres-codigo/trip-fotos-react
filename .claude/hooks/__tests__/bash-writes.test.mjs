import { writesInRepo } from '../bash-writes.mjs'

const context = { cwd: '/repo', repoRoot: '/repo' }
const writes = (command, overrides = {}) =>
	writesInRepo(command, { ...context, ...overrides })

describe('writesInRepo', () => {
	it.each([
		'echo x > notes.txt',
		'echo x >> src/notes.txt',
		"cat > a.md <<'EOF'\nbody\nEOF",
		'sed -i s/a/b/ README.md',
		"python3 - <<'EOF'\nopen('f','w').write('x')\nEOF",
		"node -e \"require('fs').writeFileSync('f','x')\"",
		'rm -r src/old',
		'cp a.txt b.txt',
		'mv a.txt b.txt',
		'touch new.txt',
		'echo x | tee out.txt',
		'git rm src/old.js',
		'git apply fix.patch',
		'echo x > "$FILE"',
		'echo x > "spaced name.txt"',
		'echo x > /repo/docs/a.md',
	])('flags %j', (command) => {
		expect(writes(command)).toBe(true)
	})

	it.each([
		'git status',
		'ls 2>&1 | grep x',
		'echo x > /dev/null',
		'echo x > /tmp/scratch.txt',
		'cp a.txt /tmp/b.txt',
		'rm /tmp/old.txt',
		'cat src/a.js > ~/.claude/memory.md',
		'echo x > /home/other/notes.md',
		'echo "a > b"',
		'gh issue create --title "t" --body "mentions git rm and sed -i"',
		'gh pr create --body "$(cat <<\'EOF\'\nuses git rm and > redirects\nEOF\n)"',
		"gh pr list --json n -q '.[]|select(.n>1)'",
	])('allows %j', (command) => {
		expect(writes(command, { cwd: '/repo' })).toBe(false)
	})

	it('still flags in-repo writes when the repository lives under /tmp', () => {
		const inTmp = { cwd: '/tmp/clone', repoRoot: '/tmp/clone' }
		expect(writes('echo x > notes.txt', inTmp)).toBe(true)
		expect(writes('echo x > /tmp/other/notes.txt', inTmp)).toBe(false)
	})

	it('resolves relative targets against the working directory', () => {
		expect(writes('echo x > out.txt', { cwd: '/elsewhere' })).toBe(false)
		expect(writes('echo x > ../repo/out.txt', { cwd: '/repo/src' })).toBe(
			true,
		)
	})
})
