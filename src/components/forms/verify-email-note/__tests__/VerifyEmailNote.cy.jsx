import { VERIFY_EMAIL_PROMPT_CONFIG } from '@/constants/auth'
import { VIEWPORTS } from '@/constants/config'
import { VERIFY_EMAIL_NOTE_SELECTORS } from '@/constants/test'

import VerifyEmailNote from '@/components/forms/verify-email-note/VerifyEmailNote'

const SIZES = [
	['mobile', VIEWPORTS.MOBILE],
	['desktop', VIEWPORTS.DESKTOP],
]

describe('<VerifyEmailNote />', () => {
	const mount = (props = {}) =>
		cy
			.createMockStore(true)
			.then((store) =>
				cy.mountWithProviders(<VerifyEmailNote {...props} />, store),
			)

	SIZES.forEach(([name, { WIDTH, HEIGHT }]) => {
		describe(`at ${name} width`, () => {
			beforeEach(() => {
				cy.viewport(WIDTH, HEIGHT)
			})

			it('has no axe violations as a card, idle and after a failed send', () => {
				mount({ text: VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE })
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.TITLE).should(
					'have.text',
					VERIFY_EMAIL_PROMPT_CONFIG.NOTE_TITLE,
				)
				cy.checkA11y()
				// No signed-in Firebase user in a component test, so the send fails
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.SEND_AGAIN).click()
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.MESSAGE).should(
					'have.text',
					VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT,
				)
				cy.checkA11y()
			})

			it('has no axe violations as a bar, idle and after a check', () => {
				mount({ variant: 'bar' })
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.TITLE).should(
					'have.text',
					VERIFY_EMAIL_PROMPT_CONFIG.REPLY_NOTE_TITLE,
				)
				cy.checkA11y()
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.CHECK).click()
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.MESSAGE).should(
					'have.text',
					VERIFY_EMAIL_PROMPT_CONFIG.NOT_YET,
				)
				cy.checkA11y()
			})

			it('keeps both links 44px high and inside the note', () => {
				mount({ text: VERIFY_EMAIL_PROMPT_CONFIG.EDIT_NOTE })
				cy.get(VERIFY_EMAIL_NOTE_SELECTORS.ROOT).then(($root) => {
					const box = $root[0].getBoundingClientRect()
					;[
						VERIFY_EMAIL_NOTE_SELECTORS.SEND_AGAIN,
						VERIFY_EMAIL_NOTE_SELECTORS.CHECK,
					].forEach((selector) => {
						const link = $root
							.find(selector)[0]
							.getBoundingClientRect()
						expect(link.height).to.be.at.least(44)
						expect(link.right).to.be.at.most(box.right)
					})
				})
			})
		})
	})
})
