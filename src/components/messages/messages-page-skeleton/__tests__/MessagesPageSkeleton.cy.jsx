import MessagesPageSkeleton from '@/components/messages/messages-page-skeleton/MessagesPageSkeleton'
import {
	CONVERSATION_SKELETON_SELECTORS,
	MESSAGES_PAGE_SKELETON_SELECTORS,
} from '@/constants/test'

describe('<MessagesPageSkeleton />', () => {
	it('shows the list beside a thread at 1024px', () => {
		cy.viewport(1024, 800)
		cy.mount(<MessagesPageSkeleton />)
		cy.get(MESSAGES_PAGE_SKELETON_SELECTORS.ROOT).should('be.visible')
		cy.get(CONVERSATION_SKELETON_SELECTORS.LIST).should('be.visible')
		cy.get(CONVERSATION_SKELETON_SELECTORS.THREAD).should('be.visible')
	})

	it('shows the list alone at 1023px', () => {
		cy.viewport(1023, 800)
		cy.mount(<MessagesPageSkeleton />)
		cy.get(CONVERSATION_SKELETON_SELECTORS.LIST).should('be.visible')
		cy.get(CONVERSATION_SKELETON_SELECTORS.THREAD).should('not.exist')
	})
})
