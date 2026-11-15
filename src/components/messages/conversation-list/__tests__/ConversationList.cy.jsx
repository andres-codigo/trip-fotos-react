import { MemoryRouter } from 'react-router-dom'

import {
	CONVERSATION_LIST_SELECTORS,
	CONVERSATION_ROW_SELECTORS,
} from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ConversationList from '@/components/messages/conversation-list/ConversationList'

const conversations = ['Ana Lopes', 'Ben Hart', 'Cleo Dias'].map(
	(name, index) => ({
		id: `conv-${index}`,
		to: `/messages/conv-${index}`,
		name,
		status: SENDER_STATUS.TRAVELLER,
		lastMessage: 'See you soon',
		lastAt: Date.now(),
	}),
)

describe('<ConversationList />', () => {
	it('divides the rows with a 1px line and no list markers', () => {
		cy.mount(
			<MemoryRouter>
				<main>
					<ConversationList
						conversations={conversations}
						openId="conv-1"
						label="Conversations"
						className="w-[390px] bg-surface"
					/>
				</main>
			</MemoryRouter>,
		)

		cy.get(CONVERSATION_LIST_SELECTORS.ROOT)
			.should('have.css', 'list-style-type', 'none')
			.and('have.css', 'padding-left', '0px')
		cy.get(CONVERSATION_ROW_SELECTORS.ROOT)
			.first()
			.should('have.css', 'border-bottom-width', '1px')
			.and('have.css', 'border-bottom-style', 'solid')
			.and('have.css', 'border-top-width', '0px')
		cy.get(CONVERSATION_ROW_SELECTORS.ROOT)
			.last()
			.should('have.css', 'border-bottom-width', '0px')
		cy.checkA11y()
	})
})
