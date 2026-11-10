import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CONTACT_TRAVELLER_FIELDS } from '@/constants/travellers'
import { CONTACT_MESSAGE, VALIDATION_MESSAGES } from '@/constants/validation'

import useContactTravellerForm from '@/components/forms/contact-traveller/hooks/useContactTravellerForm'

const { MESSAGE } = CONTACT_TRAVELLER_FIELDS

const change = (result, id, value) =>
	act(() => result.current.handleInputChange({ target: { id, value } }))

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

	it('flags an empty message on change and clears it once text is entered', () => {
		const { result } = renderHook(() => useContactTravellerForm())
		change(result, MESSAGE, '   ')

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
