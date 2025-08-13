import { configure } from '@testing-library/react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Configure testing library
configure({ testIdAttribute: 'data-cy' })

// Setup mocks
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

// Auto-run mocks setup
setupMocks()
