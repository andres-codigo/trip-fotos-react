import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'
import { TRAVELLER_SKELETON } from '@/constants/test'
import { CARD_PHOTOS } from '@/constants/ui'

const renderSkeleton = (props) =>
	render(
		<ul>
			<TravellerSkeleton {...props} />
		</ul>,
	)

const byDataCy = (container, id) => container.querySelector(`[data-cy="${id}"]`)

describe('TravellerSkeleton', () => {
	it('renders a list item hidden from assistive technology', () => {
		const { container } = renderSkeleton()
		const root = byDataCy(container, TRAVELLER_SKELETON.ROOT)
		expect(root.tagName).toBe('LI')
		expect(root).toHaveAttribute('aria-hidden', 'true')
	})

	// The signed-in description runs to its 250-character cap, which fills about five lines
	it('takes the signed-in card shape: five text lines and the two-per-row photo strip', () => {
		const { container } = renderSkeleton()
		const text = byDataCy(container, TRAVELLER_SKELETON.TEXT)
		expect(text.querySelectorAll('.animate-skeleton')).toHaveLength(5)
		expect(byDataCy(container, TRAVELLER_SKELETON.PHOTOS).className).toBe(
			CARD_PHOTOS.LIST,
		)
	})

	it('takes the public card shape: two excerpt lines and the three-across photo strip', () => {
		const { container } = renderSkeleton({ isPublic: true })
		const text = byDataCy(container, TRAVELLER_SKELETON.TEXT)
		expect(text.querySelectorAll('.animate-skeleton')).toHaveLength(2)
		expect(byDataCy(container, TRAVELLER_SKELETON.PHOTOS).className).toBe(
			CARD_PHOTOS.PUBLIC_LIST,
		)
	})

	it.each([false, true])(
		'gives the card (public: %s) three photo tiles and a View trip stub',
		(isPublic) => {
			const { container } = renderSkeleton({ isPublic })
			const tiles = byDataCy(
				container,
				TRAVELLER_SKELETON.PHOTOS,
			).querySelectorAll('li')
			expect(tiles).toHaveLength(3)
			tiles.forEach((tile) =>
				expect(tile).toHaveClass(...CARD_PHOTOS.TILE_WIDTH.split(' ')),
			)
			expect(
				byDataCy(container, TRAVELLER_SKELETON.BUTTON),
			).toBeInTheDocument()
		},
	)
})
