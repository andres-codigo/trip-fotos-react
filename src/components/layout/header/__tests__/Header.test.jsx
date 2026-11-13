import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { PATHS } from '@/constants/ui'

import Header from '@/components/layout/header/Header'

const createMockStore = (token) => {
	return configureTestStore({
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
		// Travellers is public, so the brand leads there signed in or not
		it('routes to Travellers when token is falsy', () => {
			const falsyValues = [null, undefined, '', false, 0]

			falsyValues.forEach((falsyValue) => {
				const { unmount } = renderWithProviders(falsyValue)
				const link = screen.getByRole('link', {
					name: 'Trip Fotos Home',
				})
				expect(link).toHaveAttribute('href', PATHS.TRAVELLERS)
				unmount()
			})
		})

		it('offers Log in to a logged-out visitor', () => {
			renderWithProviders(null)

			expect(
				screen.getByRole('link', { name: 'Log in' }),
			).toHaveAttribute('href', PATHS.AUTHENTICATION)
		})

		it('hides Log in on the login page itself', () => {
			window.history.pushState({}, '', PATHS.AUTHENTICATION)
			renderWithProviders(null)

			expect(
				screen.queryByRole('link', { name: 'Log in' }),
			).not.toBeInTheDocument()
			window.history.pushState({}, '', '/')
		})

		it('hides Log in once signed in', () => {
			renderWithProviders('token')

			expect(
				screen.queryByRole('link', { name: 'Log in' }),
			).not.toBeInTheDocument()
		})

		it('routes to Travellers when token is truthy', () => {
			const truthyValues = ['token', 1, true, 'any-string']

			truthyValues.forEach((truthyValue) => {
				const { unmount } = renderWithProviders(truthyValue)
				const link = screen.getByRole('link', {
					name: 'Trip Fotos Home',
				})
				expect(link).toHaveAttribute('href', PATHS.TRAVELLERS)
				unmount()
			})
		})
	})
})
