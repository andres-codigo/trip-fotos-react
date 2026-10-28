import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { MOCK_CITIES, MOCK_TRAVELLERS } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import useTravellerRegistration from '@/components/forms/traveller-registration/hooks/useTravellerRegistration'

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
			tripDescription: { value: '', message: '', isValid: true },
			days: { value: '', message: '', isValid: true },
			cities: { value: [], message: '', isValid: true },
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

	it('adds a selected city object and validates the field', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCityAdd(MOCK_CITIES.TOKYO)
		})

		expect(result.current.formData.cities.value).toEqual([
			MOCK_CITIES.TOKYO,
		])
		expect(result.current.formData.cities.isValid).toBe(true)
	})

	it('ignores a city that is already selected', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCityAdd(MOCK_CITIES.TOKYO)
		})
		act(() => {
			result.current.handleCityAdd({ ...MOCK_CITIES.TOKYO })
		})

		expect(result.current.formData.cities.value).toHaveLength(1)
	})

	it('removes a city by id and flags the field when none remain', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCityAdd(MOCK_CITIES.TOKYO)
		})
		act(() => {
			result.current.handleCityAdd(MOCK_CITIES.PRAGUE)
		})
		act(() => {
			result.current.handleCityRemove(MOCK_CITIES.TOKYO.id)
		})

		expect(result.current.formData.cities.value).toEqual([
			MOCK_CITIES.PRAGUE,
		])

		act(() => {
			result.current.handleCityRemove(MOCK_CITIES.PRAGUE.id)
		})

		expect(result.current.formData.cities.isValid).toBe(false)
		expect(result.current.formData.cities.message).toBe(
			VALIDATION_MESSAGES.CITIES_REQUIRED,
		)
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
		expect(result.current.formData.tripDescription.isValid).toBe(false)
		expect(result.current.formData.tripDescription.message).toBe(
			VALIDATION_MESSAGES.TRIP_DESCRIPTION_REQUIRED,
		)
		expect(result.current.formData.days.isValid).toBe(false)
		expect(result.current.formData.cities.isValid).toBe(false)
		expect(mockOnSuccess).not.toHaveBeenCalled()
	})

	it('should validate successfully and call onSuccess with data', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }
		const mockOnSuccess = vi.fn()
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		const { firstName, lastName, tripDescription, daysInCity } =
			MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: firstName },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: lastName },
			})
			result.current.handleInputChange({
				target: { id: 'tripDescription', value: tripDescription },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: daysInCity.toString() },
			})
			result.current.handleCityAdd(MOCK_CITIES.TOKYO)
		})

		act(() => {
			result.current.submitHandler(mockOnSuccess)(mockEvent)
		})

		expect(result.current.formData.firstName.isValid).toBe(true)
		expect(mockOnSuccess).toHaveBeenCalledWith({
			firstName,
			lastName,
			tripDescription,
			daysInCity: daysInCity.toString(),
			cities: [MOCK_CITIES.TOKYO],
			files: [],
		})

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
		expect(result.current).toHaveProperty('handleCityAdd')
		expect(result.current).toHaveProperty('handleCityRemove')
		expect(result.current).toHaveProperty('submitHandler')
		expect(typeof result.current.handleInputChange).toBe('function')
		expect(typeof result.current.handleCityAdd).toBe('function')
		expect(typeof result.current.handleCityRemove).toBe('function')
		expect(typeof result.current.submitHandler).toBe('function')
	})

	it('submits the files reported by the uploader', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const files = [{ id: 'a', name: 'a.png', file: {} }]
		const onSuccess = vi.fn()

		act(() => {
			result.current.handleInputChange({
				target: { id: 'firstName', value: 'Ada' },
			})
			result.current.handleInputChange({
				target: { id: 'lastName', value: 'Lovelace' },
			})
			result.current.handleInputChange({
				target: { id: 'tripDescription', value: 'Hi' },
			})
			result.current.handleInputChange({
				target: { id: 'days', value: '3' },
			})
			result.current.handleCityAdd(MOCK_CITIES.TOKYO)
			result.current.handleFilesUpdated(files)
		})
		act(() => {
			result.current.submitHandler(onSuccess)({ preventDefault: vi.fn() })
		})

		expect(onSuccess).toHaveBeenCalledWith(
			expect.objectContaining({ files }),
		)
	})

	it('flags cities as required when the search is left with none chosen', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCitiesBlur()
		})

		expect(result.current.formData.cities.isValid).toBe(false)
		expect(result.current.formData.cities.message).toBe(
			VALIDATION_MESSAGES.CITIES_REQUIRED,
		)
	})

	it('keeps cities valid on blur once one is chosen', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		act(() => {
			result.current.handleCityAdd(MOCK_CITIES.TOKYO)
		})
		act(() => {
			result.current.handleCitiesBlur()
		})

		expect(result.current.formData.cities.isValid).toBe(true)
	})
})
