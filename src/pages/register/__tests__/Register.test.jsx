import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { TEST_IDS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import Register from '../Register'

import registerStyles from '../register.module.scss'

/**
 * Register Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic and correct application of CSS classes
 * - Verifies that the main container and heading are rendered as expected
 * - Ensures the <main> element has both global and module-specific classes
 * - Checks that the <h1> displays the correct text
 * - Uses isolated rendering to avoid external dependencies
 */

describe('Register', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('renders the <main> element', () => {
			render(<Register />)

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('applies both mainContainer and messagesContainer classes to <main>', () => {
			render(<Register />)

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp(registerStyles.registerContainer),
			)
		})

		it('<main> element has correct data attributes', () => {
			render(<Register />)

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.REGISTER.CONTAINER,
			)
		})

		it('renders <h1> with correct value', () => {
			render(<Register />)

			const heading = screen.getByRole('heading', { level: 1 })

			expect(heading).toBeInTheDocument()
			expect(heading).toHaveTextContent('Register page')
		})
	})
})
