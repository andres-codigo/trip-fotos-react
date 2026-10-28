import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import useScrollToAnchor from '@/pages/traveller-detail/hooks/useScrollToAnchor'

const Harness = ({ isActive }) => {
	const { ref } = useScrollToAnchor({ isActive })
	return (
		<ul
			ref={ref}
			data-cy="target">
			<li>
				<img
					alt=""
					data-cy="image"
				/>
			</li>
		</ul>
	)
}

describe('useScrollToAnchor', () => {
	const scrollIntoView = vi.fn()

	beforeEach(() => {
		vi.useFakeTimers()
		scrollIntoView.mockClear()
		Element.prototype.scrollIntoView = scrollIntoView
	})

	afterEach(() => {
		vi.useRealTimers()
		delete Element.prototype.scrollIntoView
	})

	it('does nothing while inactive', () => {
		render(<Harness isActive={false} />)
		expect(scrollIntoView).not.toHaveBeenCalled()
	})

	it('scrolls to the target when it becomes active', () => {
		const { rerender, getByTestId } = render(<Harness isActive={false} />)
		rerender(<Harness isActive />)
		expect(scrollIntoView).toHaveBeenCalledTimes(1)
		expect(scrollIntoView.mock.contexts[0]).toBe(getByTestId('target'))
	})

	it('scrolls again each time an image inside finishes loading', () => {
		const { getByTestId } = render(<Harness isActive />)
		fireEvent.load(getByTestId('image'))
		fireEvent.load(getByTestId('image'))
		expect(scrollIntoView).toHaveBeenCalledTimes(3)
	})

	it.each(['wheel', 'touchmove', 'keydown'])(
		'stops re-scrolling after a user %s',
		(type) => {
			const { getByTestId } = render(<Harness isActive />)
			fireEvent(window, new Event(type))
			fireEvent.load(getByTestId('image'))
			expect(scrollIntoView).toHaveBeenCalledTimes(1)
		},
	)

	it('stops re-scrolling once the settle window has passed', () => {
		const { getByTestId } = render(<Harness isActive />)
		vi.advanceTimersByTime(3000)
		fireEvent.load(getByTestId('image'))
		expect(scrollIntoView).toHaveBeenCalledTimes(1)
	})

	it('stops listening on unmount', () => {
		const { getByTestId, unmount } = render(<Harness isActive />)
		const image = getByTestId('image')
		unmount()
		fireEvent.load(image)
		expect(scrollIntoView).toHaveBeenCalledTimes(1)
	})
})
