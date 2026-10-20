import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CONTACT_TRAVELLER_FIELDS } from '@/constants/travellers'
import { CONTACT_MESSAGE, VALIDATION_MESSAGES } from '@/constants/validation'

import { useContactTravellerForm } from './useContactTravellerForm'

const { EMAIL, MESSAGE } = CONTACT_TRAVELLER_FIELDS

const change = (result, id, value) =>
	act(() => result.current.handleInputChange({ target: { id, value } }))

const submit = (result, onSuccess) =>
	act(() =>
		result.current.submitHandler(onSuccess)({ preventDefault: vi.fn() }),
	)

describe('useContactTravellerForm', () => {
	it('prefills the email with the initial value', () => {
		const { result } = renderHook(() =>
			useContactTravellerForm('me@example.com'),
		)
		expect(result.current.formData[EMAIL].value).toBe('me@example.com')
	})

	it('flags an invalid email and an empty message on change', () => {
		const { result } = renderHook(() => useContactTravellerForm())
		change(result, EMAIL, 'not-an-email')
		change(result, MESSAGE, '   ')

		expect(result.current.formData[EMAIL]).toMatchObject({
			isValid: false,
			message: VALIDATION_MESSAGES.EMAIL_INVALID,
		})
		expect(result.current.formData[MESSAGE]).toMatchObject({
			isValid: false,
			message: VALIDATION_MESSAGES.MESSAGE_REQUIRED,
		})
	})

	it('flags a message over the maximum length', () => {
		const { result } = renderHook(() => useContactTravellerForm())
		change(result, MESSAGE, 'a'.repeat(CONTACT_MESSAGE.MAX_LENGTH))
		expect(result.current.formData[MESSAGE].isValid).toBe(true)

		change(result, MESSAGE, 'a'.repeat(CONTACT_MESSAGE.MAX_LENGTH + 1))
		expect(result.current.formData[MESSAGE]).toMatchObject({
			isValid: false,
			message: VALIDATION_MESSAGES.MESSAGE_TOO_LONG(
				CONTACT_MESSAGE.MAX_LENGTH,
			),
		})
	})

	it('blocks submission and marks every invalid field', () => {
		const onSuccess = vi.fn()
		const { result } = renderHook(() => useContactTravellerForm())
		submit(result, onSuccess)

		expect(onSuccess).not.toHaveBeenCalled()
		expect(result.current.formData[EMAIL].isValid).toBe(false)
		expect(result.current.formData[MESSAGE].isValid).toBe(false)
	})

	it('submits trimmed values when the form is valid', () => {
		const onSuccess = vi.fn()
		const { result } = renderHook(() =>
			useContactTravellerForm('me@example.com'),
		)
		change(result, MESSAGE, '  Hello there  ')
		submit(result, onSuccess)

		expect(onSuccess).toHaveBeenCalledWith({
			[EMAIL]: 'me@example.com',
			[MESSAGE]: 'Hello there',
		})
	})
})
