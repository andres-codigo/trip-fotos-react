import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { PATHS } from '@/constants/ui'

import Header from '@/components/layout/header/Header'

vi.mock('@/components/layout/main-nav/MainNav', () => ({
	default: ({ isLoggedIn }) =>
		isLoggedIn ? <nav aria-label="Main">places</nav> : null,
}))

const createMockStore = (
	userId,
	awaitingVerification = false,
	sessionChecked = true,
) => {
	return configureTestStore({
		reducer: {
			authentication: (
				state = { userId, awaitingVerification, sessionChecked },
			) => state,
		},
	})
}

const renderWithProviders = (userId, awaitingVerification, sessionChecked) => {
	const store = createMockStore(userId, awaitingVerification, sessionChecked)
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
		it('routes to Travellers when signed out', () => {
			const falsyValues = [null, undefined, '']

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

		it.each([PATHS.AUTHENTICATION, PATHS.AUTH_ACTION])(
			'hides Log in on %s, which offers its own way in',
			(path) => {
				window.history.pushState({}, '', path)
				renderWithProviders(null)

				expect(
					screen.queryByRole('link', { name: 'Log in' }),
				).not.toBeInTheDocument()
				window.history.pushState({}, '', '/')
			},
		)

		it('offers no Log in while a saved session is being restored', () => {
			renderWithProviders(null, false, false)

			expect(
				screen.queryByRole('link', { name: 'Log in' }),
			).not.toBeInTheDocument()
		})

		it('hides Log in once signed in', () => {
			renderWithProviders('traveller-uid')

			expect(
				screen.queryByRole('link', { name: 'Log in' }),
			).not.toBeInTheDocument()
		})

		it('routes to Travellers when signed in', () => {
			const truthyValues = ['traveller-uid', 'any-string']

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

	it('shows the places once signed in', async () => {
		renderWithProviders('traveller-uid')

		expect(
			await screen.findByRole('navigation', { name: 'Main' }),
		).toBeInTheDocument()
	})

	it('shows no places while a new account is on Check your inbox', async () => {
		window.history.pushState({}, '', PATHS.AUTHENTICATION)
		renderWithProviders('traveller-uid', true)

		await screen.findByRole('link', { name: 'Trip Fotos Home' })
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(
			screen.queryByRole('navigation', { name: 'Main' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: 'Log in' }),
		).not.toBeInTheDocument()
		window.history.pushState({}, '', '/')
	})
})
