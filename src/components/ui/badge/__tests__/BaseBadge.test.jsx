import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TRAVELLER_AREAS } from '@/constants/travellers'

import BaseBadge from '@/components/ui/badge/BaseBadge'

vi.mock('@/components/ui/badge/BaseBadge.module.scss', () => ({
	default: {
		badge: 'badge',
		tone0: 'tone0',
		tone1: 'tone1',
		tone2: 'tone2',
		tone3: 'tone3',
		tone4: 'tone4',
		tone5: 'tone5',
		tone6: 'tone6',
		tone7: 'tone7',
	},
}))

describe('<BaseBadge />', () => {
	it('renders the title in a span', () => {
		render(<BaseBadge title="Tokyo" />)
		const badge = screen.getByText('Tokyo')
		expect(badge.tagName).toBe('SPAN')
		expect(badge).toHaveClass('badge')
	})

	it.each(TRAVELLER_AREAS)(
		'gives the %s type a stable tone class',
		(area) => {
			const { unmount } = render(
				<BaseBadge
					type={area}
					title={area}
				/>,
			)
			const first = screen.getByText(area).className
			unmount()
			render(
				<BaseBadge
					type={area}
					title={area}
				/>,
			)
			expect(first).toMatch(/^badge tone[0-7]$/)
			expect(screen.getByText(area).className).toBe(first)
		},
	)

	it('only has the badge class when no type is given', () => {
		render(<BaseBadge title="Other" />)
		expect(screen.getByText('Other').className).toBe('badge')
	})
})
