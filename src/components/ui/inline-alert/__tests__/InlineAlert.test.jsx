import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { INLINE_ALERT } from '@/constants/test'

import InlineAlert from '@/components/ui/inline-alert/InlineAlert'

describe('<InlineAlert />', () => {
	it('announces the message as an alert after a hidden icon', () => {
		render(<InlineAlert>Something went wrong.</InlineAlert>)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveTextContent('Something went wrong.')
		expect(alert).toHaveAttribute('data-cy', INLINE_ALERT.ID)
		expect(alert.querySelector('svg')).toHaveAttribute(
			'aria-hidden',
			'true',
		)
	})

	it('merges the class name and takes a data-cy', () => {
		render(
			<InlineAlert
				className="mt-4"
				data-cy="custom-alert">
				Invalid link.
			</InlineAlert>,
		)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('mt-4', 'bg-danger-surface', 'border-danger')
		expect(alert).toHaveAttribute('data-cy', 'custom-alert')
	})

	it('renders no close button', () => {
		render(<InlineAlert>Invalid link.</InlineAlert>)

		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})
})
