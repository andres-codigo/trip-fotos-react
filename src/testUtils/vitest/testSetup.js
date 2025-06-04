import { vi } from 'vitest'

export const setupMocks = () => {
	global.fetch = vi.fn()

	Object.defineProperty(global, 'localStorage', {
		value: {
			setItem: vi.fn(),
			getItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
		},
		writable: true,
	})
}
