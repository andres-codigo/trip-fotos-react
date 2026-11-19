import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import TravellersSkeleton from '@/components/travellers/travellers-skeleton/TravellersSkeleton'
import {
	FILTER_SKELETON,
	TRAVELLER_SKELETON,
	TRAVELLERS_SKELETON,
} from '@/constants/test'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'

describe('TravellersSkeleton', () => {
	it('announces the load to screen readers', () => {
		render(<TravellersSkeleton />)
		expect(screen.getByRole('status')).toHaveTextContent(
			TRAVELLERS_LIST_CONFIG.LOADING_LABEL,
		)
	})

	it('shows the filter skeleton above a busy page of card skeletons', () => {
		render(<TravellersSkeleton />)
		const filter = screen.getByTestId(FILTER_SKELETON.ROOT)
		const list = screen.getByTestId(TRAVELLERS_SKELETON.LIST)
		expect(
			filter.compareDocumentPosition(list) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
		expect(list).toHaveAttribute('aria-busy', 'true')
		expect(screen.getAllByTestId(TRAVELLER_SKELETON.ROOT)).toHaveLength(
			TRAVELLERS_LIST_CONFIG.PAGE_SIZE,
		)
	})
})
