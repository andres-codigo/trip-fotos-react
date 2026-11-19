import { MemoryRouter } from 'react-router-dom'

import { THREAD_HEADER_SELECTORS } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import ThreadHeader from '@/components/messages/thread-header/ThreadHeader'

const mountHeader = (props = {}) => {
	const onDelete = cy.stub().as('onDelete')
	cy.mount(
		<MemoryRouter>
			<main className="w-full max-w-[390px] bg-surface">
				<ThreadHeader
					name="Ana Lopes"
					status={SENDER_STATUS.TRAVELLER}
					otherId="traveller-1"
					subtitle={MESSAGES_CONFIG.TRAVELLER_SUBTITLE('Lisbon')}
					backTo={PATHS.MESSAGES}
					onDelete={onDelete}
					{...props}
				/>
			</main>
		</MemoryRouter>,
	)
}

describe('<ThreadHeader />', () => {
	it('draws the focused heading’s ring around the name only, clear of the subtitle', () => {
		cy.viewport(390, 700)
		mountHeader({
			name: MESSAGES_CONFIG.FORMER_TRAVELLER,
			status: SENDER_STATUS.FORMER,
			subtitle: MESSAGES_CONFIG.FORMER_SUBTITLE,
		})

		// Focused as the page does when a read-only thread opens
		cy.get(THREAD_HEADER_SELECTORS.NAME).focus()
		cy.get(THREAD_HEADER_SELECTORS.NAME).then(($name) => {
			const name = $name[0].getBoundingClientRect()
			const range = document.createRange()
			range.selectNodeContents($name[0])
			// Outline width plus offset, outside the box
			const ring =
				parseFloat(getComputedStyle($name[0]).outlineWidth) +
				parseFloat(getComputedStyle($name[0]).outlineOffset)
			expect(name.width).to.be.at.most(
				range.getBoundingClientRect().width + 1,
			)
			cy.get(THREAD_HEADER_SELECTORS.SUBTITLE).then(($subtitle) => {
				expect(name.bottom + ring).to.be.at.most(
					$subtitle[0].getBoundingClientRect().top,
				)
			})
		})
	})

	it('lays out a 60px bar with 44px round back and options buttons', () => {
		cy.viewport(390, 700)
		mountHeader()

		cy.get(THREAD_HEADER_SELECTORS.ROOT).then(($root) => {
			expect($root[0].getBoundingClientRect().height).to.be.at.least(60)
		})
		;[
			THREAD_HEADER_SELECTORS.BACK,
			THREAD_HEADER_SELECTORS.MENU_BUTTON,
		].forEach((selector) => {
			cy.get(selector).then(($button) => {
				const rect = $button[0].getBoundingClientRect()
				expect(rect.width).to.equal(44)
				expect(rect.height).to.equal(44)
				expect(
					parseFloat(
						getComputedStyle($button[0]).borderTopLeftRadius,
					),
				).to.be.at.least(22)
			})
		})
		cy.checkA11y()
	})

	it('hides the back link from 1024px', () => {
		cy.viewport(1280, 800)
		mountHeader()

		cy.get(THREAD_HEADER_SELECTORS.BACK).should('not.be.visible')
	})

	it('keeps a long name to one line', () => {
		cy.viewport(390, 700)
		mountHeader({ name: 'Anastasia Maria Fernandes de Oliveira Lopes' })

		cy.get(THREAD_HEADER_SELECTORS.NAME).then(($name) => {
			const name = $name[0]
			expect(name.scrollWidth).to.be.greaterThan(name.clientWidth)
		})
	})

	it('colours the delete item, gives it a 44px row and has no axe violations with the menu open', () => {
		mountHeader()

		cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
		cy.get(THREAD_HEADER_SELECTORS.MENU).should('be.visible')
		cy.get(THREAD_HEADER_SELECTORS.DELETE)
			.should('have.css', 'color', 'rgb(240, 138, 130)')
			.then(($item) => {
				expect($item[0].getBoundingClientRect().height).to.be.at.least(
					44,
				)
			})
		cy.checkA11y()
	})

	it('sits the menu under the button, aligned to its right edge', () => {
		mountHeader()

		cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
		cy.get(THREAD_HEADER_SELECTORS.MENU).then(($menu) => {
			const menu = $menu[0].getBoundingClientRect()
			const button = Cypress.$(
				THREAD_HEADER_SELECTORS.MENU_BUTTON,
			)[0].getBoundingClientRect()
			expect(menu.top).to.be.greaterThan(button.bottom)
			expect(menu.right).to.be.closeTo(button.right, 1)
			expect(menu.width).to.be.at.least(220)
		})
	})
})
