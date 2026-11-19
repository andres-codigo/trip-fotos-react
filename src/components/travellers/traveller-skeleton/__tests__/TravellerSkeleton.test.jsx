import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'
import { TRAVELLER_SKELETON } from '@/constants/test'

const renderSkeleton = (props) =>
	render(
		<ul>
			<TravellerSkeleton {...props} />
		</ul>,
	)

describe('TravellerSkeleton', () => {
	it('renders a list item hidden from assistive technology', () => {
		renderSkeleton()
		const root = screen.getByTestId(TRAVELLER_SKELETON.ROOT)
		expect(root.tagName).toBe('LI')
		expect(root).toHaveAttribute('aria-hidden', 'true')
	})

	// The signed-in description runs to its 250-character cap, which fills about five lines
	it.each([
		[false, 5],
		[true, 2],
	])(
		'gives the card (public: %s) %i text lines, three photo tiles and a View trip stub',
		(isPublic, lines) => {
			renderSkeleton({ isPublic })
			expect(
				screen.getByTestId(TRAVELLER_SKELETON.TEXT).children,
			).toHaveLength(lines)
			expect(
				screen
					.getByTestId(TRAVELLER_SKELETON.PHOTOS)
					.querySelectorAll('li'),
			).toHaveLength(3)
			expect(
				screen.getByTestId(TRAVELLER_SKELETON.BUTTON),
			).toBeInTheDocument()
		},
	)
})
