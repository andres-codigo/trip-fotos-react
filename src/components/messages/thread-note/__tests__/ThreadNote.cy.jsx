import { THREAD_NOTE_SELECTORS } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ThreadNote from '@/components/messages/thread-note/ThreadNote'

const mountNote = (props) =>
	cy.mount(
		<main className="w-[390px]">
			<ThreadNote {...props} />
		</main>,
	)

describe('<ThreadNote />', () => {
	it('shows the former note in muted text with the title in text colour', () => {
		mountNote({ status: SENDER_STATUS.FORMER })

		cy.get(THREAD_NOTE_SELECTORS.ROOT)
			.should('have.css', 'color', 'rgb(181, 175, 159)')
			.and('have.css', 'border-top-width', '1px')
			.find('strong')
			.should('have.css', 'color', 'rgb(239, 233, 218)')
		cy.checkA11y()
	})

	it('wraps a long email and starts the 44px Reply by email pill at the left', () => {
		mountNote({
			status: SENDER_STATUS.LEGACY,
			email: `${'a'.repeat(60)}@example.com`,
			message: 'Hello',
		})

		cy.get(THREAD_NOTE_SELECTORS.EMAIL).then(($email) => {
			expect($email[0].scrollWidth).to.be.at.most($email[0].clientWidth)
		})
		cy.get(THREAD_NOTE_SELECTORS.REPLY_BY_EMAIL).then(($link) => {
			const link = $link[0].getBoundingClientRect()
			const root = Cypress.$(
				THREAD_NOTE_SELECTORS.ROOT,
			)[0].getBoundingClientRect()
			expect(link.height).to.be.at.least(44)
			expect(link.left - root.left).to.be.closeTo(14, 1)
			expect(link.width).to.be.lessThan(root.width / 2)
		})
		cy.checkA11y()
	})
})
