import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import usePaging from '@/components/travellers/travellers-list/hooks/usePaging'

const makeItems = (length) => Array.from({ length }, (_, index) => index)

describe('usePaging', () => {
	it('shows the first page', () => {
		const { result } = renderHook(() =>
			usePaging(makeItems(25), { pageSize: 10 }),
		)

		expect(result.current.visibleItems).toEqual(makeItems(10))
		expect(result.current.visibleCount).toBe(10)
		expect(result.current.total).toBe(25)
		expect(result.current.nextCount).toBe(10)
		expect(result.current.hasMore).toBe(true)
		expect(result.current.firstNewIndex).toBeNull()
	})

	it('shows every item when fewer than a page', () => {
		const { result } = renderHook(() =>
			usePaging(makeItems(3), { pageSize: 10 }),
		)

		expect(result.current.visibleItems).toEqual(makeItems(3))
		expect(result.current.visibleCount).toBe(3)
		expect(result.current.nextCount).toBe(0)
		expect(result.current.hasMore).toBe(false)
	})

	it('adds a page and sets firstNewIndex on showMore', () => {
		const { result } = renderHook(() =>
			usePaging(makeItems(25), { pageSize: 10 }),
		)

		act(() => result.current.showMore())

		expect(result.current.visibleCount).toBe(20)
		expect(result.current.visibleItems).toEqual(makeItems(20))
		expect(result.current.firstNewIndex).toBe(10)
		expect(result.current.nextCount).toBe(5)
		expect(result.current.hasMore).toBe(true)
	})

	it('adds only the remainder on the last step', () => {
		const { result } = renderHook(() =>
			usePaging(makeItems(25), { pageSize: 10 }),
		)

		act(() => result.current.showMore())
		act(() => result.current.showMore())

		expect(result.current.visibleCount).toBe(25)
		expect(result.current.firstNewIndex).toBe(20)
		expect(result.current.nextCount).toBe(0)
		expect(result.current.hasMore).toBe(false)
	})

	it('does nothing on showMore when nothing remains', () => {
		const { result } = renderHook(() =>
			usePaging(makeItems(5), { pageSize: 10 }),
		)

		act(() => result.current.showMore())

		expect(result.current.visibleCount).toBe(5)
		expect(result.current.firstNewIndex).toBeNull()
	})

	it('resets the count and firstNewIndex when resetKey changes', () => {
		const items = makeItems(25)
		const { result, rerender } = renderHook(
			({ resetKey }) => usePaging(items, { pageSize: 10, resetKey }),
			{ initialProps: { resetKey: 'a' } },
		)

		act(() => result.current.showMore())
		expect(result.current.visibleCount).toBe(20)

		rerender({ resetKey: 'b' })

		expect(result.current.visibleCount).toBe(10)
		expect(result.current.firstNewIndex).toBeNull()
	})

	it('keeps the count when only items change', () => {
		const { result, rerender } = renderHook(
			({ items }) => usePaging(items, { pageSize: 10, resetKey: 'a' }),
			{ initialProps: { items: makeItems(25) } },
		)

		act(() => result.current.showMore())
		rerender({ items: makeItems(24) })

		expect(result.current.visibleCount).toBe(20)
		expect(result.current.total).toBe(24)
		expect(result.current.firstNewIndex).toBe(10)
	})

	it.each([undefined, null, 'text', {}])(
		'treats %s items as empty',
		(value) => {
			const { result } = renderHook(() =>
				usePaging(value, { pageSize: 10 }),
			)

			expect(result.current.visibleItems).toEqual([])
			expect(result.current.total).toBe(0)
			expect(result.current.hasMore).toBe(false)
		},
	)
})
