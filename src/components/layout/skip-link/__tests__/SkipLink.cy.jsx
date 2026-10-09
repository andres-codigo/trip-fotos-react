import { SKIP_LINK_SELECTORS } from '@/constants/test'
import { ACCESSIBILITY } from '@/constants/ui'

import SkipLink from '@/components/layout/skip-link/SkipLink'

describe('<SkipLink />', () => {
	beforeEach(() => {
		cy.createMockStore(null).then((store) => {
			cy.mountWithProviders(
				<>
					<SkipLink />
					<button type="button">Header control</button>
					<main
						id={ACCESSIBILITY.MAIN_CONTENT_ID}
						tabIndex={-1}>
						Main content
					</main>
				</>,
				store,
			)
		})
	})

	describe('Rendering tests', () => {
		it('is off-screen until focused', () => {
			cy.get(SKIP_LINK_SELECTORS.SKIP_LINK).then(($link) => {
				expect($link[0].getBoundingClientRect().bottom).to.be.lessThan(
					0,
				)
			})
		})

		it('moves on-screen with a visible outline when focused', () => {
			cy.get(SKIP_LINK_SELECTORS.SKIP_LINK)
				.focus()
				.should('have.css', 'outline-style', 'solid')
				.then(($link) => {
					expect($link[0].getBoundingClientRect().top).to.be.at.least(
						0,
					)
				})
		})
	})

	describe('Behaviour tests', () => {
		it('moves focus to the main content when activated', () => {
			cy.get(SKIP_LINK_SELECTORS.SKIP_LINK).focus().click()
			cy.focused().should(
				'have.attr',
				'id',
				ACCESSIBILITY.MAIN_CONTENT_ID,
			)
		})
	})
})
