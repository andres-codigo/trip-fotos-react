import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { MOCK_TRAVELLERS } from '@/constants/test/mock-data/mock-travellers'
import { VALIDATION_MESSAGES } from '@/constants/validation'

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
				target: {
					id: 'firstName',
					value: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
				},
			})
		})

		expect(result.current.formData.firstName).toEqual({
			value: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
			message: '',
			isValid: true,
		})
	})

	it('should handle input change and validate number fields', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleInputChange({
				target: {
					id: 'days',
					value: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity.toString(),
				},
			})
		})

		expect(result.current.formData.days).toEqual({
			value: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity.toString(),
			message: '',
			isValid: true,
		})
	})

	it('should add area when checkbox is checked', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const area = MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.areas[0]

		act(() => {
			result.current.handleCheckboxChange({
				target: { value: area, checked: true },
			})
		})

		expect(result.current.formData.areas.value).toEqual([area])
		expect(result.current.formData.areas.isValid).toBe(true)
	})

	it('should remove area when checkbox is unchecked', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const area1 = MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.areas[0]
		const area2 = MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO.areas[0]

		// First add two areas
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: area1, checked: true },
			})
		})
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: area2, checked: true },
			})
		})

		expect(result.current.formData.areas.value).toEqual([area1, area2])

		// Then remove one
		act(() => {
			result.current.handleCheckboxChange({
				target: { value: area1, checked: false },
			})
		})

		expect(result.current.formData.areas.value).toEqual([area2])
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
		expect(result.current.formData.firstName.message).toBe(
			VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
		)
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

		const { firstName, lastName, description, daysInCity, areas } =
			MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: firstName },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: lastName },
			})
			result.current.handleInputChange({
				target: { id: 'description', value: description },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: daysInCity.toString() },
			})
			result.current.handleCheckboxChange({
				target: { value: areas[0], checked: true },
			})
		})

		act(() => {
			result.current.submitHandler(mockOnSuccess)(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(true)
		expect(mockOnSuccess).toHaveBeenCalledWith({
			firstName,
			lastName,
			description,
			daysInCity: daysInCity.toString(),
			areas,
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
		expect(result.current.formData.firstName.message).toBe(
			VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
		)

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
				target: {
					id: 'firstName',
					value: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
				},
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
