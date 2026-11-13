import { HEADER_SELECTORS } from '@/constants/test'

import { PATHS } from '@/constants/ui'

import { headerAssertions } from './test-utilities/headerTestHelpers'

import Header from '@/components/layout/header/Header'

describe('<Header />', () => {
	describe('Rendering tests', () => {
		describe('Not logged in', () => {
			it('renders correctly for not logged in users on mobile, tablet, and desktop', () => {
				cy.createMockStore(null).then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.setViewportToMobile()
					headerAssertions(PATHS.TRAVELLERS, false, false, false)

					cy.setViewportToTablet()
					headerAssertions(PATHS.TRAVELLERS, false, false, false)

					cy.setViewportToDesktop()
					headerAssertions(PATHS.TRAVELLERS, false, false, false)
				})
			})
		})

		describe('Logged in', () => {
			it('renders correctly for logged in users on mobile, tablet, and desktop', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)

					cy.setViewportToMobile()
					headerAssertions(PATHS.TRAVELLERS, true, false, true)

					cy.setViewportToTablet()
					headerAssertions(PATHS.TRAVELLERS, true, true, true)

					cy.setViewportToDesktop()
					headerAssertions(PATHS.TRAVELLERS, true, true, true)
				})
			})
		})
	})

	describe('Behaviour tests', () => {
		describe('Not logged in', () => {
			// Travellers is public, so the brand leads there signed in or not
			it('renders the site title link with the "/travellers" href and label', () => {
				cy.createMockStore(null).then((store) => {
					cy.mountWithProviders(<Header />, store)
					cy.get(`${HEADER_SELECTORS.SITE_HEADER_TITLE_LINK} a`)
						.should('have.attr', 'href', PATHS.TRAVELLERS)
						.and('have.attr', 'aria-label', 'Trip Fotos Home')
						.and('contain.text', 'Trip Fotos')
				})
			})
		})

		describe('Logged in', () => {
			it('renders the site title link with the "/travellers" href and label', () => {
				cy.createMockStore('fake-token').then((store) => {
					cy.mountWithProviders(<Header />, store)
					cy.get(`${HEADER_SELECTORS.SITE_HEADER_TITLE_LINK} a`)
						.should('have.attr', 'href', PATHS.TRAVELLERS)
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

					cy.get('nav').should('have.attr', 'aria-label', 'Main')
				})
			})
		})
	})
})
