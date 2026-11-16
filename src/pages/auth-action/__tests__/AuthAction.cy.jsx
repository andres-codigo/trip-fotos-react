import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { AUTH_ACTION_CONFIG } from '@/constants/auth'
import {
	AUTH_ACTION_PAGE_SELECTORS,
	NEW_PASSWORD_FORM_SELECTORS,
} from '@/constants/test'
import { PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import AuthAction from '@/pages/auth-action/AuthAction'

const CODE = 'one-time-code'
const EMAIL = 'ada@example.com'
const RESET_PASSWORD_URL = '**/accounts:resetPassword*'
const APPLY_CODE_URL = '**/accounts:update*'

const firebaseError = (message) => ({
	statusCode: 400,
	body: { error: { code: 400, message } },
})

describe('<AuthAction />', () => {
	const mountPage = (mode) => {
		const store = configureTestStore({
			reducer: {
				authentication: authenticationReducer,
				travellers: travellersReducer,
			},
		})
		cy.mount(
			<Provider store={store}>
				<MemoryRouter
					initialEntries={[
						`${PATHS.AUTH_ACTION}?mode=${mode}&oobCode=${CODE}`,
					]}>
					<AuthAction />
				</MemoryRouter>
			</Provider>,
		)
	}

	it('checks the reset code, saves the new password and shows the done card', () => {
		cy.viewport(390, 800)
		cy.intercept('POST', RESET_PASSWORD_URL, (req) => {
			req.alias = req.body.newPassword ? 'save' : 'check'
			req.reply({ email: EMAIL, requestType: 'PASSWORD_RESET' })
		})
		mountPage('resetPassword')

		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).should('have.focus')
		cy.get(NEW_PASSWORD_FORM_SELECTORS.FOR).should(
			'have.text',
			AUTH_ACTION_CONFIG.RESET_FOR(EMAIL),
		)
		cy.checkA11y()

		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
			'secret-password',
		)
		cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()
		cy.wait('@save').its('request.body').should('include', {
			oobCode: CODE,
			newPassword: 'secret-password',
		})

		cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE)
			.should('have.text', AUTH_ACTION_CONFIG.RESET_DONE_TITLE)
			.and('have.focus')
		cy.get(AUTH_ACTION_PAGE_SELECTORS.TICK).should(
			'have.css',
			'color',
			'rgb(127, 196, 140)',
		)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.VIEW).then(($view) => {
			const view = $view[0]
			const padding = parseFloat(getComputedStyle(view).paddingLeft) * 2
			cy.get(AUTH_ACTION_PAGE_SELECTORS.LOG_IN)
				.invoke('outerWidth')
				.should('be.closeTo', view.clientWidth - padding, 1)
		})
		cy.checkA11y()
	})

	it('shows a weak password the server refuses as the field error', () => {
		cy.intercept('POST', RESET_PASSWORD_URL, (req) => {
			if (req.body.newPassword) {
				req.reply(
					firebaseError(
						'WEAK_PASSWORD : Password should be at least 6 characters',
					),
				)
				return
			}
			req.reply({ email: EMAIL, requestType: 'PASSWORD_RESET' })
		})
		mountPage('resetPassword')

		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
			'secret-password',
		)
		cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()
		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_ERROR).should('be.visible')
		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).should('have.focus')
	})

	it('offers a new reset link for an expired code', () => {
		cy.intercept(
			'POST',
			RESET_PASSWORD_URL,
			firebaseError('EXPIRED_OOB_CODE'),
		)
		mountPage('resetPassword')

		cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE).should(
			'have.text',
			AUTH_ACTION_CONFIG.RESET_EXPIRED_TITLE,
		)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.RESET_PASSWORD).should('be.visible')
		cy.checkA11y()
	})

	it('verifies the email and asks a signed-out user to log in', () => {
		cy.intercept('POST', APPLY_CODE_URL, { email: EMAIL }).as('apply')
		mountPage('verifyEmail')

		cy.wait('@apply').its('request.body.oobCode').should('eq', CODE)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE).should(
			'have.text',
			AUTH_ACTION_CONFIG.VERIFIED_TITLE,
		)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.LOG_IN).should('be.visible')
		cy.checkA11y()
	})

	it('shows the network alert with Try again when the link cannot be checked', () => {
		cy.intercept('POST', APPLY_CODE_URL, { forceNetworkError: true })
		mountPage('verifyEmail')

		cy.get(AUTH_ACTION_PAGE_SELECTORS.ALERT).should(
			'contain.text',
			AUTH_ACTION_CONFIG.NETWORK_TEXT,
		)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.TRY_AGAIN).should('be.visible')
		cy.checkA11y()
	})

	;[
		{
			mode: 'verifyAndChangeEmail',
			requestType: 'VERIFY_AND_CHANGE_EMAIL',
			title: AUTH_ACTION_CONFIG.EMAIL_CHANGED_TITLE,
			shown: 'ada.new@example.org',
		},
		{
			mode: 'recoverEmail',
			requestType: 'RECOVER_EMAIL',
			title: AUTH_ACTION_CONFIG.EMAIL_RECOVERED_TITLE,
			shown: EMAIL,
		},
	].forEach(({ mode, requestType, title, shown }) => {
		it(`applies a ${mode} link and names the address now in use`, () => {
			cy.viewport(390, 800)
			cy.intercept('POST', RESET_PASSWORD_URL, {
				email: EMAIL,
				newEmail: 'ada.new@example.org',
				requestType,
			}).as('check')
			cy.intercept('POST', APPLY_CODE_URL, { email: shown }).as('apply')
			mountPage(mode)

			cy.wait('@check')
			cy.wait('@apply').its('request.body.oobCode').should('eq', CODE)
			cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE)
				.should('have.text', title)
				.and('have.focus')
			cy.get(AUTH_ACTION_PAGE_SELECTORS.EMAIL).should('have.text', shown)
			cy.get(AUTH_ACTION_PAGE_SELECTORS.LOG_IN).should('be.visible')
			cy.checkA11y()
		})
	})
})
