import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { urls } from '../../../../../cypress/support/constants'

import { headerAssertions } from './headerTestHelpers'

import Header from '../Header'

import configureStore from 'redux-mock-store'

const mockStore = configureStore([])

describe('<Header />', () => {
	describe('Rendering tests', () => {
		it('renders correctly for not logged in users on mobile, tablet, and desktop', () => {
			const store = mockStore({
				authentication: { token: null },
			})

			cy.mount(
				<Provider store={store}>
					<MemoryRouter>
						<Header />
					</MemoryRouter>
				</Provider>,
			)

			cy.setViewportToMobile()
			headerAssertions(urls.cyAuth, false, false, false)

			cy.setViewportToTablet()
			headerAssertions(urls.cyAuth, false, false, false)

			cy.setViewportToDesktop()
			headerAssertions(urls.cyAuth, false, false, false)
		})

		it('renders correctly for logged in users on mobile, tablet, and desktop', () => {
			const store = mockStore({
				authentication: { token: 'fake-token' },
			})

			cy.mount(
				<Provider store={store}>
					<MemoryRouter>
						<Header />
					</MemoryRouter>
				</Provider>,
			)

			cy.setViewportToMobile()
			headerAssertions(urls.cyTrips, true, false, true)

			cy.setViewportToTablet()
			headerAssertions(urls.cyTrips, true, true, true)

			cy.setViewportToDesktop()
			headerAssertions(urls.cyTrips, true, true, true)
		})
	})

	describe('Behaviour tests', () => {})

	describe('Accessibility tests', () => {})
})
