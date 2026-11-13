import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import { BADGE, IMAGE, PUBLIC_TRAVELLER_ITEM } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'

import PublicTravellerItem from '@/components/travellers/public-traveller-item/PublicTravellerItem'

const cover = {
	url: 'https://example.com/amara.jpg',
	dimensions: { width: 1600, height: 900 },
	thumbnails: [
		{ width: 640, url: 'https://example.com/amara-640w.jpg' },
		{ width: 320, url: 'https://example.com/amara-320w.jpg' },
	],
	alt: 'Lanterns over a night market',
}

const baseProps = {
	id: 'abc',
	firstName: 'Amara',
	lastInitial: 'O',
	tripStart: '2024-03-05',
	tripEnd: '2024-03-11',
	cities: [
		'tokyo',
		{ id: 'p1', city: 'Paris', region: 'IDF', country: 'France' },
	],
	cover,
}

const renderItem = (props = {}) =>
	render(
		<MemoryRouter>
			<ul>
				<PublicTravellerItem
					{...baseProps}
					{...props}
				/>
			</ul>
		</MemoryRouter>,
	)

describe('<PublicTravellerItem />', () => {
	it('shows the first name and last initial', () => {
		renderItem()
		expect(
			screen.getByRole('heading', { level: 3, name: 'Amara O.' }),
		).toHaveAttribute('data-cy', PUBLIC_TRAVELLER_ITEM.NAME)
	})

	it('shows only the first name when there is no last initial', () => {
		renderItem({ lastInitial: null })
		expect(
			screen.getByTestId(PUBLIC_TRAVELLER_ITEM.NAME),
		).toHaveTextContent(/^Amara$/)
	})

	it('shows the trip dates and length', () => {
		renderItem()
		const trip = screen.getByTestId(PUBLIC_TRAVELLER_ITEM.TRIP)
		expect(trip).toHaveTextContent('5–11 Mar 2024')
		expect(trip).toHaveTextContent('7 days')
	})

	it('shows a badge per city', () => {
		renderItem()
		const badges = within(
			screen.getByTestId(PUBLIC_TRAVELLER_ITEM.BADGES),
		).getAllByTestId(BADGE.ID)
		expect(badges).toHaveLength(2)
		expect(badges[0]).toHaveTextContent(/tokyo/i)
		expect(badges[1]).toHaveTextContent('Paris')
	})

	it('shows the cover as a plain image with its alt text and thumbnails', () => {
		renderItem()
		const img = within(
			screen.getByTestId(PUBLIC_TRAVELLER_ITEM.COVER),
		).getByAltText(cover.alt)
		expect(img).toHaveAttribute(
			'srcset',
			'https://example.com/amara-320w.jpg 320w, https://example.com/amara-640w.jpg 640w',
		)
		expect(img.closest('a, button')).toBeNull()
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})

	it('names the cover after the traveller when it has no alt text', () => {
		renderItem({ cover: { ...cover, alt: null } })
		expect(screen.getByAltText("Amara O.'s photo")).toBeInTheDocument()
	})

	it('shows no photo tile without a cover', () => {
		renderItem({ cover: null })
		expect(
			screen.queryByTestId(PUBLIC_TRAVELLER_ITEM.COVER),
		).not.toBeInTheDocument()
		expect(screen.queryByRole('img')).not.toBeInTheDocument()
	})

	it('shows the unavailable tile when the cover fails to load', () => {
		renderItem({ cover: { ...cover, thumbnails: null } })
		fireEvent.error(screen.getByAltText(cover.alt))
		expect(screen.getByTestId(IMAGE.FALLBACK)).toHaveTextContent(
			GLOBAL.IMAGE_UNAVAILABLE,
		)
	})

	it('links View trip through sign-in, back to the full trip', () => {
		renderItem()
		const link = screen.getByRole('link', {
			name: TRAVELLER_ITEM_CONFIG.VIEW_LABEL,
		})
		expect(link).toHaveAttribute(
			'href',
			'/authentication?redirect=%2Ftravellers%2Fabc',
		)
	})
})
