import { CONVERSATION_SKELETON_SELECTORS } from '@/constants/test'

import ConversationSkeleton from '@/components/messages/conversation-skeleton/ConversationSkeleton'

const mountSkeleton = (props) =>
	cy.mount(
		<main className="w-[390px]">
			<ConversationSkeleton {...props} />
		</main>,
	)

describe('<ConversationSkeleton />', () => {
	it('lays each list row out as a 40px circle and two bars, 72px tall', () => {
		mountSkeleton()

		cy.get(CONVERSATION_SKELETON_SELECTORS.ROW)
			.first()
			.then(($row) => {
				expect($row[0].getBoundingClientRect().height).to.be.at.least(
					72,
				)
				const circle = $row[0].firstElementChild.getBoundingClientRect()
				expect(circle.width).to.equal(40)
				expect(circle.height).to.equal(40)
			})
	})

	it('puts the thread bubbles on alternating sides', () => {
		mountSkeleton({ variant: 'thread' })

		cy.get(CONVERSATION_SKELETON_SELECTORS.THREAD).then(($thread) => {
			const box = $thread[0].getBoundingClientRect()
			const [first, second] = [...$thread[0].children].map((child) =>
				child.getBoundingClientRect(),
			)
			expect(first.left - box.left).to.be.closeTo(12, 1)
			expect(box.right - second.right).to.be.closeTo(12, 1)
		})
	})

	it('draws the header at least 60px tall with a 32px circle', () => {
		mountSkeleton({ variant: 'header' })

		cy.get(CONVERSATION_SKELETON_SELECTORS.HEADER).then(($header) => {
			expect($header[0].getBoundingClientRect().height).to.be.at.least(60)
			expect(
				$header[0].firstElementChild.getBoundingClientRect().width,
			).to.equal(32)
		})
	})
})
