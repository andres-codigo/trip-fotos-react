import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import { PATHS } from '@/constants/paths'

/**
 * Header Unit Tests
 *
 * Mocks:
 * - Redux Store: Creates mock store with authentication slice containing token state
 *
 * Router: Tests wrap component in BrowserRouter since Header uses Link components for navigation
 *
 * Test Strategy:
 * - Tests conditional routing logic based on authentication token state
 * - Verifies falsy token values route to authentication page
 * - Verifies truthy token values route to home page
 * - Uses unmount() between test iterations to prevent DOM conflicts
 */

import Header from '../Header'

const createMockStore = (token) => {
	return configureStore({
		reducer: {
			authentication: (state = { token }) => state,
		},
	})
}

const renderWithProviders = (token) => {
	const store = createMockStore(token)
	return render(
		<Provider store={store}>
			<BrowserRouter>
				<Header />
			</BrowserRouter>
		</Provider>,
	)
}

describe('<Header />', () => {
	afterEach(() => {
		vi.resetModules()
	})
	describe('Behaviour tests', () => {
		it('routes to authentication page when token is falsy', () => {
			const falsyValues = [null, undefined, '', false, 0]

			falsyValues.forEach((falsyValue) => {
				const { unmount } = renderWithProviders(falsyValue)
				const link = screen.getByRole('link', {
					name: 'Trip Fotos Home',
				})
				expect(link).toHaveAttribute('href', PATHS.AUTHENTICATION)
				unmount()
			})
		})

		it('routes to home page when token is truthy', () => {
			const truthyValues = ['token', 1, true, 'any-string']

			truthyValues.forEach((truthyValue) => {
				const { unmount } = renderWithProviders(truthyValue)
				const link = screen.getByRole('link', {
					name: 'Trip Fotos Home',
				})
				expect(link).toHaveAttribute('href', PATHS.HOME)
				unmount()
			})
		})
	})
})
