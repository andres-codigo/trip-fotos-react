import configureTestStore from '@/testUtils/configureTestStore'

import { ACCOUNT_SETTINGS_CONFIG } from '@/constants/auth'
import { ACCOUNT_PAGE_SELECTORS } from '@/constants/test'
import { PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import Account from '@/pages/account/Account'

describe('<Account />', () => {
	const mountPage = () => {
		const store = configureTestStore({
			reducer: {
				authentication: authenticationReducer,
				travellers: travellersReducer,
			},
		})
		cy.mountWithProviders(<Account />, store, {
			initialEntries: [PATHS.ACCOUNT],
		})
	}

	it('renders the Account settings heading', () => {
		mountPage()

		cy.get(ACCOUNT_PAGE_SELECTORS.TITLE).should(
			'have.text',
			ACCOUNT_SETTINGS_CONFIG.TITLE,
		)
		cy.checkA11y()
	})

	// A global section rule (block, 20px side padding) once indented the sections and dropped their gaps
	it('lines the section headings up with the page heading and spaces their rows', () => {
		mountPage()

		cy.get(ACCOUNT_PAGE_SELECTORS.TITLE).then(($title) => {
			const left = $title[0].getBoundingClientRect().left
			;[
				ACCOUNT_PAGE_SELECTORS.EMAIL_SECTION,
				ACCOUNT_PAGE_SELECTORS.PASSWORD_SECTION,
			].forEach((section) => {
				cy.get(`${section} h2`).should(($heading) => {
					expect($heading[0].getBoundingClientRect().left).to.equal(
						left,
					)
				})
			})
		})
		cy.get(`${ACCOUNT_PAGE_SELECTORS.EMAIL_SECTION} h2`).then(
			($heading) => {
				cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL).should(($email) => {
					expect(
						$email[0].getBoundingClientRect().top -
							$heading[0].getBoundingClientRect().bottom,
					).to.be.at.least(12)
				})
			},
		)
	})
})
