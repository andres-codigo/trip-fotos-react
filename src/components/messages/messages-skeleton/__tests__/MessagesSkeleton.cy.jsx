import MessagesSkeleton from '@/components/messages/messages-skeleton/MessagesSkeleton'
import {
	MESSAGE_SKELETON_SELECTORS,
	MESSAGES_SKELETON_SELECTORS,
} from '@/constants/test'
import { PAGE_LAYOUT } from '@/constants/ui'

describe('<MessagesSkeleton />', () => {
	it('stacks the card skeletons 12px apart', () => {
		cy.mount(<MessagesSkeleton />)
		cy.get(MESSAGES_SKELETON_SELECTORS.ROOT).should('be.visible')
		cy.get(MESSAGE_SKELETON_SELECTORS.ROOT).should(($cards) => {
			const [first, second] = [...$cards].map((card) =>
				card.getBoundingClientRect(),
			)
			expect(second.top - first.bottom).to.equal(12)
		})
	})

	// In the page's two columns from 1024px: the rows on the left, the pane on the right
	it('puts the inbox rows and the pane side by side in the page columns', () => {
		cy.viewport(1280, 800)
		cy.mount(
			<div className={PAGE_LAYOUT.COLUMNS}>
				<MessagesSkeleton isInbox />
			</div>,
		)
		cy.get(MESSAGES_SKELETON_SELECTORS.ROOT).then(($list) => {
			cy.get(MESSAGE_SKELETON_SELECTORS.PANE).should(($pane) => {
				const list = $list[0].getBoundingClientRect()
				const pane = $pane[0].getBoundingClientRect()
				expect(list.width).to.equal(380)
				expect(pane.left).to.be.greaterThan(list.right)
				expect(pane.top).to.equal(list.top)
			})
		})
	})
})
