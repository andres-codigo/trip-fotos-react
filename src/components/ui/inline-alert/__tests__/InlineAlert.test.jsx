import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import InlineAlert from '@/components/ui/inline-alert/InlineAlert'

describe('<InlineAlert />', () => {
	it('announces the message as an alert after a hidden icon', () => {
		render(<InlineAlert>Something went wrong.</InlineAlert>)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveTextContent('Something went wrong.')
		expect(alert.querySelector('svg')).toHaveAttribute(
			'aria-hidden',
			'true',
		)
	})

	it('renders no close button', () => {
		render(<InlineAlert>Invalid link.</InlineAlert>)

		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})
})
