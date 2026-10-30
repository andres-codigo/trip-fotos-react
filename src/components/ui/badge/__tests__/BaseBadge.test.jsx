import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TRAVELLER_AREAS } from '@/constants/travellers'

import BaseBadge from '@/components/ui/badge/BaseBadge'

describe('<BaseBadge />', () => {
	it('renders the title in a span', () => {
		render(<BaseBadge title="Tokyo" />)
		const badge = screen.getByText('Tokyo')
		expect(badge.tagName).toBe('SPAN')
		expect(badge).toHaveTextContent('Tokyo')
	})

	it.each(TRAVELLER_AREAS)(
		'gives the %s type a stable tone',
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
			expect(first).toMatch(/\bbg-badge-[0-7]\b/)
			expect(screen.getByText(area).className).toBe(first)
		},
	)

	it('uses the neutral tone when no type is given', () => {
		render(<BaseBadge title="Other" />)
		expect(screen.getByText('Other').className).not.toMatch(/bg-badge-/)
	})
})
