import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import BaseCard from '@/components/ui/card/BaseCard'

const BASE_CARD_SELECTOR = 'base-card'

describe('<BaseCard />', () => {
	it('renders its children in a styled div', () => {
		render(
			<BaseCard>
				<h1>Card Content</h1>
				text
			</BaseCard>,
		)

		const card = screen.getByTestId(BASE_CARD_SELECTOR)
		expect(card.tagName).toBe('DIV')
		expect(card).toHaveClass('rounded-lg')
		expect(card).toHaveTextContent('Card Contenttext')
	})

	it('keeps a custom className alongside the card styles', () => {
		render(<BaseCard className="custom-class">Content</BaseCard>)

		expect(screen.getByTestId(BASE_CARD_SELECTOR)).toHaveClass(
			'custom-class',
			'rounded-lg',
		)
	})

	it('lets a custom className override a conflicting utility', () => {
		render(<BaseCard className="p-8">Content</BaseCard>)

		const card = screen.getByTestId(BASE_CARD_SELECTOR)
		expect(card).toHaveClass('p-8')
		expect(card).not.toHaveClass('p-4')
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
