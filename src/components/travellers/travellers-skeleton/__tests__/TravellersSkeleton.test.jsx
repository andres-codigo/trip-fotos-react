import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import TravellersSkeleton from '@/components/travellers/travellers-skeleton/TravellersSkeleton'
import {
	FILTER_SKELETON,
	TRAVELLER_SKELETON,
	TRAVELLERS_SKELETON,
} from '@/constants/test'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'

const byDataCy = (container, id) =>
	container.querySelectorAll(`[data-cy="${id}"]`)

describe('TravellersSkeleton', () => {
	// Shown, the line would leave when the list arrives and pull the page up
	it('announces the load to screen readers without showing the line', () => {
		render(<TravellersSkeleton />)
		const status = screen.getByRole('status')
		expect(status).toHaveTextContent(TRAVELLERS_LIST_CONFIG.LOADING_LABEL)
		expect(status).toHaveClass('sr-only')
	})

	it('shows the filter skeleton above a busy page of card skeletons', () => {
		const { container } = render(<TravellersSkeleton />)
		const [filter] = byDataCy(container, FILTER_SKELETON.ROOT)
		const [list] = byDataCy(container, TRAVELLERS_SKELETON.LIST)
		expect(
			filter.compareDocumentPosition(list) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
		expect(list).toHaveAttribute('aria-busy', 'true')
		expect(byDataCy(container, TRAVELLER_SKELETON.ROOT)).toHaveLength(
			TRAVELLERS_LIST_CONFIG.PAGE_SIZE,
		)
	})

	it.each([
		[false, 5],
		[true, 2],
	])('passes the card shape on (public: %s)', (isPublic, lines) => {
		const { container } = render(<TravellersSkeleton isPublic={isPublic} />)
		const [text] = byDataCy(container, TRAVELLER_SKELETON.TEXT)
		expect(text.children).toHaveLength(lines)
	})
})
