import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CONTACT_TRAVELLER } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

describe('<ContactTravellerForm />', () => {
	it('asks only for a message, since the sender is the signed-in traveller', () => {
		render(<ContactTravellerForm onSubmit={vi.fn()} />)

		expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument()
		expect(screen.queryByRole('textbox', { name: /mail/i })).toBeNull()
		expect(screen.getAllByRole('textbox')).toEqual([
			screen.getByTestId(CONTACT_TRAVELLER.MESSAGE_INPUT),
		])
	})

	it('shows a validation error and does not submit an empty message', () => {
		const onSubmit = vi.fn()
		render(<ContactTravellerForm onSubmit={onSubmit} />)

		fireEvent.click(screen.getByTestId(CONTACT_TRAVELLER.SUBMIT))

		expect(onSubmit).not.toHaveBeenCalled()
		expect(
			screen.getByText(VALIDATION_MESSAGES.MESSAGE_REQUIRED),
		).toBeInTheDocument()
		expect(
			screen.queryByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).not.toBeInTheDocument()
	})

	it('submits only the trimmed message', () => {
		const onSubmit = vi.fn()
		render(<ContactTravellerForm onSubmit={onSubmit} />)

		fireEvent.change(screen.getByTestId(CONTACT_TRAVELLER.MESSAGE_INPUT), {
			target: { value: '  Hello  ' },
		})
		fireEvent.click(screen.getByTestId(CONTACT_TRAVELLER.SUBMIT))

		expect(onSubmit).toHaveBeenCalledWith({ message: 'Hello' })
	})

	it('disables the field and button while loading', () => {
		render(
			<ContactTravellerForm
				isLoading
				onSubmit={vi.fn()}
			/>,
		)
		expect(
			screen.getByTestId(CONTACT_TRAVELLER.MESSAGE_INPUT),
		).toBeDisabled()
		expect(screen.getByTestId(CONTACT_TRAVELLER.SUBMIT)).toBeDisabled()
	})
})
