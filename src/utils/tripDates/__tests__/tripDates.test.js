import { describe, expect, it } from 'vitest'

import {
	formatTripDays,
	formatTripRange,
	getTripLength,
	getTripSummary,
	parseIsoDate,
	toIsoDate,
} from '@/utils/tripDates'

describe('parseIsoDate', () => {
	it('reads a YYYY-MM-DD date', () => {
		expect(parseIsoDate('2025-03-12')).toMatchObject({
			year: 2025,
			month: 3,
			day: 12,
		})
	})

	it.each([
		['', 'empty'],
		[undefined, 'missing'],
		['12/03/2025', 'another format'],
		['2025-02-30', 'a day the month does not have'],
		['2025-13-01', 'a month that does not exist'],
	])('rejects %s (%s)', (value) => {
		expect(parseIsoDate(value)).toBeNull()
	})
})

describe('toIsoDate', () => {
	it('writes the local calendar date', () => {
		expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
	})
})

describe('getTripLength', () => {
	it('counts both ends', () => {
		expect(getTripLength('2025-03-12', '2025-03-19')).toBe(8)
	})

	it('is one day for a day trip', () => {
		expect(getTripLength('2025-06-14', '2025-06-14')).toBe(1)
	})

	it('counts across a clock change and a year end', () => {
		expect(getTripLength('2025-03-28', '2025-04-03')).toBe(7)
		expect(getTripLength('2024-12-28', '2025-01-03')).toBe(7)
	})

	it('has no length when the end is before the start or a date is missing', () => {
		expect(getTripLength('2025-03-19', '2025-03-12')).toBeNull()
		expect(getTripLength('2025-03-12', '')).toBeNull()
	})
})

describe('formatTripRange', () => {
	it('names the month once within one month', () => {
		expect(formatTripRange('2025-03-12', '2025-03-19')).toBe(
			'12–19 Mar 2025',
		)
	})

	it('repeats the month across a month end', () => {
		expect(formatTripRange('2025-10-30', '2025-11-02')).toBe(
			'30 Oct – 2 Nov 2025',
		)
	})

	it('repeats the year across a year end', () => {
		expect(formatTripRange('2024-12-28', '2025-01-03')).toBe(
			'28 Dec 2024 – 3 Jan 2025',
		)
	})

	it('shows one date for a day trip', () => {
		expect(formatTripRange('2025-06-14', '2025-06-14')).toBe('14 Jun 2025')
	})

	it('is empty without both dates', () => {
		expect(formatTripRange('2025-06-14', undefined)).toBe('')
	})
})

describe('formatTripDays', () => {
	it('uses the singular for one day', () => {
		expect(formatTripDays(1)).toBe('1 day')
		expect(formatTripDays(8)).toBe('8 days')
	})
})

describe('getTripSummary', () => {
	it('works the length out from the dates', () => {
		expect(
			getTripSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' }),
		).toEqual({ range: '12–19 Mar 2025', days: 8 })
	})

	it('prefers the dates over an older daysInCity', () => {
		expect(
			getTripSummary({
				tripStart: '2025-03-12',
				tripEnd: '2025-03-12',
				daysInCity: 5,
			}),
		).toEqual({ range: '12 Mar 2025', days: 1 })
	})

	it('falls back to daysInCity, stored as a number or a string', () => {
		expect(getTripSummary({ daysInCity: 8 })).toEqual({
			range: '',
			days: 8,
		})
		expect(getTripSummary({ daysInCity: '5' })).toEqual({
			range: '',
			days: 5,
		})
	})

	it.each([
		[{}, 'nothing stored'],
		[{ daysInCity: '0' }, 'zero days'],
		[{ daysInCity: 'abc' }, 'not a number'],
		[
			{ tripStart: '2025-03-19', tripEnd: '2025-03-12' },
			'dates in the wrong order',
		],
	])('has no summary for %o (%s)', (traveller) => {
		expect(getTripSummary(traveller)).toBeNull()
	})
})
