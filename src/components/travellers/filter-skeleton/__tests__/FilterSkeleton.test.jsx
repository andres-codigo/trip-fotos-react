import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import FilterSkeleton from '@/components/travellers/filter-skeleton/FilterSkeleton'
import { FILTER_SKELETON } from '@/constants/test'

describe('FilterSkeleton', () => {
	it('renders a root hidden from assistive technology', () => {
		render(<FilterSkeleton />)
		expect(screen.getByTestId(FILTER_SKELETON.ROOT)).toHaveAttribute(
			'aria-hidden',
			'true',
		)
	})

	it('gives the inline form a search field', () => {
		render(<FilterSkeleton />)
		expect(screen.getByTestId(FILTER_SKELETON.INLINE)).toContainElement(
			screen.getByTestId(FILTER_SKELETON.SEARCH),
		)
	})
})
