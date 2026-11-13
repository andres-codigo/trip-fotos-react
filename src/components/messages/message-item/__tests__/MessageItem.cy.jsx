import {
	MESSAGE_ACTIONS_SELECTORS,
	MESSAGE_ITEM_SELECTORS,
	MOCK_INBOX,
} from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import MessageItem from '@/components/messages/message-item/MessageItem'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const DELETE_ERROR = 'This message could not be deleted.'

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

describe('<MessageItem />', () => {
	const mountItem = (props = {}) => {
		const onDelete = cy.stub().as('onDelete')
		const onRetry = cy.stub().as('onRetry')

		cy.createMockStore('mock-token').then((store) => {
			cy.mountWithProviders(
				<ul className="m-0 p-4">
					<MessageItem
						{...travellerProps}
						onDelete={onDelete}
						onRetry={onRetry}
						{...props}
					/>
				</ul>,
				store,
			)
		})
	}

	describe('Unread', () => {
		it('stands out with the accent border, background, dot and New tag', () => {
			mountItem({ isNew: true })

			cy.get(MESSAGE_ITEM_SELECTORS.ROOT)
				.should('have.attr', 'data-new', 'true')
				.and('have.class', 'bg-surface-accent')
				.and('have.class', 'border-accent-text')
			cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG)
				.should('be.visible')
				.and('contain', MESSAGES_CONFIG.NEW_TAG)
			cy.get(MESSAGE_ITEM_SELECTORS.SENDER_LINK).should(
				'contain',
				SAMPLE_MESSAGE_ONE.senderName,
			)
			cy.get(MESSAGE_ACTIONS_SELECTORS.REPLY).should('be.visible')
			cy.checkA11y()
		})
	})

	describe('Read', () => {
		it('has no unread marker and passes a11y', () => {
			mountItem()

			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should(
				'not.have.class',
				'bg-surface-accent',
			)
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should(
				'not.have.attr',
				'data-new',
			)
			cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('not.exist')
			cy.get(MESSAGE_ITEM_SELECTORS.TIME).should('be.visible')
			cy.checkA11y()
		})
	})

	describe('Legacy', () => {
		it('shows the email and a Reply by email link', () => {
			mountItem(legacyProps)

			cy.get(MESSAGE_ITEM_SELECTORS.SENDER).should(
				'contain',
				SAMPLE_MESSAGE_TWO.userEmail,
			)
			cy.get(MESSAGE_ACTIONS_SELECTORS.REPLY).should(
				'contain',
				MESSAGES_CONFIG.REPLY_BY_EMAIL,
			)
			cy.get(MESSAGE_ITEM_SELECTORS.TIME).should('not.exist')
			cy.checkA11y()
		})
	})

	describe('Long message', () => {
		it('clamps the text until Show all is pressed', () => {
			mountItem({ message: 'Lisbon '.repeat(80) })

			cy.get(MESSAGE_ITEM_SELECTORS.TEXT).then(($text) => {
				expect($text[0].scrollHeight).to.be.greaterThan(
					$text[0].clientHeight,
				)
			})
			cy.get(MESSAGE_ITEM_SELECTORS.SHOW_ALL)
				.should('have.attr', 'aria-expanded', 'false')
				.click()
				.should('have.attr', 'aria-expanded', 'true')
				.and('contain', MESSAGES_CONFIG.SHOW_LESS)
			cy.get(MESSAGE_ITEM_SELECTORS.TEXT).then(($text) => {
				expect($text[0].scrollHeight).to.equal($text[0].clientHeight)
			})
			cy.checkA11y()
		})
	})

	describe('Delete error', () => {
		it('shows the error alert inside the card and passes a11y', () => {
			mountItem({ deleteError: DELETE_ERROR })

			cy.get(MESSAGE_ITEM_SELECTORS.ROOT)
				.find(MESSAGE_ACTIONS_SELECTORS.DELETE_ERROR)
				.should('be.visible')
				.and('contain', DELETE_ERROR)
			cy.checkA11y()
		})
	})
})
