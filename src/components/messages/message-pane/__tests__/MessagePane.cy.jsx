import {
	MESSAGE_ACTIONS_SELECTORS,
	MESSAGE_PANE,
	MESSAGE_PANE_SELECTORS,
	MOCK_INBOX,
} from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import MessagePane from '@/components/messages/message-pane/MessagePane'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const DELETE_ERROR = 'This message could not be deleted.'
const LONG_MESSAGE = 'Lisbon trams and miradouros at sunset. '.repeat(40)

const travellerProps = {
	id: SAMPLE_MESSAGE_ONE.id,
	senderId: SAMPLE_MESSAGE_ONE.senderId,
	senderName: SAMPLE_MESSAGE_ONE.senderName,
	senderStatus: SAMPLE_MESSAGE_ONE.senderStatus,
	message: SAMPLE_MESSAGE_ONE.message,
	createdAt: SAMPLE_MESSAGE_ONE.createdAt,
}

const legacyProps = {
	id: SAMPLE_MESSAGE_TWO.id,
	senderId: SAMPLE_MESSAGE_TWO.senderId,
	senderName: SAMPLE_MESSAGE_TWO.senderName,
	createdAt: SAMPLE_MESSAGE_TWO.createdAt,
	senderStatus: SAMPLE_MESSAGE_TWO.senderStatus,
	userEmail: SAMPLE_MESSAGE_TWO.userEmail,
	message: SAMPLE_MESSAGE_TWO.message,
}

describe('<MessagePane />', () => {
	const mountPane = (props = {}) => {
		const onDelete = cy.stub().as('onDelete')
		const onRetry = cy.stub().as('onRetry')

		cy.viewport(1024, 768)
		cy.createMockStore('mock-token').then((store) => {
			cy.mountWithProviders(
				<main>
					<div className="w-[640px] p-4">
						<MessagePane
							{...travellerProps}
							onDelete={onDelete}
							onRetry={onRetry}
							{...props}
						/>
					</div>
				</main>,
				store,
			)
		})
	}

	describe('Unread', () => {
		it('shows the sender link, New tag, full time and Reply, and passes a11y', () => {
			mountPane({ isNew: true })

			cy.get(MESSAGE_PANE_SELECTORS.SENDER_LINK).should(
				'contain',
				SAMPLE_MESSAGE_ONE.senderName,
			)
			cy.get(MESSAGE_PANE_SELECTORS.NEW_TAG).should('be.visible')
			cy.get(MESSAGE_PANE_SELECTORS.TIME).should('be.visible')
			cy.get(MESSAGE_ACTIONS_SELECTORS.REPLY).should('be.visible')
			cy.checkA11y()
		})
	})

	describe('Layout', () => {
		it('fills its container and shows a long message unclamped', () => {
			mountPane({ message: LONG_MESSAGE })

			cy.get(MESSAGE_PANE_SELECTORS.ROOT).then(($pane) => {
				expect($pane[0].getBoundingClientRect().width).to.be.closeTo(
					640 - 32,
					1,
				)
			})
			cy.get(MESSAGE_PANE_SELECTORS.TEXT).then(($text) => {
				expect($text[0].scrollHeight).to.equal($text[0].clientHeight)
			})
		})

		it('puts the full time at the end of the heading line', () => {
			mountPane()

			cy.get(MESSAGE_PANE_SELECTORS.ROOT).then(($pane) => {
				const pane = $pane[0].getBoundingClientRect()
				const time = $pane
					.find(MESSAGE_PANE_SELECTORS.TIME)[0]
					.getBoundingClientRect()
				const heading = $pane
					.find(MESSAGE_PANE_SELECTORS.SENDER)[0]
					.getBoundingClientRect()
				expect(pane.right - time.right).to.be.closeTo(17, 1)
				expect(time.top).to.be.lessThan(heading.bottom)
			})
		})
	})

	describe('Heading focus', () => {
		it('can take focus programmatically', () => {
			mountPane()

			cy.get(MESSAGE_PANE_SELECTORS.SENDER).focus()
			cy.focused().should('have.attr', 'data-cy', MESSAGE_PANE.SENDER)
		})
	})

	describe('Legacy', () => {
		it('shows the email and Reply by email, and passes a11y', () => {
			mountPane(legacyProps)

			cy.get(MESSAGE_PANE_SELECTORS.SENDER).should(
				'contain',
				SAMPLE_MESSAGE_TWO.userEmail,
			)
			cy.get(MESSAGE_ACTIONS_SELECTORS.REPLY).should(
				'contain',
				MESSAGES_CONFIG.REPLY_BY_EMAIL,
			)
			cy.get(MESSAGE_PANE_SELECTORS.TIME).should('not.exist')
			cy.checkA11y()
		})
	})

	describe('Delete error', () => {
		it('shows the error alert in the pane and Try again calls onRetry', () => {
			mountPane({ deleteError: DELETE_ERROR })

			cy.get(MESSAGE_PANE_SELECTORS.ROOT)
				.find(MESSAGE_ACTIONS_SELECTORS.DELETE_ERROR)
				.should('be.visible')
			cy.checkA11y()
			cy.get(MESSAGE_ACTIONS_SELECTORS.TRY_AGAIN).click()
			cy.get('@onRetry').should(
				'have.been.calledOnceWith',
				SAMPLE_MESSAGE_ONE.id,
			)
		})
	})
})
