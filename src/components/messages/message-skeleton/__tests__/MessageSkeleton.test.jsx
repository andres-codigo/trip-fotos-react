import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'
import { MESSAGE_SKELETON } from '@/constants/test'

const renderSkeleton = (props) =>
	render(
		<ul>
			<MessageSkeleton {...props} />
		</ul>,
	)

const rootOf = (container, id) => container.querySelector(`[data-cy="${id}"]`)

describe('MessageSkeleton', () => {
	describe('Card (default)', () => {
		it('renders a list item hidden from assistive technology', () => {
			const { container } = renderSkeleton()
			const root = rootOf(container, MESSAGE_SKELETON.ROOT)
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

	describe('Row', () => {
		it('renders a hidden list item with three animated blocks', () => {
			const { container } = renderSkeleton({ variant: 'row' })
			const root = rootOf(container, MESSAGE_SKELETON.ROW)
			expect(root.tagName).toBe('LI')
			expect(root).toHaveAttribute('aria-hidden', 'true')
			expect(root.querySelectorAll('.animate-skeleton')).toHaveLength(3)
			expect(rootOf(container, MESSAGE_SKELETON.ROOT)).toBeNull()
		})
	})

	describe('Pane', () => {
		it('renders a hidden card with eight animated blocks', () => {
			const { container } = render(<MessageSkeleton variant="pane" />)
			const root = rootOf(container, MESSAGE_SKELETON.PANE)
			expect(root.tagName).toBe('DIV')
			expect(root).toHaveAttribute('aria-hidden', 'true')
			expect(root.querySelectorAll('.animate-skeleton')).toHaveLength(8)
			expect(rootOf(container, MESSAGE_SKELETON.ROOT)).toBeNull()
		})
	})
})
