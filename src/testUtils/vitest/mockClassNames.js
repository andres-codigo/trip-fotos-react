import { vi } from 'vitest'

/**
 * Shared classNames mock utility
 *
 * Provides a consistent mock implementation of the classnames library
 * that handles both string arguments and conditional object arguments.
 *
 * Usage:
 * - Import and use in vi.mock() calls
 * - Can be customized per test with mockImplementation() or mockReturnValue()
 *
 * @returns {Function} Mock function that combines class names like the real classnames library
 */

export const createClassNamesMock = () =>
	vi.fn((...args) =>
		args
			.filter(Boolean)
			.map((arg) => {
				if (typeof arg === 'object' && arg !== null) {
					return Object.entries(arg)
						.filter(([, value]) => Boolean(value))
						.map(([key]) => key)
						.join(' ')
				}
				return arg
			})
			.join(' '),
	)

export default createClassNamesMock
