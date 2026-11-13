import { MemoryRouter } from 'react-router-dom'

import PublicTravellerItem from '@/components/travellers/public-traveller-item/PublicTravellerItem'

import {
	COMMON_SELECTORS,
	PUBLIC_TRAVELLER_ITEM_SELECTORS,
} from '@/constants/test'

const photo =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"></svg>'

const mountItem = (cover) =>
	cy.mount(
		<MemoryRouter>
			<ul style={{ width: 600 }}>
				<PublicTravellerItem
					id="abc"
					firstName="Amara"
					lastInitial="O"
					tripStart="2024-03-05"
					tripEnd="2024-03-11"
					cities={['tokyo']}
					cover={cover}
				/>
			</ul>
		</MemoryRouter>,
	)

describe('<PublicTravellerItem />', () => {
	it('shows the cover as one square gallery-sized tile', () => {
		mountItem({ url: photo, alt: 'Lanterns over a night market' })
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.COVER).then(($list) => {
			const listWidth = $list[0].getBoundingClientRect().width
			cy.get(COMMON_SELECTORS.BASE_IMAGE).should(($tile) => {
				const { width, height } = $tile[0].getBoundingClientRect()
				expect(width).to.be.closeTo(listWidth * 0.32, 1)
				expect(height).to.be.closeTo(width, 1)
			})
		})
		cy.get(COMMON_SELECTORS.BASE_IMAGE_THUMBNAIL).should(
			'have.css',
			'cursor',
			'auto',
		)
	})

	it('has no axe violations', () => {
		mountItem({ url: photo, alt: 'Lanterns over a night market' })
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.VIEW_TRIP).should('exist')
		cy.checkA11y()
	})
})
