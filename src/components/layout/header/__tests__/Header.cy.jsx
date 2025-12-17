import { HEADER_SELECTORS } from '../../../../../cypress/support/constants/selectors/components'

import { PATHS } from '@/constants/ui'

import { headerAssertions } from './test-utilities/headerTestHelpers'

import Header from '../Header'

describe('<Header />', () => {
	describe('Rendering tests', () => {
		describe('Not logged in', () => {
			it('renders correctly for not logged in users on mobile, tablet, and desktop', () => {
				cy.createMockStore(null).then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.setViewportToMobile()
					headerAssertions(PATHS.AUTHENTICATION, false, false, false)

					cy.setViewportToTablet()
					headerAssertions(PATHS.AUTHENTICATION, false, false, false)

					cy.setViewportToDesktop()
					headerAssertions(PATHS.AUTHENTICATION, false, false, false)
				})
			})
		})

		describe('Logged in', () => {
			it('renders correctly for logged in users on mobile, tablet, and desktop', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.setViewportToMobile()
					headerAssertions(PATHS.HOME, true, false, true)

					cy.setViewportToTablet()
					headerAssertions(PATHS.HOME, true, true, true)

					cy.setViewportToDesktop()
					headerAssertions(PATHS.HOME, true, true, true)
				})
			})
		})
	})

	describe('Behaviour tests', () => {
		describe('Not logged in', () => {
			it('renders the site title link with the "/authentication" href and label', () => {
				cy.createMockStore(null).then((store) => {
					cy.mountWithProviders(<Header />, store)
					cy.get(`${HEADER_SELECTORS.SITE_HEADER_TITLE_LINK} a`)
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
					cy.get(`${HEADER_SELECTORS.SITE_HEADER_TITLE_LINK} a`)
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

					cy.get(HEADER_SELECTORS.SITE_HEADER)
						.should('have.attr', 'role', 'banner')
						.and('have.attr', 'aria-label', 'Site header')

					cy.get(
						`${HEADER_SELECTORS.SITE_HEADER_TITLE_LINK} a`,
					).should('have.attr', 'aria-label', 'Trip Fotos Home')
				})
			})
		})

		describe('Logged in', () => {
			it('has accessibility labels on header and navigation', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.get(HEADER_SELECTORS.SITE_HEADER)
						.should('have.attr', 'role', 'banner')
						.and('have.attr', 'aria-label', 'Site header')

					cy.get(
						`${HEADER_SELECTORS.SITE_HEADER_TITLE_LINK} a`,
					).should('have.attr', 'aria-label', 'Trip Fotos Home')

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
