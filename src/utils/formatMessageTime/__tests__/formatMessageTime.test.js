import { describe, expect, it } from 'vitest'

import {
	formatClockTime,
	formatDayLabel,
	formatFullTime,
	formatMessageTime,
} from '@/utils/formatMessageTime'

const NOW = new Date(2026, 10, 10, 15, 0).getTime()
const at = (...parts) => new Date(...parts).getTime()

describe('formatMessageTime', () => {
	it('says "Just now" under a minute, and for a clock slightly ahead', () => {
		expect(formatMessageTime(NOW - 30 * 1000, NOW)).toBe('Just now')
		expect(formatMessageTime(NOW + 5000, NOW)).toBe('Just now')
	})

	it('counts minutes under an hour', () => {
		expect(formatMessageTime(NOW - 12 * 60 * 1000, NOW)).toBe('12 min ago')
	})

	it('counts hours earlier the same day', () => {
		expect(formatMessageTime(at(2026, 10, 10, 13, 0), NOW)).toBe('2 h ago')
	})

	it('says "Yesterday" for the day before, even under 24 hours ago', () => {
		expect(formatMessageTime(at(2026, 10, 9, 18, 2), NOW)).toBe('Yesterday')
	})

	it('shows the date for anything older', () => {
		expect(formatMessageTime(at(2026, 10, 3, 11, 20), NOW)).toBe(
			'3 Nov 2026',
		)
	})
})

describe('formatFullTime', () => {
	it('gives the date and time in British English', () => {
		expect(formatFullTime(at(2026, 10, 3, 11, 20))).toBe(
			'3 Nov 2026, 11:20',
		)
	})
})

describe('formatClockTime', () => {
	it('gives a 24-hour time with leading zeros', () => {
		expect(formatClockTime(at(2026, 10, 3, 9, 5))).toBe('09:05')
		expect(formatClockTime(at(2026, 10, 3, 21, 40))).toBe('21:40')
	})

	it('shows midnight as 00:00', () => {
		expect(formatClockTime(at(2026, 10, 3, 0, 0))).toBe('00:00')
	})
})

describe('formatDayLabel', () => {
	it('says "Today" for any time earlier today', () => {
		expect(formatDayLabel(at(2026, 10, 10, 0, 1), NOW)).toBe('Today')
	})

	it('says "Yesterday" for the day before', () => {
		expect(formatDayLabel(at(2026, 10, 9, 23, 59), NOW)).toBe('Yesterday')
	})

	it('gives the weekday, day and month earlier this year', () => {
		expect(formatDayLabel(at(2026, 10, 8, 12, 0), NOW)).toBe('Sun 8 Nov')
	})

	it('adds the year for another year', () => {
		expect(formatDayLabel(at(2026, 0, 14, 12, 0), at(2027, 0, 20))).toBe(
			'14 Jan 2026',
		)
	})
})
