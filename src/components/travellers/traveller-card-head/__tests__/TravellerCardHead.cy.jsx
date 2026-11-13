import {
	AVATAR_SELECTORS,
	TRAVELLER_CARD_HEAD_SELECTORS,
	YOU_TAG_SELECTORS,
} from '@/constants/test'
import { getByDataCy } from '@/testUtils/cypress/selectors'

import TravellerCardHead from '@/components/travellers/traveller-card-head/TravellerCardHead'

const NAME = getByDataCy('card-head-name-test')
const LONG_NAME = 'Maximiliana Konstantinopoulou-Vanderberg'

const mountHead = (props = {}, width) =>
	cy.mount(
		<div style={width ? { width: `${width}px` } : undefined}>
			<TravellerCardHead
				name="Amara Okafor"
				tripStart="2025-03-12"
				tripEnd="2025-03-19"
				nameDataCy="card-head-name-test"
				{...props}
			/>
		</div>,
	)

describe('<TravellerCardHead />', () => {
	it('has no axe violations', () => {
		mountHead({ isOwn: true })
		cy.get(TRAVELLER_CARD_HEAD_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})

	it('shows a 40px avatar top-aligned with the name', () => {
		mountHead()

		cy.get(AVATAR_SELECTORS.ROOT)
			.should('be.visible')
			.then(($avatar) => {
				const avatar = $avatar[0].getBoundingClientRect()
				expect(avatar.width).to.be.closeTo(40, 0.5)
				expect(avatar.height).to.be.closeTo(40, 0.5)

				cy.get(NAME).then(($name) => {
					const name = $name[0].getBoundingClientRect()
					expect(Math.abs(name.top - avatar.top)).to.be.at.most(1)
				})
			})
	})

	it('wraps a long name and the "You" tag at 320px without overflow', () => {
		mountHead({ name: LONG_NAME, isOwn: true }, 320)

		cy.get(TRAVELLER_CARD_HEAD_SELECTORS.ROOT).then(($head) => {
			const head = $head[0]
			expect(head.scrollWidth).to.be.at.most(head.clientWidth)
		})

		cy.get(NAME).then(($name) => {
			const nameTop = $name[0].getBoundingClientRect().top

			cy.get(YOU_TAG_SELECTORS.ROOT)
				.should('be.visible')
				.then(($tag) => {
					expect(
						$tag[0].getBoundingClientRect().top,
					).to.be.greaterThan(nameTop)
				})
		})
	})
})
