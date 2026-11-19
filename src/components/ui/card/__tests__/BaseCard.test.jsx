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
		render(
			<BaseCard
				id="custom-id"
				role="region">
				Content
			</BaseCard>,
		)

		const card = screen.getByTestId(BASE_CARD_SELECTOR)
		expect(card).not.toHaveAttribute('id')
		expect(card).not.toHaveAttribute('role')
	})
})
