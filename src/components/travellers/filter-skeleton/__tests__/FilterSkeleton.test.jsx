import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import FilterSkeleton from '@/components/travellers/filter-skeleton/FilterSkeleton'
import { FILTER_SKELETON } from '@/constants/test'

const byDataCy = (container, id) => container.querySelector(`[data-cy="${id}"]`)

describe('FilterSkeleton', () => {
	it('renders a root hidden from assistive technology', () => {
		const { container } = render(<FilterSkeleton />)
		expect(byDataCy(container, FILTER_SKELETON.ROOT)).toHaveAttribute(
			'aria-hidden',
			'true',
		)
	})

	// The filter shows one form or the other by width, so the skeleton has both
	it('has the inline form, hidden at the mobile width, and the trigger bar shown only there', () => {
		const { container } = render(<FilterSkeleton />)
		expect(byDataCy(container, FILTER_SKELETON.INLINE)).toHaveClass(
			'mobile:hidden',
		)
		expect(byDataCy(container, FILTER_SKELETON.TRIGGER)).toHaveClass(
			'hidden',
			'mobile:block',
		)
	})

	it('gives the inline form a search field and a row of city chips', () => {
		const { container } = render(<FilterSkeleton />)
		const inline = byDataCy(container, FILTER_SKELETON.INLINE)
		expect(byDataCy(container, FILTER_SKELETON.SEARCH)).toBeInTheDocument()
		expect(inline.querySelectorAll('.h-11.rounded-pill')).toHaveLength(5)
	})
})
