import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useTravellerRegistration } from '../useTravellerRegistration'

/**
 * useTravellerRegistration Hook Unit Tests
 *
 * Tests the custom hook that manages traveller registration form state and logic.
 *
 * Hook Behavior:
 * - Manages form data for firstName, lastName, description, days, and areas fields
 * - Each field has val and isValid properties
 * - Provides handleInputChange for text/number inputs
 * - Provides handleCheckboxChange for checkbox inputs (areas)
 * - Validates all fields on submission
 * - submitHandler prevents default form submission and validates form
 * - Does not return values from submitHandler (void function)
 *
 * Test Coverage:
 * - Initial state verification
 * - Input change handling
 * - Checkbox change handling (add/remove areas)
 * - Form validation (valid/invalid cases)
 * - Submit handler behavior (preventDefault, validation)
 * - Edge cases: empty strings, invalid numbers, no areas selected
 */

describe('useTravellerRegistration', () => {
	it('should initialise with default form state', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		expect(result.current.formData).toEqual({
			firstName: { val: '', isValid: true },
			lastName: { val: '', isValid: true },
			description: { val: '', isValid: true },
			days: { val: '', isValid: true },
			areas: { val: [], isValid: true },
		})
		expect(result.current.formIsValid).toBe(true)
	})

	it('should handle input change for text fields', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
		})

		expect(result.current.formData.firstName).toEqual({
			val: 'John',
			isValid: true,
		})
	})

	it('should handle input change for number fields', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleInputChange({
				target: { id: 'days', value: '5' },
			})
		})

		expect(result.current.formData.days).toEqual({
			val: '5',
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

		expect(result.current.formData.areas).toEqual({
			val: ['north'],
			isValid: true,
		})
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

		expect(result.current.formData.areas.val).toEqual(['north', 'south'])

		// Then remove one
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: false },
			})
		})

		expect(result.current.formData.areas.val).toEqual(['south'])
	})

	it('should handle multiple checkbox selections', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
			result.current.handleCheckboxChange({
				target: { value: 'south', checked: true },
			})
			result.current.handleCheckboxChange({
				target: { value: 'east', checked: true },
			})
		})

		expect(result.current.formData.areas.val).toEqual([
			'north',
			'south',
			'east',
		])
	})

	it('should prevent default on form submission', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = {
			preventDefault: vi.fn(),
		}

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1)
	})

	it('should invalidate form when firstName is empty', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		// Fill all fields except firstName
		act(() => {
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test description' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should invalidate form when lastName is empty', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test description' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.lastName.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should invalidate form when description is empty', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.description.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should invalidate form when days is empty or invalid', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test description' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.days.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should invalidate form when days is zero or negative', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test description' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '0' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.days.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should invalidate form when no areas are selected', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test description' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.areas.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should validate successfully with all valid data', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }
		const consoleSpy = vi.spyOn(console, 'log')

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'I love traveling!' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '5' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formIsValid).toBe(true)
		expect(result.current.formData.firstName.isValid).toBe(true)
		expect(result.current.formData.lastName.isValid).toBe(true)
		expect(result.current.formData.description.isValid).toBe(true)
		expect(result.current.formData.days.isValid).toBe(true)
		expect(result.current.formData.areas.isValid).toBe(true)
		expect(consoleSpy).toHaveBeenCalledWith('Form Submitted', {
			first: 'John',
			last: 'Doe',
			desc: 'I love traveling!',
			days: '5',
			areas: ['north'],
		})

		consoleSpy.mockRestore()
	})

	it('should not return a value from submitHandler', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		// Test with invalid form
		const invalidResult = act(() => {
			return result.current.submitHandler(mockEvent)
		})
		expect(invalidResult).toBeUndefined()

		// Test with valid form
		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		const validResult = act(() => {
			return result.current.submitHandler(mockEvent)
		})
		expect(validResult).toBeUndefined()
	})

	it('should trim whitespace when validating text fields', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: '   ' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Doe' },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: 'Test' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
			result.current.handleCheckboxChange({
				target: { value: 'north', checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(false)
		expect(result.current.formIsValid).toBe(false)
	})

	it('should reset field validity when user changes input after validation error', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }

		// Trigger validation error
		act(() => {
			result.current.submitHandler(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(false)

		// User types in the field
		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'John' },
			})
		})

		expect(result.current.formData.firstName.isValid).toBe(true)
	})

	it('should return expected hook properties', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		expect(result.current).toHaveProperty('formData')
		expect(result.current).toHaveProperty('formIsValid')
		expect(result.current).toHaveProperty('handleInputChange')
		expect(result.current).toHaveProperty('handleCheckboxChange')
		expect(result.current).toHaveProperty('submitHandler')
		expect(typeof result.current.handleInputChange).toBe('function')
		expect(typeof result.current.handleCheckboxChange).toBe('function')
		expect(typeof result.current.submitHandler).toBe('function')
	})
})
