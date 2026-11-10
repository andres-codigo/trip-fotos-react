import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'
import { MESSAGE_SKELETON_SELECTORS } from '@/constants/test'

describe('<MessageSkeleton />', () => {
	beforeEach(() => {
		cy.mount(
			<ul>
				<MessageSkeleton />
			</ul>,
		)
	})

	it('is visible and hidden from assistive technology', () => {
		cy.get(MESSAGE_SKELETON_SELECTORS.ROOT)
			.should('be.visible')
			.and('have.attr', 'aria-hidden', 'true')
	})

	it('renders six animated blocks', () => {
		cy.get(MESSAGE_SKELETON_SELECTORS.ROOT)
			.find('.animate-skeleton')
			.should('have.length', 6)
	})
})
