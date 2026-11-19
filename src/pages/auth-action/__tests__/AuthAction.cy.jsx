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
		cy.mountWithProviders(<AuthAction />, store, {
			initialEntries: [
				`${PATHS.AUTH_ACTION}?mode=${mode}&oobCode=${CODE}`,
			],
		})
	}

	// The one integration check: Vitest mocks the auth thunks, so this runs the real REST calls and their error mapping
	describe('Integration through the real auth thunks', () => {
		it('checks the reset code, saves the new password and shows the done card', () => {
			cy.viewport(390, 800)
			cy.intercept('POST', RESET_PASSWORD_URL, (req) => {
				req.alias = req.body.newPassword ? 'save' : 'check'
				req.reply({ email: EMAIL, requestType: 'PASSWORD_RESET' })
			})
			mountPage('resetPassword')

			cy.get(NEW_PASSWORD_FORM_SELECTORS.FOR).should(
				'have.text',
				AUTH_ACTION_CONFIG.RESET_FOR(EMAIL),
			)
			cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
				'secret-password',
			)
			cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()
			cy.wait('@save').its('request.body').should('include', {
				oobCode: CODE,
				newPassword: 'secret-password',
			})

			cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE).should(
				'have.text',
				AUTH_ACTION_CONFIG.RESET_DONE_TITLE,
			)
			cy.get(AUTH_ACTION_PAGE_SELECTORS.TICK).should(
				'have.css',
				'color',
				'rgb(127, 196, 140)',
			)
			cy.get(AUTH_ACTION_PAGE_SELECTORS.VIEW).then(($view) => {
				const view = $view[0]
				const padding =
					parseFloat(getComputedStyle(view).paddingLeft) * 2
				cy.get(AUTH_ACTION_PAGE_SELECTORS.LOG_IN)
					.invoke('outerWidth')
					.should('be.closeTo', view.clientWidth - padding, 1)
			})
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
			cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_ERROR).should(
				'be.visible',
			)
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
			cy.get(AUTH_ACTION_PAGE_SELECTORS.RESET_PASSWORD).should(
				'be.visible',
			)
		})
	})

	const resetCheck = (req) =>
		req.reply({ email: EMAIL, requestType: 'PASSWORD_RESET' })
	const emailChange = (requestType, shown) => () => {
		cy.intercept('POST', RESET_PASSWORD_URL, {
			email: EMAIL,
			newEmail: 'ada.new@example.org',
			requestType,
		})
		cy.intercept('POST', APPLY_CODE_URL, { email: shown })
	}

	;[
		{
			state: 'the new password form',
			mode: 'resetPassword',
			stub: () => cy.intercept('POST', RESET_PASSWORD_URL, resetCheck),
			ready: NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT,
		},
		{
			state: 'the password reset done card',
			mode: 'resetPassword',
			stub: () => cy.intercept('POST', RESET_PASSWORD_URL, resetCheck),
			act: () => {
				cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
					'secret-password',
				)
				cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()
			},
			ready: AUTH_ACTION_PAGE_SELECTORS.TICK,
		},
		{
			state: 'the expired reset link card',
			mode: 'resetPassword',
			stub: () =>
				cy.intercept(
					'POST',
					RESET_PASSWORD_URL,
					firebaseError('EXPIRED_OOB_CODE'),
				),
			ready: AUTH_ACTION_PAGE_SELECTORS.RESET_PASSWORD,
		},
		{
			state: 'the email changed card',
			mode: 'verifyAndChangeEmail',
			stub: emailChange('VERIFY_AND_CHANGE_EMAIL', 'ada.new@example.org'),
			ready: AUTH_ACTION_PAGE_SELECTORS.EMAIL,
		},
		{
			state: 'the email recovered card',
			mode: 'recoverEmail',
			stub: emailChange('RECOVER_EMAIL', EMAIL),
			ready: AUTH_ACTION_PAGE_SELECTORS.EMAIL,
		},
	].forEach(({ state, mode, stub, act, ready }) => {
		it(`has no axe violations on ${state}`, () => {
			cy.viewport(390, 800)
			stub()
			mountPage(mode)
			act?.()
			cy.get(ready).should('be.visible')
			cy.checkA11y()
		})
	})
})
