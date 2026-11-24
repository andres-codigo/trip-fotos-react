import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import BaseCard from '@/components/ui/card/BaseCard'

const BASE_CARD_SELECTOR = 'base-card'

describe('<BaseCard />', () => {
	it('renders its children', () => {
		render(
			<BaseCard>
				<h1>Card Content</h1>
				text
			</BaseCard>,
		)

		expect(screen.getByTestId(BASE_CARD_SELECTOR)).toHaveTextContent(
			'Card Contenttext',
		)
	})

	it('does not spread arbitrary props onto the div', () => {
		render(<BaseCard role="region">Content</BaseCard>)

		expect(screen.getByTestId(BASE_CARD_SELECTOR)).not.toHaveAttribute(
			'role',
		)
	})

	// A hash link lands on the card itself, so its top edge shows under the header
	it('takes an id and a ref for an anchor', () => {
		const ref = createRef()
		render(
			<BaseCard
				id="photos"
				ref={ref}>
				Content
			</BaseCard>,
		)

		const card = screen.getByTestId(BASE_CARD_SELECTOR)
		expect(card).toHaveAttribute('id', 'photos')
		expect(ref.current).toBe(card)
	})
})
