import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

/**
 * LoadingFallback Unit Tests
 *
 * Test Strategy:
 * - Covers the two layouts: a full page with a main landmark, and a card on its own
 * - Complements the Cypress tests which cover the rendered result in a real browser
 */

import { ACCESSIBILITY } from '@/constants/ui'
import { COMMON_SELECTORS } from '@/constants/test'

import LoadingFallback from '@/components/common/LoadingFallback'

describe('<LoadingFallback />', () => {
	describe('as a page (isComponent is false)', () => {
		it('renders a main landmark that is the skip link target', () => {
			render(<LoadingFallback isComponent={false} />)

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(main).toHaveAttribute('tabindex', '-1')
			expect(main).toHaveClass('mainContainer')
		})

		it('shows the spinner inside a card inside the main landmark', () => {
			const { container } = render(
				<LoadingFallback isComponent={false} />,
			)

			const main = screen.getByRole('main')
			const card = container.querySelector(COMMON_SELECTORS.BASE_CARD)
			expect(main).toContainElement(card)
			expect(card).toContainElement(
				container.querySelector(COMMON_SELECTORS.BASE_SPINNER),
			)
		})
	})

	describe('as a component (isComponent is true)', () => {
		it('renders no main landmark', () => {
			render(<LoadingFallback isComponent />)

			expect(screen.queryByRole('main')).not.toBeInTheDocument()
		})

		it('shows the spinner inside a card', () => {
			const { container } = render(<LoadingFallback isComponent />)

			const card = container.querySelector(COMMON_SELECTORS.BASE_CARD)
			expect(card).toBeInTheDocument()
			expect(card).toContainElement(
				container.querySelector(COMMON_SELECTORS.BASE_SPINNER),
			)
		})
	})
})
