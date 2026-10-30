import { afterEach, beforeEach, vi } from 'vitest'

import { describeUnexpectedCalls, findUnexpectedCalls } from './consoleCalls'

// Messages a test may log without failing. Add a pattern only for noise we cannot fix, with the reason
const ALLOWED_MESSAGES = []

const METHODS = ['error', 'warn']

let spies = {}

beforeEach(() => {
	spies = Object.fromEntries(
		METHODS.map((method) => [
			method,
			vi.spyOn(console, method).mockImplementation(() => {}),
		]),
	)
})

afterEach(() => {
	const callsByMethod = Object.fromEntries(
		METHODS.map((method) => [method, spies[method].mock.calls]),
	)
	const unexpected = findUnexpectedCalls(callsByMethod, ALLOWED_MESSAGES)

	METHODS.forEach((method) => spies[method].mockRestore())

	if (unexpected.length) {
		throw new Error(describeUnexpectedCalls(unexpected))
	}
})
