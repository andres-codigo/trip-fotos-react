import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import InitialsAvatar from '@/components/ui/avatar/InitialsAvatar'

describe('<InitialsAvatar />', () => {
	it('renders the initials of the name', () => {
		render(<InitialsAvatar name="Amara Okafor" />)
		expect(screen.getByText('AO')).toBeInTheDocument()
	})

	it('is hidden from assistive technology and not focusable', () => {
		render(<InitialsAvatar name="Amara Okafor" />)
		const avatar = screen.getByText('AO')
		expect(avatar).toHaveAttribute('aria-hidden', 'true')
		expect(avatar).not.toHaveAttribute('tabindex')
	})

	it('merges a caller className last', () => {
		render(
			<InitialsAvatar
				name="Amara Okafor"
				className="size-12"
			/>,
		)
		const avatar = screen.getByText('AO')
		expect(avatar).toHaveClass('size-12')
		expect(avatar).not.toHaveClass('size-10')
	})
})
