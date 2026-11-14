import MessagesPageSkeleton from '@/components/messages/messages-page-skeleton/MessagesPageSkeleton'
import {
	MESSAGE_SKELETON_SELECTORS,
	MESSAGES_PAGE_SKELETON_SELECTORS,
} from '@/constants/test'

describe('<MessagesPageSkeleton />', () => {
	it('shows the inbox skeleton at 1024px', () => {
		cy.viewport(1024, 800)
		cy.mount(<MessagesPageSkeleton />)
		cy.get(MESSAGES_PAGE_SKELETON_SELECTORS.ROOT).should('be.visible')
		cy.get(MESSAGE_SKELETON_SELECTORS.PANE).should('be.visible')
	})

	it('shows the card skeletons at 1023px', () => {
		cy.viewport(1023, 800)
		cy.mount(<MessagesPageSkeleton />)
		cy.get(MESSAGE_SKELETON_SELECTORS.ROOT).should('be.visible')
		cy.get(MESSAGE_SKELETON_SELECTORS.PANE).should('not.exist')
	})
})
