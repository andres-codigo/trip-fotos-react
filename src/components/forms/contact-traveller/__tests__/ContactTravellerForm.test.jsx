import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CONTACT_TRAVELLER } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

describe('<ContactTravellerForm />', () => {
	it('prefills and locks the signed-in user email', () => {
		render(
			<ContactTravellerForm
				userEmail="me@example.com"
				onSubmit={vi.fn()}
			/>,
		)
		const email = screen.getByTestId(CONTACT_TRAVELLER.EMAIL_INPUT)
		expect(email).toHaveValue('me@example.com')
		expect(email).toBeDisabled()
	})

	it('shows validation errors and does not submit an empty form', () => {
		const onSubmit = vi.fn()
		render(<ContactTravellerForm onSubmit={onSubmit} />)

		fireEvent.click(screen.getByTestId(CONTACT_TRAVELLER.SUBMIT))

		expect(onSubmit).not.toHaveBeenCalled()
		expect(
			screen.getByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).toBeInTheDocument()
		expect(
			screen.getByText(VALIDATION_MESSAGES.MESSAGE_REQUIRED),
		).toBeInTheDocument()
	})

	it('submits the email and message', () => {
		const onSubmit = vi.fn()
		render(<ContactTravellerForm onSubmit={onSubmit} />)

		fireEvent.change(screen.getByTestId(CONTACT_TRAVELLER.EMAIL_INPUT), {
			target: { value: 'me@example.com' },
		})
		fireEvent.change(screen.getByTestId(CONTACT_TRAVELLER.MESSAGE_INPUT), {
			target: { value: 'Hello' },
		})
		fireEvent.click(screen.getByTestId(CONTACT_TRAVELLER.SUBMIT))

		expect(onSubmit).toHaveBeenCalledWith({
			email: 'me@example.com',
			message: 'Hello',
		})
	})

	it('disables the fields and button while loading', () => {
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
