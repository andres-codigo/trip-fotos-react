import { MemoryRouter } from 'react-router-dom'

import { CONVERSATION_ROW_SELECTORS } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ConversationRow from '@/components/messages/conversation-row/ConversationRow'

const LONG_MESSAGE = 'Lisbon trams and miradouros at sunset. '.repeat(20)

const rowProps = {
	id: 'conv-1',
	to: '/messages/conv-1',
	name: 'Ana Lopes',
	status: SENDER_STATUS.TRAVELLER,
	lastMessage: 'See you in Lisbon',
	lastAt: Date.now() - 5 * 60 * 1000,
}

const mountRow = (props = {}) =>
	cy.mount(
		<MemoryRouter>
			<main>
				<ul className="m-0 w-[390px] list-none overflow-hidden bg-surface p-0">
					<ConversationRow
						{...rowProps}
						{...props}
					/>
				</ul>
			</main>
		</MemoryRouter>,
	)

describe('<ConversationRow />', () => {
	it('is at least 72px tall and keeps a long preview to one line', () => {
		mountRow({ lastMessage: LONG_MESSAGE })

		cy.get(CONVERSATION_ROW_SELECTORS.LINK).then(($link) => {
			expect($link[0].getBoundingClientRect().height).to.be.at.least(72)
		})
		cy.get(CONVERSATION_ROW_SELECTORS.PREVIEW).then(($preview) => {
			const preview = $preview[0]
			expect(preview.scrollWidth).to.be.greaterThan(preview.clientWidth)
			expect(preview.getBoundingClientRect().height).to.be.closeTo(
				parseFloat(getComputedStyle(preview).lineHeight),
				1,
			)
		})
		cy.checkA11y()
	})

	it('reads a read row in medium name and muted time and preview', () => {
		mountRow()

		cy.get(CONVERSATION_ROW_SELECTORS.NAME).should(
			'have.css',
			'font-weight',
			'500',
		)
		cy.get(CONVERSATION_ROW_SELECTORS.TIME).should(
			'have.css',
			'color',
			'rgb(181, 175, 159)',
		)
		cy.get(CONVERSATION_ROW_SELECTORS.PREVIEW).should(
			'have.css',
			'color',
			'rgb(181, 175, 159)',
		)
	})

	it('shows an unread row with a bold name, accent time, text preview and a 10px dot', () => {
		mountRow({ isUnread: true })

		cy.get(CONVERSATION_ROW_SELECTORS.NAME).should(
			'have.css',
			'font-weight',
			'700',
		)
		cy.get(CONVERSATION_ROW_SELECTORS.TIME)
			.should('have.css', 'color', 'rgb(169, 201, 138)')
			.and('have.css', 'font-weight', '500')
		cy.get(CONVERSATION_ROW_SELECTORS.PREVIEW).should(
			'have.css',
			'color',
			'rgb(239, 233, 218)',
		)
		cy.get(CONVERSATION_ROW_SELECTORS.DOT).then(($dot) => {
			const rect = $dot[0].getBoundingClientRect()
			expect(rect.width).to.equal(10)
			expect(rect.height).to.equal(10)
		})
		cy.checkA11y()
	})

	it('shows the open row with the accent ground and a 3px bar', () => {
		mountRow({ isOpen: true })

		cy.get(CONVERSATION_ROW_SELECTORS.LINK)
			.should('have.css', 'background-color', 'rgb(44, 53, 35)')
			.then(($link) => {
				expect(getComputedStyle($link[0], '::before').width).to.equal(
					'3px',
				)
			})
		cy.checkA11y()
	})

	it('draws the focus ring inside the row', () => {
		mountRow()

		cy.get(CONVERSATION_ROW_SELECTORS.LINK)
			.focus()
			.should('have.css', 'outline-offset', '-3px')
	})
})
