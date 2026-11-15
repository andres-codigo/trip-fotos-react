import {
	MESSAGE_BUBBLE_SELECTORS,
	MESSAGE_THREAD_SELECTORS,
} from '@/constants/test'

import MessageThread from '@/components/messages/message-thread/MessageThread'

const now = Date.now()
const todayStart = new Date(now).setHours(0, 0, 0, 0)

const makeMessages = (count, start) =>
	Array.from({ length: count }, (_, index) => ({
		id: `m${index}`,
		senderId: index % 3 === 0 ? 'me' : 'other',
		message: `Message ${index} about the trip to Lisbon and the trams.`,
		createdAt: start + index * 60 * 1000,
		status: 'sent',
	}))

const mountThread = (props = {}) =>
	cy.mount(
		<main className="flex h-[480px] w-[390px] flex-col bg-bg">
			<MessageThread
				messages={makeMessages(20, todayStart - 10 * 60 * 1000)}
				userId="me"
				otherName="Ana Lopes"
				label="Conversation with Ana Lopes"
				className="min-h-0 flex-1"
				{...props}
			/>
		</main>,
	)

const isAtBottom = (scroller) =>
	Math.abs(
		scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop,
	) < 2

describe('<MessageThread />', () => {
	it('opens scrolled to the bottom', () => {
		mountThread()

		cy.get(MESSAGE_THREAD_SELECTORS.ROOT).should(($scroller) => {
			expect($scroller[0].scrollHeight).to.be.greaterThan(
				$scroller[0].clientHeight,
			)
			expect(isAtBottom($scroller[0])).to.equal(true)
		})
		cy.checkA11y()
	})

	it('scrolls to the bottom when a message is appended', () => {
		const messages = makeMessages(20, now - 60 * 60 * 1000)
		mountThread({ messages }).then(({ rerender }) => {
			cy.get(MESSAGE_THREAD_SELECTORS.ROOT).then(($scroller) => {
				$scroller[0].scrollTop = 0
			})
			cy.then(() =>
				rerender(
					<main className="flex h-[480px] w-[390px] flex-col bg-bg">
						<MessageThread
							messages={[
								...messages,
								{
									id: 'new',
									senderId: 'me',
									message: 'Just sent',
									createdAt: now,
									status: 'sending',
								},
							]}
							userId="me"
							otherName="Ana Lopes"
							label="Conversation with Ana Lopes"
							className="min-h-0 flex-1"
						/>
					</main>,
				),
			)
		})

		cy.get(MESSAGE_THREAD_SELECTORS.ROOT).should(($scroller) => {
			expect(isAtBottom($scroller[0])).to.equal(true)
		})
	})

	it('scrolls the Not sent line into view when the last message fails', () => {
		const messages = makeMessages(20, now - 60 * 60 * 1000)
		const withLast = (status) => [
			...messages,
			{
				id: 'new',
				senderId: 'me',
				message: 'Just sent',
				createdAt: now,
				status,
			},
		]
		const thread = (status) => (
			<main className="flex h-[480px] w-[390px] flex-col bg-bg">
				<MessageThread
					messages={withLast(status)}
					userId="me"
					otherName="Ana Lopes"
					label="Conversation with Ana Lopes"
					className="min-h-0 flex-1"
				/>
			</main>
		)
		cy.mount(thread('sending')).then(({ rerender }) => {
			cy.get(MESSAGE_BUBBLE_SELECTORS.SENDING).should('exist')
			cy.then(() => rerender(thread('failed')))
		})

		cy.get(MESSAGE_BUBBLE_SELECTORS.TRY_AGAIN).should('exist')
		cy.get(MESSAGE_THREAD_SELECTORS.ROOT).should(($scroller) => {
			expect(isAtBottom($scroller[0])).to.equal(true)
		})
	})

	it('shows a day label per day and the New divider at the top of the view', () => {
		mountThread({ newFromId: 'm5' })

		cy.get(MESSAGE_THREAD_SELECTORS.DAY)
			.should('have.length', 2)
			.first()
			.should('have.text', 'Yesterday')
			.and('have.css', 'text-align', 'center')
		cy.get(MESSAGE_THREAD_SELECTORS.NEW_DIVIDER)
			.should('have.css', 'text-transform', 'uppercase')
			.and('have.css', 'color', 'rgb(169, 201, 138)')
			.then(($divider) => {
				const scroller = Cypress.$(MESSAGE_THREAD_SELECTORS.ROOT)[0]
				expect(
					$divider[0].getBoundingClientRect().top -
						scroller.getBoundingClientRect().top,
				).to.be.closeTo(0, 2)
				expect(
					getComputedStyle($divider[0], '::before').height,
				).to.equal('1px')
			})
		cy.checkA11y()
	})

	it('pushes a short thread to the bottom and can scroll a long one to its top', () => {
		mountThread({ messages: makeMessages(2, now) })

		cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT)
			.last()
			.then(($bubble) => {
				const scroller = Cypress.$(MESSAGE_THREAD_SELECTORS.ROOT)[0]
				expect(
					scroller.getBoundingClientRect().bottom -
						$bubble[0].getBoundingClientRect().bottom,
				).to.be.closeTo(12, 1)
			})

		mountThread()
		cy.get(MESSAGE_THREAD_SELECTORS.ROOT).then(($scroller) => {
			$scroller[0].scrollTop = 0
		})
		cy.get(MESSAGE_THREAD_SELECTORS.DAY)
			.first()
			.then(($day) => {
				const scroller = Cypress.$(MESSAGE_THREAD_SELECTORS.ROOT)[0]
				expect($day[0].getBoundingClientRect().top).to.be.at.least(
					scroller.getBoundingClientRect().top,
				)
			})
	})

	it('centres the hello state', () => {
		mountThread({ messages: [] })

		cy.get(MESSAGE_THREAD_SELECTORS.HELLO).should(
			'have.css',
			'text-align',
			'center',
		)
		cy.checkA11y()
	})
})
