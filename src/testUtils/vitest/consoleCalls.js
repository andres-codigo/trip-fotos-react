import { format } from 'node:util'

// Returns the console calls whose message no allow-list pattern matches
export const findUnexpectedCalls = (callsByMethod, allowedMessages = []) =>
	Object.entries(callsByMethod).flatMap(([method, calls]) =>
		calls
			.map((args) => ({ method, message: format(...args) }))
			.filter(
				({ message }) =>
					!allowedMessages.some((pattern) => pattern.test(message)),
			),
	)

export const describeUnexpectedCalls = (unexpected) =>
	`Unexpected console output:\n${unexpected
		.map(({ method, message }) => `console.${method}: ${message}`)
		.join('\n')}`
