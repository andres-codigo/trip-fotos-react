import { MESSAGE_ACTIONS_SELECTORS, MOCK_INBOX } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import MessageActions from '@/components/messages/message-actions/MessageActions'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const DELETE_ERROR = 'This message could not be deleted.'

const travellerProps = {
	id: SAMPLE_MESSAGE_ONE.id,
	senderId: SAMPLE_MESSAGE_ONE.senderId,
	senderName: SAMPLE_MESSAGE_ONE.senderName,
	senderStatus: SAMPLE_MESSAGE_ONE.senderStatus,
	message: SAMPLE_MESSAGE_ONE.message,
	createdAt: SAMPLE_MESSAGE_ONE.createdAt,
	sender: SAMPLE_MESSAGE_ONE.senderName,
}

const legacyProps = {
	id: SAMPLE_MESSAGE_TWO.id,
	senderId: SAMPLE_MESSAGE_TWO.senderId,
	senderName: SAMPLE_MESSAGE_TWO.senderName,
	createdAt: SAMPLE_MESSAGE_TWO.createdAt,
	senderStatus: SAMPLE_MESSAGE_TWO.senderStatus,
	userEmail: SAMPLE_MESSAGE_TWO.userEmail,
	message: SAMPLE_MESSAGE_TWO.message,
	sender: SAMPLE_MESSAGE_TWO.userEmail,
}

describe('<MessageActions />', () => {
	const mountActions = (props = {}) => {
		const onDelete = cy.stub().as('onDelete')
		const onRetry = cy.stub().as('onRetry')

		cy.createMockStore('mock-token').then((store) => {
			cy.mountWithProviders(
				<main className="p-4">
					<MessageActions
						{...travellerProps}
						onDelete={onDelete}
						onRetry={onRetry}
						{...props}
					/>
				</main>,
				store,
			)
		})
	}

	describe('Weight', () => {
		// Both Reply variants are the primary action, so they share the button label weight
		const assertWeight = (selector) =>
			cy.get(selector).should('have.css', 'font-weight', '500')

		it('gives Reply, Reply by email and Delete the same medium weight', () => {
			mountActions()
			assertWeight(MESSAGE_ACTIONS_SELECTORS.REPLY)
			assertWeight(MESSAGE_ACTIONS_SELECTORS.DELETE)

			mountActions(legacyProps)
			assertWeight(MESSAGE_ACTIONS_SELECTORS.REPLY)
		})
	})

	describe('Layout', () => {
		it('puts Reply at the start and Delete at the end of the row', () => {
			mountActions()

			cy.get(MESSAGE_ACTIONS_SELECTORS.ROOT).then(($row) => {
				const row = $row[0].getBoundingClientRect()
				const reply = $row
					.find(MESSAGE_ACTIONS_SELECTORS.REPLY)[0]
					.getBoundingClientRect()
				const remove = $row
					.find(MESSAGE_ACTIONS_SELECTORS.DELETE)[0]
					.getBoundingClientRect()
				expect(reply.left).to.be.closeTo(row.left, 1)
				expect(remove.right).to.be.closeTo(row.right, 1)
				expect(reply.height).to.be.at.least(44)
				expect(remove.height).to.be.at.least(44)
			})
			cy.checkA11y()
		})
	})

	describe('Legacy', () => {
		it('shows a Reply by email mailto link', () => {
			mountActions(legacyProps)

			cy.get(MESSAGE_ACTIONS_SELECTORS.REPLY)
				.should('contain', MESSAGES_CONFIG.REPLY_BY_EMAIL)
				.and('have.attr', 'href')
				.and('match', /^mailto:/)
			cy.checkA11y()
		})
	})

	describe('Delete', () => {
		it('calls onDelete with the message id', () => {
			mountActions()

			cy.get(MESSAGE_ACTIONS_SELECTORS.DELETE)
				.should(
					'have.attr',
					'aria-label',
					MESSAGES_CONFIG.DELETE_LABEL(SAMPLE_MESSAGE_ONE.senderName),
				)
				.click()
			cy.get('@onDelete').should(
				'have.been.calledOnceWith',
				SAMPLE_MESSAGE_ONE.id,
			)
		})

		it('shows the error alert, and Try again calls onRetry', () => {
			mountActions({ deleteError: DELETE_ERROR })

			cy.get(MESSAGE_ACTIONS_SELECTORS.DELETE_ERROR)
				.should('be.visible')
				.and('have.attr', 'role', 'alert')
				.and('contain', DELETE_ERROR)
			cy.checkA11y()
			cy.get(MESSAGE_ACTIONS_SELECTORS.TRY_AGAIN).click()
			cy.get('@onRetry').should(
				'have.been.calledOnceWith',
				SAMPLE_MESSAGE_ONE.id,
			)
		})

		it('disables Try again and reads Trying again while retrying', () => {
			mountActions({ deleteError: DELETE_ERROR, isRetrying: true })

			cy.get(MESSAGE_ACTIONS_SELECTORS.TRY_AGAIN)
				.should('be.disabled')
				.and('have.attr', 'aria-busy', 'true')
				.and('contain', MESSAGES_CONFIG.TRYING_AGAIN)
		})
	})
})
