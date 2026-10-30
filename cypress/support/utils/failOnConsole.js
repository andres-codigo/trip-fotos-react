// Messages a test may log without failing. Add a pattern only for noise we cannot fix, with the reason
const ALLOWED_CONSOLE_MESSAGES = []

const METHODS = ['error', 'warn']

// Hooks every window the app loads: a component test mounts into one that already exists, an E2E visit loads a new one
export const failOnConsole = () => {
	let calls = []

	const record = (win) => {
		if (win.__consoleRecorded) return
		win.__consoleRecorded = true

		METHODS.forEach((method) => {
			const original = win.console[method]

			win.console[method] = (...args) => {
				calls.push(`console.${method}: ${args.join(' ')}`)
				original.apply(win.console, args)
			}
		})
	}

	Cypress.on('window:before:load', record)

	beforeEach(() => {
		calls = []
		cy.window({ log: false }).then(record)
	})

	afterEach(() => {
		const unexpected = calls.filter(
			(message) =>
				!ALLOWED_CONSOLE_MESSAGES.some((pattern) =>
					pattern.test(message),
				),
		)

		expect(unexpected, 'unexpected console output').to.deep.equal([])
	})
}
