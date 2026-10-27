import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

describe('<ErrorMessage />', () => {
	it('renders the message as a paragraph with role="alert"', () => {
		render(<ErrorMessage>Something went wrong.</ErrorMessage>)

		const alert = screen.getByRole('alert')
		expect(alert.tagName).toBe('P')
		expect(alert).toHaveTextContent('Something went wrong.')
	})

	it('applies the id, class name and extra attributes', () => {
		render(
			<ErrorMessage
				id="email-error"
				className="error"
				data-cy-error="email">
				Invalid email.
			</ErrorMessage>,
		)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveAttribute('id', 'email-error')
		expect(alert).toHaveClass('error')
		expect(alert).toHaveAttribute('data-cy-error', 'email')
	})
})
