import { REPLY_BOX_SELECTORS } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import ReplyBox from '@/components/messages/reply-box/ReplyBox'

const mountBox = () => {
	const onSend = cy.stub().as('onSend')
	cy.mount(
		<main className="w-[390px]">
			<ReplyBox
				label={MESSAGES_CONFIG.REPLY_LABEL('Ana Lopes')}
				onSend={onSend}
			/>
		</main>,
	)
}

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

	it('keeps Send disabled while blank and enables it after typing', () => {
		mountBox()

		cy.get(REPLY_BOX_SELECTORS.SEND)
			.should('have.css', 'background-color', 'rgb(20, 19, 15)')
			.and('have.css', 'color', 'rgb(181, 175, 159)')
			.and('have.attr', 'aria-disabled', 'true')
		cy.get(REPLY_BOX_SELECTORS.SEND).click()
		cy.get('@onSend').should('not.have.been.called')
		cy.get(REPLY_BOX_SELECTORS.SEND).should('have.focus')

		cy.get(REPLY_BOX_SELECTORS.INPUT).type('Hello')
		cy.get(REPLY_BOX_SELECTORS.SEND)
			.should('have.css', 'background-color', 'rgb(159, 192, 126)')
			.and('not.have.attr', 'aria-disabled')
		cy.get(REPLY_BOX_SELECTORS.SEND).click()
		cy.get('@onSend').should('have.been.calledOnceWith', 'Hello')
		cy.get(REPLY_BOX_SELECTORS.INPUT).should('have.value', '')
	})

	it('sends on Enter and adds a line on Shift+Enter with a fine pointer', () => {
		mountBox()
		cy.window()
			.then((win) => win.matchMedia('(pointer: fine)').matches)
			.should('equal', true)

		cy.get(REPLY_BOX_SELECTORS.INPUT).type('Hi{shift+enter}there')
		cy.get('@onSend').should('not.have.been.called')
		cy.get(REPLY_BOX_SELECTORS.INPUT).type('{enter}')
		cy.get('@onSend').should('have.been.calledOnceWith', 'Hi\nthere')
		cy.get(REPLY_BOX_SELECTORS.INPUT)
			.should('have.value', '')
			.and(($input) => expect(heightOf($input)).to.equal(44))
	})
})
