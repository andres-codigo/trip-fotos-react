import { headerSelectors } from '../../../../../cypress/support/constants/selectors'
import { urls } from '../../../../../cypress/support/constants/urls'

import { PATHS } from '@/constants/paths'

import { headerAssertions } from './test-utilities/headerTestHelpers'

import Header from '../Header'

describe('<Header />', () => {
	describe('Rendering tests', () => {
		describe('Not logged in', () => {
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
		})

		describe('Logged in', () => {
			it('renders correctly for logged in users on mobile, tablet, and desktop', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.setViewportToMobile()
					headerAssertions(urls.cyHome, true, false, true)

					cy.setViewportToTablet()
					headerAssertions(urls.cyHome, true, true, true)

					cy.setViewportToDesktop()
					headerAssertions(urls.cyHome, true, true, true)
				})
			})
		})
	})

	describe('Behaviour tests', () => {
		describe('Not logged in', () => {
			it('renders the site title link with the "/authentication" href and label', () => {
				cy.createMockStore(null).then((store) => {
					cy.mountWithProviders(<Header />, store)
					cy.get(`${headerSelectors.siteHeaderTitleLink} a`)
						.should('have.attr', 'href', PATHS.AUTHENTICATION)
						.and('have.attr', 'aria-label', 'Trip Fotos Home')
						.and('contain.text', 'Trip Fotos')
				})
			})
		})

		describe('Logged in', () => {
			it('renders the site title link with the "/" href and label', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)
					cy.get(`${headerSelectors.siteHeaderTitleLink} a`)
						.should('have.attr', 'href', PATHS.HOME)
						.and('have.attr', 'aria-label', 'Trip Fotos Home')
						.and('contain.text', 'Trip Fotos')
				})
			})
		})
	})

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
