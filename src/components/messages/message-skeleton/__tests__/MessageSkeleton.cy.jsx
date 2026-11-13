import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'
import { MESSAGE_SKELETON_SELECTORS } from '@/constants/test'

describe('<MessageSkeleton />', () => {
	describe('Card (default)', () => {
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

	describe('Row', () => {
		it('is at least 44px tall with the row padding', () => {
			cy.mount(
				<ul className="m-0 w-90 p-0">
					<MessageSkeleton variant="row" />
				</ul>,
			)

			cy.get(MESSAGE_SKELETON_SELECTORS.ROW)
				.should('be.visible')
				.and('have.attr', 'aria-hidden', 'true')
				.and('have.css', 'padding', '14px 18px')
				.then(($row) => {
					expect(
						$row[0].getBoundingClientRect().height,
					).to.be.at.least(44)
				})
			cy.get(MESSAGE_SKELETON_SELECTORS.ROW)
				.find('.animate-skeleton')
				.should('have.length', 3)
		})
	})

	describe('Pane', () => {
		it('lays out a heading line, four text lines and the actions row', () => {
			cy.mount(
				<div className="w-[640px] p-4">
					<MessageSkeleton variant="pane" />
				</div>,
			)

			cy.get(MESSAGE_SKELETON_SELECTORS.PANE)
				.should('be.visible')
				.and('have.attr', 'aria-hidden', 'true')
				.find('.animate-skeleton')
				.should('have.length', 8)
				.then(($blocks) => {
					const rects = [...$blocks].map((block) =>
						block.getBoundingClientRect(),
					)
					const [, , , , , lastLine, reply, remove] = rects
					expect(reply.top).to.be.greaterThan(lastLine.bottom)
					expect(remove.left).to.be.greaterThan(reply.right)
					expect(reply.height).to.equal(44)
				})
		})
	})
})
