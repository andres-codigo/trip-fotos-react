import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'
import { TRAVELLER_SKELETON } from '@/constants/test'

describe('TravellerSkeleton', () => {
	it('renders a list item hidden from assistive technology', () => {
		const { container } = render(
			<ul>
				<TravellerSkeleton />
			</ul>,
		)
		const root = container.querySelector(
			`[data-cy="${TRAVELLER_SKELETON.ROOT}"]`,
		)
		expect(root.tagName).toBe('LI')
		expect(root).toHaveAttribute('aria-hidden', 'true')
	})

	it('renders ten animated blocks', () => {
		const { container } = render(
			<ul>
				<TravellerSkeleton />
			</ul>,
		)
		expect(container.querySelectorAll('.animate-skeleton')).toHaveLength(10)
	})
})
