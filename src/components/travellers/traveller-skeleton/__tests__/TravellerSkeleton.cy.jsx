import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'
import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import { TRAVELLER_SKELETON_SELECTORS } from '@/constants/test'

const mountCard = (isPublic = false) =>
	cy.mount(
		<ul className="m-0 w-full list-none p-0">
			<TravellerSkeleton isPublic={isPublic} />
		</ul>,
	)

const tileWidths = () =>
	cy.get(TRAVELLER_SKELETON_SELECTORS.PHOTOS).then(($list) => {
		const listWidth = $list[0].getBoundingClientRect().width
		return [...$list[0].children].map(
			(tile) => tile.getBoundingClientRect().width / listWidth,
		)
	})

describe('<TravellerSkeleton />', () => {
	it('is visible and hidden from assistive technology', () => {
		mountCard()
		cy.get(TRAVELLER_SKELETON_SELECTORS.ROOT)
			.should('be.visible')
			.and('have.attr', 'aria-hidden', 'true')
	})

	// The same size as the card's initials avatar, so nothing shifts on load
	it('heads the card with a 40px avatar circle', () => {
		mountCard()
		cy.get(TRAVELLER_SKELETON_SELECTORS.ROOT)
			.find('span')
			.first()
			.should(($circle) => {
				const { width, height } = $circle[0].getBoundingClientRect()
				expect(width).to.equal(40)
				expect(height).to.equal(40)
			})
	})

	it('sets each text line one body line apart', () => {
		mountCard()
		cy.get(TRAVELLER_SKELETON_SELECTORS.TEXT)
			.children()
			.should('have.length', 5)
			.each(($line) =>
				expect($line[0].getBoundingClientRect().height).to.equal(24),
			)
	})

	// The chip and the View trip stub stand in for a badge and a button, so they take their heights from the real ones
	it('sizes the chip as a city badge and the stub as a button', () => {
		cy.mount(
			<div>
				<ul className="m-0 list-none p-0">
					<TravellerSkeleton />
				</ul>
				<BaseBadge
					type="vienna"
					title="Vienna"
				/>
				<BaseButton type="button">View trip</BaseButton>
			</div>,
		)
		cy.get('.rounded-pill.animate-skeleton').then(($chip) => {
			cy.contains('Vienna').should(($badge) =>
				expect($chip[0].getBoundingClientRect().height).to.equal(
					$badge[0].getBoundingClientRect().height,
				),
			)
		})
		cy.get(TRAVELLER_SKELETON_SELECTORS.BUTTON).then(($stub) => {
			cy.contains('button', 'View trip').should(($button) =>
				expect($stub[0].getBoundingClientRect().height).to.equal(
					$button[0].getBoundingClientRect().height,
				),
			)
		})
	})

	it('puts the signed-in photos two to a row at 480px and three above', () => {
		cy.viewport(480, 800)
		mountCard()
		tileWidths().should((widths) =>
			widths.forEach((width) => expect(width).to.be.closeTo(0.48, 0.01)),
		)
		cy.viewport(481, 800)
		tileWidths().should((widths) =>
			widths.forEach((width) => expect(width).to.be.closeTo(0.32, 0.01)),
		)
	})

	it('keeps the public photos three across at 480px, with two excerpt lines', () => {
		cy.viewport(480, 800)
		mountCard(true)
		tileWidths().should((widths) =>
			widths.forEach((width) => expect(width).to.be.closeTo(0.32, 0.01)),
		)
		cy.get(TRAVELLER_SKELETON_SELECTORS.TEXT)
			.children()
			.should('have.length', 2)
	})
})
