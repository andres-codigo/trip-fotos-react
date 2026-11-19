import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TravellerCardHead from '@/components/travellers/traveller-card-head/TravellerCardHead'
import { AVATAR, TRAVELLER_CARD_HEAD, YOU_TAG } from '@/constants/test'

const NAME_ID = 'card-head-name-test'
const TRIP_ID = 'card-head-trip-test'

const renderHead = (props = {}) =>
	render(
		<TravellerCardHead
			name="Amara Okafor"
			tripStart="2025-03-12"
			tripEnd="2025-03-19"
			nameDataCy={NAME_ID}
			tripDataCy={TRIP_ID}
			{...props}
		/>,
	)

describe('<TravellerCardHead />', () => {
	it.each([
		['a full name', 'Amara Okafor'],
		['a public short name', 'Amara O.'],
	])('shows the initials for %s', (_, name) => {
		renderHead({ name })

		expect(screen.getByTestId(AVATAR.ROOT)).toHaveTextContent(/^AO$/)
		expect(
			screen.getByRole('heading', { level: 3, name }),
		).toBeInTheDocument()
	})

	it('shows the "You" tag only for the signed-in traveller', () => {
		const { rerender } = renderHead()
		expect(screen.queryByTestId(YOU_TAG.ROOT)).not.toBeInTheDocument()

		rerender(
			<TravellerCardHead
				name="Amara Okafor"
				isOwn
			/>,
		)
		expect(screen.getByTestId(YOU_TAG.ROOT)).toHaveTextContent(/^You$/)
	})

	it('renders no trip line without dates or days', () => {
		renderHead({ tripStart: undefined, tripEnd: undefined })

		expect(screen.getByTestId(TRAVELLER_CARD_HEAD.ROOT)).toBeInTheDocument()
		expect(screen.queryByTestId(TRIP_ID)).not.toBeInTheDocument()
		expect(screen.queryByText(/Trip:/)).not.toBeInTheDocument()
	})
})
