import { urls, headerSelectors } from '../../../../../cypress/support/constants'

import { headerAssertions } from './headerTestHelpers'

import Header from '../Header'

describe('<Header />', () => {
	describe('Rendering tests', () => {
		it('renders correctly for not logged in users on mobile, tablet, and desktop', () => {
			cy.createMockStore(null).then((store) => {
				cy.mountWithProviders(<Header />, store)

				cy.setViewportToMobile()
				headerAssertions(urls.cyAuth, false, false, false)

				cy.setViewportToTablet()
				headerAssertions(urls.cyAuth, false, false, false)

				cy.setViewportToDesktop()
				headerAssertions(urls.cyAuth, false, false, false)
			})
		})

		it('renders correctly for logged in users on mobile, tablet, and desktop', () => {
			cy.createMockStore('fake-token').then((store) => {
				cy.mountWithProviders(<Header />, store)

				cy.setViewportToMobile()
				headerAssertions(urls.cyTrips, true, false, true)

				cy.setViewportToTablet()
				headerAssertions(urls.cyTrips, true, true, true)

				cy.setViewportToDesktop()
				headerAssertions(urls.cyTrips, true, true, true)
			})
		})
	})

	describe('Behaviour tests', () => {})

	describe('Accessibility tests', () => {
		describe('Not logged in', () => {
			it('has accessibility labels on header', () => {
				cy.createMockStore(null).then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.get(headerSelectors.siteHeader)
						.should('have.attr', 'role', 'banner')
						.and('have.attr', 'aria-label', 'Site header')

					cy.get(`${headerSelectors.siteHeaderTitleLink} a`).should(
						'have.attr',
						'aria-label',
						'Trip Fotos Home',
					)
				})
			})
		})

		describe('Logged in', () => {
			it('has accessibility labels on header and navigation', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.get(headerSelectors.siteHeader)
						.should('have.attr', 'role', 'banner')
						.and('have.attr', 'aria-label', 'Site header')

					cy.get(`${headerSelectors.siteHeaderTitleLink} a`).should(
						'have.attr',
						'aria-label',
						'Trip Fotos Home',
					)

					cy.get('nav').should(
						'have.attr',
						'aria-label',
						'Top navigation',
					)
				})
			})
		})
	})
})
