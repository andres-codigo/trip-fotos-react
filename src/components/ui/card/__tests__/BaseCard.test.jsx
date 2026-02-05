import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { createClassNamesMock } from '@/testUtils/vitest/mockClassNames'

import BaseCard from '../BaseCard'

/**
 * BaseCard Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering verification and className composition
 * - Tests default rendering with children
 * - Verifies classNames utility combines custom classes with card styles
 * - Tests prop spreading and data attributes
 */

// Test selector constant
const BASE_CARD_SELECTOR = 'base-card'

vi.mock('classnames', () => ({
	default: createClassNamesMock(),
}))

vi.mock('@/components/ui/card/BaseCard.module.scss', () => ({
	default: {
		card: 'mocked-card-class',
	},
}))

import classNames from 'classnames'

const mockClassNames = vi.mocked(classNames)

describe('<BaseCard />', () => {
	afterEach(() => {
		vi.resetModules()
	})

	describe('Rendering tests', () => {
		it('renders with children', () => {
			render(
				<BaseCard>
					<h1>Card Content</h1>
				</BaseCard>,
			)

			expect(screen.getByText('Card Content')).toBeInTheDocument()
			expect(screen.getByTestId(BASE_CARD_SELECTOR)).toBeInTheDocument()
		})

		it('renders with default data-cy attribute', () => {
			render(<BaseCard>Content</BaseCard>)

			expect(screen.getByTestId(BASE_CARD_SELECTOR)).toHaveAttribute(
				'data-cy',
				BASE_CARD_SELECTOR,
			)
		})

		it('renders as a div element', () => {
			const { container } = render(<BaseCard>Content</BaseCard>)

			const card = container.querySelector('div')
			expect(card).toBeInTheDocument()
			expect(card?.tagName).toBe('DIV')
		})

		it('renders with base-card data-cy attribute', () => {
			render(<BaseCard>Content</BaseCard>)

			const card = screen.getByTestId(BASE_CARD_SELECTOR)
			expect(card).toBeInTheDocument()
		})
	})

	describe('className composition tests', () => {
		it('combines custom className with card styles using classNames utility', () => {
			const { container } = render(
				<BaseCard className="custom-class">Content</BaseCard>,
			)

			const card = container.querySelector(
				`[data-cy="${BASE_CARD_SELECTOR}"]`,
			)

			expect(mockClassNames).toHaveBeenCalledWith(
				'custom-class',
				'mocked-card-class',
			)

			expect(card).toHaveClass('custom-class mocked-card-class')
		})

		it('applies card styles when no custom className provided', () => {
			const { container } = render(<BaseCard>Content</BaseCard>)

			const card = container.querySelector(
				`[data-cy="${BASE_CARD_SELECTOR}"]`,
			)

			expect(mockClassNames).toHaveBeenCalledWith(
				undefined,
				'mocked-card-class',
			)

			expect(card).toHaveClass('mocked-card-class')
		})

		it('applies card styles with empty custom className', () => {
			const { container } = render(
				<BaseCard className="">Content</BaseCard>,
			)

			container.querySelector(`[data-cy="${BASE_CARD_SELECTOR}"]`)

			expect(mockClassNames).toHaveBeenCalledWith('', 'mocked-card-class')
		})

		it('combines multiple custom classes with card styles', () => {
			const { container } = render(
				<BaseCard className="class-one class-two">Content</BaseCard>,
			)

			container.querySelector(`[data-cy="${BASE_CARD_SELECTOR}"]`)

			expect(mockClassNames).toHaveBeenCalledWith(
				'class-one class-two',
				'mocked-card-class',
			)
		})
	})

	describe('Props spreading tests', () => {
		it('does not spread arbitrary props like id or role to the div element', () => {
			const { container } = render(
				<BaseCard
					id="custom-id"
					role="region"
					aria-label="Card region">
					Content
				</BaseCard>,
			)

			const card = container.querySelector(
				`[data-cy="${BASE_CARD_SELECTOR}"]`,
			)
			// BaseCard only accepts className and children props, others are not spread
			expect(card).not.toHaveAttribute('id')
			expect(card).not.toHaveAttribute('role')
			expect(card).not.toHaveAttribute('aria-label')
		})
	})

	describe('Children rendering tests', () => {
		it('renders single child element', () => {
			render(
				<BaseCard>
					<p>Single child</p>
				</BaseCard>,
			)

			expect(screen.getByText('Single child')).toBeInTheDocument()
		})

		it('renders multiple child elements', () => {
			render(
				<BaseCard>
					<h1>Title</h1>
					<p>Content</p>
					<button>Action</button>
				</BaseCard>,
			)

			expect(screen.getByText('Title')).toBeInTheDocument()
			expect(screen.getByText('Content')).toBeInTheDocument()
			expect(screen.getByText('Action')).toBeInTheDocument()
		})

		it('renders text content as children', () => {
			render(<BaseCard>Plain text content</BaseCard>)

			expect(screen.getByText('Plain text content')).toBeInTheDocument()
		})

		it('renders null children gracefully', () => {
			const { container } = render(<BaseCard>{null}</BaseCard>)

			const card = container.querySelector('div')
			expect(card).toBeInTheDocument()
		})

		it('renders mixed child types', () => {
			render(
				<BaseCard>
					Text content
					<span>Element</span>
					{null}
					{false}
				</BaseCard>,
			)

			expect(screen.getByText('Text content')).toBeInTheDocument()
			expect(screen.getByText('Element')).toBeInTheDocument()
		})
	})

	describe('Prop validation', () => {
		it('accepts className prop as string', () => {
			const { container } = render(
				<BaseCard className="test-class">Content</BaseCard>,
			)

			expect(container.querySelector('div')).toBeInTheDocument()
		})

		it('accepts children as node', () => {
			const { container } = render(
				<BaseCard>
					<div>Complex child structure</div>
				</BaseCard>,
			)

			expect(container.querySelector('div')).toBeInTheDocument()
		})
	})

	describe('Style application', () => {
		it('always applies card style class', () => {
			const { rerender, container } = render(<BaseCard>Content</BaseCard>)

			let card = container.querySelector(
				`[data-cy="${BASE_CARD_SELECTOR}"]`,
			)
			expect(card).toHaveClass('mocked-card-class')

			// Rerender with different className
			rerender(<BaseCard className="new-class">New Content</BaseCard>)

			card = container.querySelector(`[data-cy="${BASE_CARD_SELECTOR}"]`)
			expect(card).toHaveClass('mocked-card-class')
		})
	})
})
