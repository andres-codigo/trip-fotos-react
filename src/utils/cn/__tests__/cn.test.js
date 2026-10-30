import { describe, it, expect } from 'vitest'

import { cn } from '@/utils/cn'

describe('cn', () => {
	it('joins class names and skips falsy values', () => {
		expect(cn('a', false, null, undefined, 'b')).toBe('a b')
	})

	it('applies conditional classes from an object', () => {
		expect(cn('a', { b: true, c: false })).toBe('a b')
	})

	it('lets the later Tailwind class win a conflict', () => {
		expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
	})
})
