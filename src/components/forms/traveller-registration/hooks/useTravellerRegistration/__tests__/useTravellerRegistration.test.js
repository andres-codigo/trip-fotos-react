import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

import { MOCK_CITIES, MOCK_TRAVELLERS } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import useTravellerRegistration from '@/components/forms/traveller-registration/hooks/useTravellerRegistration'

describe('useTravellerRegistration', () => {
	it('should initialise with default form state', () => {
		const { result } = renderHook(() => useTravellerRegistration())

		expect(result.current.formData).toEqual({
			firstName: { value: '', message: '', isValid: true },
			lastName: { value: '', message: '', isValid: true },
			tripDescription: { value: '', message: '', isValid: true },
			tripStart: { value: '', message: '', isValid: true },
			tripEnd: { value: '', message: '', isValid: true },
			cities: { value: [], message: '', isValid: true },
		})
	})

	it('starts from an existing traveller, for editing a trip', () => {
		const city = MOCK_CITIES.TOKYO
		const { result } = renderHook(() =>
			useTravellerRegistration({
				firstName: 'Amara',
				lastName: 'Okafor',
				tripDescription: 'Cherry blossom season.',
				tripStart: '2025-03-12',
				tripEnd: '2025-03-19',
				cities: [city, 'prague'],
			}),
		)

		expect(result.current.formData).toEqual({
			firstName: { value: 'Amara', message: '', isValid: true },
			lastName: { value: 'Okafor', message: '', isValid: true },
			tripDescription: {
				value: 'Cherry blossom season.',
				message: '',
				isValid: true,
			},
			tripStart: { value: '2025-03-12', message: '', isValid: true },
			tripEnd: { value: '2025-03-19', message: '', isValid: true },
			cities: { value: [city, 'prague'], message: '', isValid: true },
		})
	})

	it('leaves the trip dates empty for an older traveller who has none', () => {
		const { result } = renderHook(() =>
			useTravellerRegistration({ firstName: 'Kofi', cities: ['prague'] }),
		)

		expect(result.current.formData.tripStart.value).toBe('')
		expect(result.current.formData.tripEnd.value).toBe('')
		expect(result.current.formData.lastName.value).toBe('')
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
		expect(result.current.formData.tripStart.message).toBe(
			VALIDATION_MESSAGES.TRIP_START_REQUIRED,
		)
		expect(result.current.formData.tripEnd.message).toBe(
			VALIDATION_MESSAGES.TRIP_END_REQUIRED,
		)
		expect(result.current.formData.cities.isValid).toBe(false)
		expect(mockOnSuccess).not.toHaveBeenCalled()
	})

	it('should validate successfully and call onSuccess with data', () => {
		const { result } = renderHook(() => useTravellerRegistration())
		const mockEvent = { preventDefault: vi.fn() }
		const mockOnSuccess = vi.fn()
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		const { firstName, lastName, tripDescription, tripStart, tripEnd } =
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
				target: { id: 'tripStart', value: tripStart },
			})
			result.current.handleInputChange({
				target: { id: 'tripEnd', value: tripEnd },
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
			tripStart,
			tripEnd,
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
				target: { id: 'tripStart', value: '2025-03-12' },
			})
			result.current.handleInputChange({
				target: { id: 'tripEnd', value: '2025-03-14' },
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

	describe('trip dates', () => {
		const change = (result, id, value) =>
			act(() => {
				result.current.handleInputChange({ target: { id, value } })
			})

		beforeEach(() => {
			vi.useFakeTimers({ toFake: ['Date'] })
			vi.setSystemTime(new Date(2026, 10, 11, 12, 0))
		})
		afterEach(() => vi.useRealTimers())

		it('accepts a start and an end on or after it, up to today', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2026-11-04')
			change(result, 'tripEnd', '2026-11-11')

			expect(result.current.formData.tripStart.isValid).toBe(true)
			expect(result.current.formData.tripEnd.isValid).toBe(true)
		})

		it('accepts a day trip, with the same date twice', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2025-06-14')
			change(result, 'tripEnd', '2025-06-14')

			expect(result.current.formData.tripEnd.isValid).toBe(true)
		})

		it('flags an end date before the start date on the end date', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2025-03-19')
			change(result, 'tripEnd', '2025-03-12')

			expect(result.current.formData.tripStart.isValid).toBe(true)
			expect(result.current.formData.tripEnd.message).toBe(
				VALIDATION_MESSAGES.TRIP_END_BEFORE_START,
			)
		})

		it('rechecks the end date when the start date changes', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2025-03-19')
			change(result, 'tripEnd', '2025-03-12')
			change(result, 'tripStart', '2025-03-10')

			expect(result.current.formData.tripEnd.isValid).toBe(true)
		})

		it('leaves an untouched end date quiet when the start date is set', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2025-03-10')

			expect(result.current.formData.tripEnd).toEqual({
				value: '',
				message: '',
				isValid: true,
			})
		})

		it('refuses a date after today', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2026-11-12')
			change(result, 'tripEnd', '2026-11-20')

			expect(result.current.formData.tripStart.message).toBe(
				VALIDATION_MESSAGES.TRIP_DATE_IN_FUTURE,
			)
			expect(result.current.formData.tripEnd.message).toBe(
				VALIDATION_MESSAGES.TRIP_DATE_IN_FUTURE,
			)
		})

		it('does not also flag the end date when only the start date is in the future', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripEnd', '2025-03-10')
			change(result, 'tripStart', '2026-12-01')

			expect(result.current.formData.tripStart.message).toBe(
				VALIDATION_MESSAGES.TRIP_DATE_IN_FUTURE,
			)
			expect(result.current.formData.tripEnd.isValid).toBe(true)
		})

		it('refuses a trip longer than 366 days', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2024-01-01')
			change(result, 'tripEnd', '2024-12-31')
			expect(result.current.formData.tripEnd.isValid).toBe(true)

			change(result, 'tripEnd', '2025-01-01')
			expect(result.current.formData.tripEnd.message).toBe(
				VALIDATION_MESSAGES.TRIP_TOO_LONG(366),
			)
		})

		it('treats a cleared or malformed date as missing', () => {
			const { result } = renderHook(() => useTravellerRegistration())

			change(result, 'tripStart', '2025-02-30')
			change(result, 'tripEnd', '')

			expect(result.current.formData.tripStart.message).toBe(
				VALIDATION_MESSAGES.TRIP_START_REQUIRED,
			)
			expect(result.current.formData.tripEnd.message).toBe(
				VALIDATION_MESSAGES.TRIP_END_REQUIRED,
			)
		})
	})
})
