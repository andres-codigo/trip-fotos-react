import { MESSAGE_BUBBLE_SELECTORS } from '@/constants/test'

import MessageBubble from '@/components/messages/message-bubble/MessageBubble'

const LONG_MESSAGE = 'Lisbon trams and miradouros at sunset. '.repeat(6)
const CREATED_AT = new Date(2026, 10, 10, 9, 5).getTime()

const bubbleProps = {
	message: LONG_MESSAGE,
	senderName: 'Ana Lopes',
	createdAt: CREATED_AT,
	showTime: true,
}

const mountBubbles = (mine = {}) =>
	cy.mount(
		<main className="flex w-[390px] flex-col gap-1.5 bg-bg p-0">
			<MessageBubble
				{...bubbleProps}
				isMine={false}
			/>
			<MessageBubble
				{...bubbleProps}
				isMine
				{...mine}
			/>
		</main>,
	)

const rectOf = ($el) => $el[0].getBoundingClientRect()

describe('<MessageBubble />', () => {
	it('puts theirs on the left and mine on the right, each at most 80% wide', () => {
		mountBubbles()

		cy.get('main').then(($main) => {
			const wrapper = rectOf($main)
			const [theirs, mine] = [
				...$main[0].querySelectorAll(MESSAGE_BUBBLE_SELECTORS.TEXT),
			].map((bubble) => bubble.getBoundingClientRect())

			expect(theirs.left).to.be.closeTo(wrapper.left, 1)
			expect(mine.right).to.be.closeTo(wrapper.right, 1)
			expect(theirs.width).to.be.at.most(wrapper.width * 0.8 + 0.5)
			expect(mine.width).to.be.at.most(wrapper.width * 0.8 + 0.5)
		})
		cy.checkA11y()
	})

	it('stops a long bubble at 34rem in a wide thread, about 70 characters a line', () => {
		cy.viewport(1000, 600)
		// A div, as the global main rule would stretch a main to the viewport
		cy.mount(
			<div className="flex w-[760px] flex-col gap-1.5 bg-bg p-0">
				<MessageBubble
					{...bubbleProps}
					message={LONG_MESSAGE.repeat(2)}
					isMine={false}
				/>
			</div>,
		)

		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT).should(($bubble) => {
			// 34rem at the 16px root; 80% of 760px would be 608px
			expect(rectOf($bubble).width).to.be.closeTo(544, 1)
		})
	})

	it('cuts the corner nearest the sender', () => {
		mountBubbles()

		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT)
			.first()
			.should('have.css', 'border-bottom-left-radius', '6px')
			.and('have.css', 'border-top-left-radius', '18px')
			.and('have.css', 'background-color', 'rgb(38, 36, 31)')
		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT)
			.last()
			.should('have.css', 'border-bottom-right-radius', '6px')
			.and('have.css', 'background-color', 'rgb(159, 192, 126)')
			.and('have.css', 'color', 'rgb(20, 19, 15)')
	})

	it('keeps a short message to its content width', () => {
		cy.mount(
			<main className="flex w-[390px] flex-col">
				<MessageBubble
					{...bubbleProps}
					message="Hi"
					isMine
				/>
			</main>,
		)

		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT).then(($bubble) => {
			expect(rectOf($bubble).width).to.be.lessThan(100)
		})
	})

	it('wraps an unbroken string inside the bubble', () => {
		cy.mount(
			<main className="flex w-[390px] flex-col">
				<MessageBubble
					{...bubbleProps}
					message={'a'.repeat(200)}
					isMine={false}
				/>
			</main>,
		)

		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT).then(($bubble) => {
			expect($bubble[0].scrollWidth).to.be.at.most($bubble[0].clientWidth)
		})
	})

	it('dims a sending bubble and puts "Sending…" on the right', () => {
		mountBubbles({ status: 'sending' })

		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT)
			.last()
			.should('have.css', 'opacity', '0.6')
		cy.get(MESSAGE_BUBBLE_SELECTORS.SENDING).then(($meta) => {
			const wrapper = rectOf(Cypress.$('main'))
			expect(rectOf($meta).right).to.be.closeTo(wrapper.right, 1)
		})
	})

	it('draws a failed bubble with a dashed danger border and a 44px Try again', () => {
		mountBubbles({ status: 'failed' })

		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT)
			.last()
			.should('have.css', 'border-top-style', 'dashed')
			.and('have.css', 'border-top-color', 'rgb(229, 103, 93)')
			.and('have.css', 'background-color', 'rgb(20, 19, 15)')
		cy.get(MESSAGE_BUBBLE_SELECTORS.TRY_AGAIN)
			.should('have.css', 'text-decoration-line', 'underline')
			.then(($button) => {
				expect(rectOf($button).height).to.be.at.least(44)
			})
		cy.checkA11y()
	})
})
