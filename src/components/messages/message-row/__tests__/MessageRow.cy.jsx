import { MemoryRouter } from 'react-router-dom'

import { MESSAGE_ROW_SELECTORS, MOCK_INBOX } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import MessageRow from '@/components/messages/message-row/MessageRow'

const { SAMPLE_MESSAGE_ONE } = MOCK_INBOX

const LONG_MESSAGE = 'Lisbon trams and miradouros at sunset. '.repeat(20)

const travellerProps = {
	id: SAMPLE_MESSAGE_ONE.id,
	senderName: SAMPLE_MESSAGE_ONE.senderName,
	senderStatus: SAMPLE_MESSAGE_ONE.senderStatus,
	message: SAMPLE_MESSAGE_ONE.message,
	createdAt: SAMPLE_MESSAGE_ONE.createdAt,
}

describe('<MessageRow />', () => {
	const mountRow = (props = {}) => {
		const onSelect = cy.stub().as('onSelect')

		cy.mount(
			<MemoryRouter initialEntries={['/messages']}>
				<main>
					<ul className="m-0 w-90 overflow-hidden rounded-lg bg-surface p-0">
						<MessageRow
							{...travellerProps}
							onSelect={onSelect}
							{...props}
						/>
					</ul>
				</main>
			</MemoryRouter>,
		)
	}

	describe('Layout', () => {
		it('is at least 44px tall and keeps a long preview to one line', () => {
			mountRow({ message: LONG_MESSAGE })

			cy.get(MESSAGE_ROW_SELECTORS.LINK).then(($link) => {
				expect($link[0].getBoundingClientRect().height).to.be.at.least(
					44,
				)
			})
			cy.get(MESSAGE_ROW_SELECTORS.PREVIEW).then(($preview) => {
				const preview = $preview[0]
				const lineHeight = parseFloat(
					getComputedStyle(preview).lineHeight,
				)
				expect(preview.getBoundingClientRect().height).to.be.closeTo(
					lineHeight,
					1,
				)
				expect(preview.scrollWidth).to.be.greaterThan(
					preview.clientWidth,
				)
			})
			cy.checkA11y()
		})

		it('puts the time at the end of the sender line', () => {
			mountRow()

			cy.get(MESSAGE_ROW_SELECTORS.LINK).then(($link) => {
				const link = $link[0].getBoundingClientRect()
				const time = $link
					.find(MESSAGE_ROW_SELECTORS.TIME)[0]
					.getBoundingClientRect()
				expect(link.right - time.right).to.be.closeTo(18, 1)
			})
		})
	})

	describe('Open', () => {
		it('shows the accent bar and is current', () => {
			mountRow({ isOpen: true })

			cy.get(MESSAGE_ROW_SELECTORS.LINK)
				.should('have.attr', 'aria-current', 'true')
				.then(($link) => {
					expect(
						getComputedStyle($link[0], '::before').width,
					).to.equal('3px')
				})
			cy.checkA11y()
		})

		it('has no bar when closed', () => {
			mountRow()

			cy.get(MESSAGE_ROW_SELECTORS.LINK).then(($link) => {
				expect(getComputedStyle($link[0], '::before').content).to.equal(
					'none',
				)
			})
		})
	})

	describe('New', () => {
		it('shows the dot and a bold sender, and passes a11y', () => {
			mountRow({ isNew: true })

			cy.get(MESSAGE_ROW_SELECTORS.DOT).should('be.visible')
			cy.get(MESSAGE_ROW_SELECTORS.SENDER)
				.should('have.css', 'font-weight', '700')
				.and('contain', MESSAGES_CONFIG.NEW_ROW_HIDDEN)
			cy.checkA11y()
		})
	})

	describe('Focus', () => {
		it('draws the focus ring inside the row', () => {
			mountRow()

			cy.get(MESSAGE_ROW_SELECTORS.LINK)
				.focus()
				.should('have.css', 'outline-offset', '-3px')
				.and('have.css', 'outline-width', '3px')
		})
	})

	describe('Select', () => {
		it('calls onSelect with the id on click', () => {
			mountRow()

			cy.get(MESSAGE_ROW_SELECTORS.LINK).click()
			cy.get('@onSelect').should(
				'have.been.calledOnceWith',
				SAMPLE_MESSAGE_ONE.id,
			)
		})
	})
})
