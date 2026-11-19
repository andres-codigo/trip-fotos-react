import { MemoryRouter } from 'react-router-dom'

import PublicTravellerItem from '@/components/travellers/public-traveller-item/PublicTravellerItem'

import {
	COMMON_SELECTORS,
	PUBLIC_TRAVELLER_ITEM_SELECTORS,
} from '@/constants/test'

const photo =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"></svg>'
// Distinct urls, since each tile is keyed by its photo
const photos = [
	'Lanterns over a night market',
	'A temple gate at dawn',
	'A crossing in the rain',
].map((alt, index) => ({ url: `${photo}#${index}`, alt }))

const mountItem = (photos, width = 600, tripExcerpt) =>
	cy.mount(
		<MemoryRouter>
			<ul style={{ width }}>
				<PublicTravellerItem
					id="abc"
					firstName="Amara"
					lastInitial="O"
					tripExcerpt={tripExcerpt}
					tripStart="2024-03-05"
					tripEnd="2024-03-11"
					cities={['tokyo']}
					photos={photos}
				/>
			</ul>
		</MemoryRouter>,
	)

describe('<PublicTravellerItem />', () => {
	it('clamps a long excerpt to two lines ending in an ellipsis', () => {
		mountItem(undefined, 320, 'Eight slow days in Prague. '.repeat(7))
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.EXCERPT).should(($excerpt) => {
			const excerpt = $excerpt[0]
			const { lineHeight } = getComputedStyle(excerpt)
			expect(excerpt.getBoundingClientRect().height).to.be.closeTo(
				parseFloat(lineHeight) * 2,
				1,
			)
			expect(excerpt.scrollHeight).to.be.greaterThan(excerpt.clientHeight)
			expect($excerpt).to.have.css('-webkit-line-clamp', '2')
			expect($excerpt).to.have.css('font-style', 'italic')
		})
	})

	// Signed-in tiles go two per row on phones; public photos stay one row of fixed-size tiles, so none sits alone
	;[
		['three photos', 1280, 600, 3],
		['three photos at phone width', 390, 358, 3],
		['a single photo', 1280, 600, 1],
	].forEach(([name, viewport, width, count]) => {
		it(`shows ${name} as square gallery-sized tiles on one row`, () => {
			cy.viewport(viewport, 800)
			mountItem(photos.slice(0, count), width)
			cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.PHOTOS).then(($list) => {
				const list = $list[0].getBoundingClientRect()
				cy.get(COMMON_SELECTORS.BASE_IMAGE).should(($tiles) => {
					expect($tiles).to.have.length(count)
					const rects = [...$tiles].map((tile) =>
						tile.getBoundingClientRect(),
					)
					rects.forEach(({ width, height, top, right }) => {
						expect(width).to.be.closeTo(list.width * 0.32, 1)
						expect(height).to.be.closeTo(width, 1)
						expect(top).to.be.closeTo(rects[0].top, 1)
						expect(right).to.be.at.most(list.right + 0.5)
					})
				})
			})
			cy.get(COMMON_SELECTORS.BASE_IMAGE_THUMBNAIL).should(
				'have.css',
				'cursor',
				'auto',
			)
		})
	})

	it('has no axe violations', () => {
		mountItem(photos)
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.VIEW_TRIP).should('exist')
		cy.checkA11y()
	})
})
