import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import BaseBadge from '@/components/ui/badge/BaseBadge'

describe('<BaseBadge />', () => {
	it('renders the title', () => {
		render(<BaseBadge title="Tokyo" />)
		expect(screen.getByText('Tokyo')).toBeInTheDocument()
	})

	it('hides the pin icon from assistive technology', () => {
		const { container } = render(<BaseBadge title="Tokyo" />)
		expect(container.querySelector('svg')).toHaveAttribute(
			'aria-hidden',
			'true',
		)
	})
})
