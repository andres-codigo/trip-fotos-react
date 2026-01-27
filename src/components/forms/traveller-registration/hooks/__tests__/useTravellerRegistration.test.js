import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useTravellerRegistration } from '../useTravellerRegistration'

/**
 * useTravellerRegistration Hook Unit Tests
 *
 * Tests the custom hook that manages traveller registration form state and logic.
 *
 * Updated for current implementation:
 * - State shape uses { value, message, isValid }
 * - submitHandler is a higher-order function: (onSuccess) => (event) => void
 * - Validation occurs on change and on submit
 */

describe('useTravellerRegistration', () => {
	it('should initialise with default form state', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		expect(result.current.formData).toEqual({
			firstName: { value: '', message: '', isValid: true },
			lastName: { value: '', message: '', isValid: true },
			description: { value: '', message: '', isValid: true },
			days: { value: '', message: '', isValid: true },
			areas: { value: [], message: '', isValid: true },
		})
	})

	it('should handle input change and validate text fields', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
		})

		expect(result.current.formData.firstName).toEqual({
			value: 'John',
			message: '',
			isValid: true,
		})
	})

	it('should handle input change and validate number fields', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleInputChange({
				target: { id: 'days', value: '5' },
			})
		})

		expect(result.current.formData.days).toEqual({
			value: '5',
			message: '',
			isValid: true,
		})
	})

	it('should add area when checkbox is checked', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		expect(result.current.formData.areas.value).toEqual(['north'])
		expect(result.current.formData.areas.isValid).toBe(true)
	})

	it('should remove area when checkbox is unchecked', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		// First add two areas
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: 'south', checked: true },
			})
		})

		expect(result.current.formData.areas.value).toEqual(['north', 'south'])

		// Then remove one
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: false },
			})
		})

		expect(result.current.formData.areas.value).toEqual(['south'])
	})

	it('should prevent default on form submission', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = {
			preventDefault: vi.fn(),
		}
		const mockOnSuccess = vi.fn()

		act(() => {
			// submitHandler is curried: submitHandler(onSuccess)(event)
			result.current.submitHandler(mockOnSuccess)(mockEvent)
		})

		expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1)
	})

	it('should invalidate form when fields are empty on submit', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }
		const mockOnSuccess = vi.fn()

		act(() => {
			result.current.submitHandler(mockOnSuccess)(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(false)
		expect(result.current.formData.firstName.message).toBeTruthy()
		expect(result.current.formData.lastName.isValid).toBe(false)
		expect(result.current.formData.description.isValid).toBe(false)
		expect(result.current.formData.days.isValid).toBe(false)
		expect(result.current.formData.areas.isValid).toBe(false)
		expect(mockOnSuccess).not.toHaveBeenCalled()
	})

	it('should validate successfully and call onSuccess with data', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }
		const mockOnSuccess = vi.fn()
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'I love travelling!' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '5' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockOnSuccess)(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(true)
		expect(mockOnSuccess).toHaveBeenCalledWith({
			firstName: 'John',
			lastName: 'Doe',
			description: 'I love travelling!',
			daysInCity: '5',
			areas: ['north'],
		})
		expect(consoleSpy).toHaveBeenCalled()

		consoleSpy.mockRestore()
	})

	it('should validate empty strings as invalid during input change', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: '' }, // First empty
			})
		})

		expect(result.current.formData.firstName.isValid).toBe(false)
		expect(result.current.formData.firstName.message).toBeTruthy()

		// Change to whitespace only
		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: '   ' },
			})
		})

		expect(result.current.formData.firstName.isValid).toBe(false)
	})

	it('should recover from invalid state when user corrects input', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		// Set invalid initially
		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: '' },
			})
		})

		expect(result.current.formData.firstName.isValid).toBe(false)

		// User corrects input
		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
		})

		expect(result.current.formData.firstName.isValid).toBe(true)
		expect(result.current.formData.firstName.message).toBe('')
	})

	it('should return expected hook properties', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		expect(result.current).toHaveProperty('formData')
		expect(result.current).toHaveProperty('handleInputChange')
		expect(result.current).toHaveProperty('handleCheckboxChange')
		expect(result.current).toHaveProperty('submitHandler')
		expect(typeof result.current.handleInputChange).toBe('function')
		expect(typeof result.current.handleCheckboxChange).toBe('function')
		expect(typeof result.current.submitHandler).toBe('function')
	})
})
