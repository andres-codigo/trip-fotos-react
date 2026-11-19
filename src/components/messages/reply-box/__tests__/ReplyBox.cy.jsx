import { REPLY_BOX_SELECTORS } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import ReplyBox from '@/components/messages/reply-box/ReplyBox'

const mountBox = () =>
	cy.mount(
		<main className="w-[390px]">
			<ReplyBox
				label={MESSAGES_CONFIG.REPLY_LABEL('Ana Lopes')}
				onSend={cy.stub()}
			/>
		</main>,
	)

const heightOf = ($el) => $el[0].getBoundingClientRect().height

describe('<ReplyBox />', () => {
	it('starts as a one-line 44px pill beside a 44px round Send', () => {
		mountBox()

		cy.get(REPLY_BOX_SELECTORS.INPUT)
			.should('have.css', 'border-top-left-radius', '22px')
			.then(($input) => expect(heightOf($input)).to.equal(44))
		cy.get(REPLY_BOX_SELECTORS.SEND).then(($send) => {
			const rect = $send[0].getBoundingClientRect()
			expect(rect.width).to.equal(44)
			expect(rect.height).to.equal(44)
		})
		cy.checkA11y()
	})

	it('grows with each line up to five, then scrolls', () => {
		mountBox()

		cy.get(REPLY_BOX_SELECTORS.INPUT).type('one{shift+enter}two')
		cy.get(REPLY_BOX_SELECTORS.INPUT).should(($input) =>
			expect(heightOf($input)).to.equal(66),
		)

		cy.get(REPLY_BOX_SELECTORS.INPUT).type(
			'{shift+enter}3{shift+enter}4{shift+enter}5{shift+enter}6{shift+enter}7',
		)
		cy.get(REPLY_BOX_SELECTORS.INPUT)
			.should('have.css', 'overflow-y', 'auto')
			.and(($input) => {
				expect(heightOf($input)).to.equal(132)
				expect($input[0].scrollHeight).to.be.greaterThan(
					$input[0].clientHeight,
				)
			})
	})

	it('colours Send by state and shrinks the box back to one line after sending', () => {
		mountBox()

		cy.get(REPLY_BOX_SELECTORS.SEND)
			.should('have.css', 'background-color', 'rgb(20, 19, 15)')
			.and('have.css', 'color', 'rgb(181, 175, 159)')

		cy.get(REPLY_BOX_SELECTORS.INPUT).type('Hi{shift+enter}there')
		cy.get(REPLY_BOX_SELECTORS.SEND)
			.should('have.css', 'background-color', 'rgb(159, 192, 126)')
			.click()
		cy.get(REPLY_BOX_SELECTORS.INPUT)
			.should('have.value', '')
			.and(($input) => expect(heightOf($input)).to.equal(44))
	})
})
