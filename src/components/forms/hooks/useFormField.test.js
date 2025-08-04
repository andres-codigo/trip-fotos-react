import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useFormField from './useFormField'

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

	it('should update field with valid state', () => {
		const { result } = renderHook(() => useFormField())
		const [, updateField] = result.current

		act(() => {
			updateField('new value', true, 'Success message')
		})

		const [updatedField] = result.current
		expect(updatedField).toEqual({
			value: 'new value',
			isValid: true,
			message: 'Success message',
		})
	})

	it('should update field with invalid state and error message', () => {
		const { result } = renderHook(() => useFormField('initial'))
		const [, updateField] = result.current

		act(() => {
			updateField('invalid input', false, 'This field is required')
		})

		const [updatedField] = result.current
		expect(updatedField).toEqual({
			value: 'invalid input',
			isValid: false,
			message: 'This field is required',
		})
	})

	it('should use default parameters when updating field with minimal arguments', () => {
		const { result } = renderHook(() => useFormField())
		const [, updateField] = result.current

		act(() => {
			updateField('just value')
		})

		const [updatedField] = result.current
		expect(updatedField).toEqual({
			value: 'just value',
			isValid: true,
			message: '',
		})
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

	it('should handle empty string values', () => {
		const { result } = renderHook(() => useFormField('initial'))
		const [, updateField] = result.current

		act(() => {
			updateField('', false, 'Field cannot be empty')
		})

		const [updatedField] = result.current
		expect(updatedField).toEqual({
			value: '',
			isValid: false,
			message: 'Field cannot be empty',
		})
	})

	it('should handle special characters and whitespace', () => {
		const { result } = renderHook(() => useFormField())
		const [, updateField] = result.current

		act(() => {
			updateField('  special@chars!#$%  ', true, 'Valid format')
		})

		const [updatedField] = result.current
		expect(updatedField.value).toBe('  special@chars!#$%  ')
		expect(updatedField.isValid).toBe(true)
		expect(updatedField.message).toBe('Valid format')
	})

	it('should return an array with field object and updateField function', () => {
		const { result } = renderHook(() => useFormField())
		const hookReturn = result.current

		expect(Array.isArray(hookReturn)).toBe(true)
		expect(hookReturn).toHaveLength(2)
		expect(typeof hookReturn[0]).toBe('object')
		expect(typeof hookReturn[1]).toBe('function')
	})
})
