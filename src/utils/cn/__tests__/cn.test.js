import { describe, it, expect } from 'vitest'

import { cn } from '@/utils/cn'

describe('cn', () => {
	it('lets the later Tailwind class win a conflict', () => {
		expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
	})
})
