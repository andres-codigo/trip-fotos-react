import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'
import { MESSAGE_SKELETON } from '@/constants/test'

const renderSkeleton = () =>
	render(
		<ul>
			<MessageSkeleton />
		</ul>,
	)

describe('MessageSkeleton', () => {
	it('renders a list item hidden from assistive technology', () => {
		const { container } = renderSkeleton()
		const root = container.querySelector(
			`[data-cy="${MESSAGE_SKELETON.ROOT}"]`,
		)
		expect(root.tagName).toBe('LI')
		expect(root).toHaveAttribute('aria-hidden', 'true')
	})

	it('renders six animated blocks', () => {
		const { container } = renderSkeleton()
		const blocks = container.querySelectorAll('span')
		expect(blocks).toHaveLength(6)
		blocks.forEach((block) => {
			expect(block).toHaveClass('animate-skeleton', 'bg-skeleton')
		})
	})
})
