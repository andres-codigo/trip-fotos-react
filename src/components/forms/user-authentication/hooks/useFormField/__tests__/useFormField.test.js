import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import useFormField from '@/components/forms/user-authentication/hooks/useFormField'

describe('useFormField', () => {
	it('should initialise with default values when no initial value provided', () => {
		const { result } = renderHook(() => useFormField())
		const [field] = result.current

		expect(field).toEqual({
			value: '',
			isValid: true,
			message: '',
		})
	})

	it('should initialise with custom initial value', () => {
		const initialValue = 'test@example.com'
		const { result } = renderHook(() => useFormField(initialValue))
		const [field] = result.current

		expect(field).toEqual({
			value: 'test@example.com',
			isValid: true,
			message: '',
		})
	})

	it.each([
		['a valid value and message', ['new value', true, 'Success message']],
		['an invalid value and error', ['invalid input', false, 'Required']],
		['only a value, using the defaults', ['just value'], [true, '']],
	])('updates the field with %s', (_, args, defaults = []) => {
		const { result } = renderHook(() => useFormField('initial'))
		const [, updateField] = result.current

		act(() => {
			updateField(...args)
		})

		const [value, isValid, message] = [...args, ...defaults]
		expect(result.current[0]).toEqual({ value, isValid, message })
	})

	it('should handle multiple sequential updates', () => {
		const { result } = renderHook(() => useFormField())
		const [, updateField] = result.current

		act(() => {
			updateField('first update', true, 'First message')
		})

		let [field] = result.current
		expect(field.value).toBe('first update')
		expect(field.message).toBe('First message')

		act(() => {
			updateField('second update', false, 'Error message')
		})

		const [finalField] = result.current
		expect(finalField).toEqual({
			value: 'second update',
			isValid: false,
			message: 'Error message',
		})
	})
})
