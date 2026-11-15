import { VERIFY_EMAIL_CONFIG } from '@/constants/auth'
import { VERIFY_EMAIL_INBOX_SELECTORS } from '@/constants/test'

import VerifyEmailInbox from '@/components/forms/verify-email/VerifyEmailInbox'

const EMAIL = 'a.rather.long.address.that.must.wrap@example-domain.com'

describe('<VerifyEmailInbox />', () => {
	const mount = (props = {}) =>
		cy.mount(
			<VerifyEmailInbox
				email={EMAIL}
				onResend={cy.stub()}
				onCheck={cy.stub()}
				onStartAgain={cy.stub()}
				{...props}
			/>,
		)

	it('has no axe violations with the send-again link', () => {
		mount()
		cy.get(VERIFY_EMAIL_INBOX_SELECTORS.SEND_AGAIN).should('be.visible')
		cy.checkA11y()
	})

	it('has no axe violations with an error, a cooldown and a busy check', () => {
		mount({
			resent: true,
			error: VERIFY_EMAIL_CONFIG.NOT_YET(EMAIL),
			cooldownEndsAt: Date.now() + 60000,
			isChecking: true,
		})
		cy.get(VERIFY_EMAIL_INBOX_SELECTORS.ERROR).should('be.visible')
		cy.checkA11y()
	})

	it('wraps a long email inside the status box at a narrow width', () => {
		cy.viewport(320, 640)
		mount()
		cy.get(VERIFY_EMAIL_INBOX_SELECTORS.STATUS).then(($status) => {
			const box = $status[0].getBoundingClientRect()
			const strong = $status.find('strong')[0].getBoundingClientRect()
			expect(strong.right).to.be.at.most(box.right)
		})
	})

	it('makes the check button full width below 1024px only', () => {
		cy.viewport(1000, 800)
		mount()
		cy.get(VERIFY_EMAIL_INBOX_SELECTORS.CHECK).then(($button) => {
			expect($button.outerWidth()).to.equal($button.parent().width())
		})
		cy.viewport(1280, 800)
		cy.get(VERIFY_EMAIL_INBOX_SELECTORS.CHECK).then(($button) => {
			expect($button.outerWidth()).to.be.lessThan(
				$button.parent().width(),
			)
		})
	})
})
