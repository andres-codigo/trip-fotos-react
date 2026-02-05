import { render, screen } from '@testing-library/react'
import { renderVisuallyHiddenError } from '../errorUtils'

describe('renderVisuallyHiddenError', () => {
	it('returns null if fieldState is undefined', () => {
		const result = renderVisuallyHiddenError(
			undefined,
			'test-id',
			'test-class',
		)
		expect(result).toBeNull()
	})

	it('returns null if fieldState is valid', () => {
		const fieldState = { isValid: true, message: 'some error' }
		const result = renderVisuallyHiddenError(
			fieldState,
			'test-id',
			'test-class',
		)
		expect(result).toBeNull()
	})

	it('returns null if fieldState has no message', () => {
		const fieldState = { isValid: false, message: '' }
		const result = renderVisuallyHiddenError(
			fieldState,
			'test-id',
			'test-class',
		)
		expect(result).toBeNull()
	})

	it('renders the error span if fieldState is invalid and has a message', () => {
		const fieldState = { isValid: false, message: 'Test Error' }
		render(renderVisuallyHiddenError(fieldState, 'test-id', 'test-class'))

		const span = screen.getByRole('alert')
		expect(span).toBeInTheDocument()
		expect(span).toHaveAttribute('id', 'test-id')
		expect(span).toHaveClass('test-class')
		expect(span).toHaveTextContent('Test Error')
	})
})
