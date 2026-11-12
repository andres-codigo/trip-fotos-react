import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CONTACT_TRAVELLER_FIELDS } from '@/constants/travellers'
import { CONTACT_MESSAGE, VALIDATION_MESSAGES } from '@/constants/validation'

import useContactTravellerForm from '@/components/forms/contact-traveller/hooks/useContactTravellerForm'

const { MESSAGE } = CONTACT_TRAVELLER_FIELDS

const change = (result, id, value) =>
	act(() => result.current.handleInputChange({ target: { id, value } }))

const blur = (result, id, value) =>
	act(() => result.current.handleInputBlur({ target: { id, value } }))

const submit = (result, onSuccess) =>
	act(() =>
		result.current.submitHandler(onSuccess)({ preventDefault: vi.fn() }),
	)

describe('useContactTravellerForm', () => {
	it('starts with only an empty, valid message field', () => {
		const { result } = renderHook(() => useContactTravellerForm())
		expect(result.current.formData).toEqual({
			[MESSAGE]: { value: '', message: '', isValid: true },
		})
	})

	it('raises no error while typing, flags an empty message when the field is left, and clears it as text is typed', () => {
		const { result } = renderHook(() => useContactTravellerForm())
		change(result, MESSAGE, '   ')
		expect(result.current.formData[MESSAGE].isValid).toBe(true)

		blur(result, MESSAGE, '   ')
		expect(result.current.formData[MESSAGE]).toMatchObject({
			isValid: false,
			message: VALIDATION_MESSAGES.MESSAGE_REQUIRED,
		})

		change(result, MESSAGE, 'Hello')
		expect(result.current.formData[MESSAGE]).toMatchObject({
			isValid: true,
			message: '',
		})
	})

	it('flags a message over the maximum length when the field is left', () => {
		const { result } = renderHook(() => useContactTravellerForm())
		blur(result, MESSAGE, 'a'.repeat(CONTACT_MESSAGE.MAX_LENGTH))
		expect(result.current.formData[MESSAGE].isValid).toBe(true)

		blur(result, MESSAGE, 'a'.repeat(CONTACT_MESSAGE.MAX_LENGTH + 1))
		expect(result.current.formData[MESSAGE]).toMatchObject({
			isValid: false,
			message: VALIDATION_MESSAGES.MESSAGE_TOO_LONG(
				CONTACT_MESSAGE.MAX_LENGTH,
			),
		})
	})

	it('moves focus to the message on a failed submit', () => {
		const field = document.createElement('textarea')
		field.id = MESSAGE
		document.body.append(field)
		const { result } = renderHook(() => useContactTravellerForm())

		submit(result, vi.fn())

		expect(document.activeElement).toBe(field)
		field.remove()
	})

	it('blocks submission and marks an empty message invalid', () => {
		const onSuccess = vi.fn()
		const { result } = renderHook(() => useContactTravellerForm())
		submit(result, onSuccess)

		expect(onSuccess).not.toHaveBeenCalled()
		expect(result.current.formData[MESSAGE].isValid).toBe(false)
	})

	it('blocks submission of a message over the maximum length', () => {
		const onSuccess = vi.fn()
		const { result } = renderHook(() => useContactTravellerForm())
		change(result, MESSAGE, 'a'.repeat(CONTACT_MESSAGE.MAX_LENGTH + 1))
		submit(result, onSuccess)

		expect(onSuccess).not.toHaveBeenCalled()
	})

	it('submits only the trimmed message when the form is valid', () => {
		const onSuccess = vi.fn()
		const { result } = renderHook(() => useContactTravellerForm())
		change(result, MESSAGE, '  Hello there  ')
		submit(result, onSuccess)

		expect(onSuccess).toHaveBeenCalledWith({ [MESSAGE]: 'Hello there' })
	})
})
