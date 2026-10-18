import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TRAVELLER_AREAS } from '@/constants/travellers'

import BaseBadge from '@/components/ui/badge/BaseBadge'

vi.mock('@/components/ui/badge/BaseBadge.module.scss', () => ({
	default: {
		badge: 'badge',
		tokyo: 'tokyo',
		prague: 'prague',
		sydney: 'sydney',
		canberra: 'canberra',
	},
}))

describe('<BaseBadge />', () => {
	it('renders the title in a span', () => {
		render(<BaseBadge title="Tokyo" />)
		const badge = screen.getByText('Tokyo')
		expect(badge.tagName).toBe('SPAN')
		expect(badge).toHaveClass('badge')
	})

	it.each(TRAVELLER_AREAS)('applies the %s type class', (area) => {
		render(
			<BaseBadge
				type={area}
				title={area}
			/>,
		)
		expect(screen.getByText(area)).toHaveClass('badge', area)
	})

	it('only has the badge class when no type is given', () => {
		render(<BaseBadge title="Other" />)
		expect(screen.getByText('Other').className).toBe('badge')
	})
})
