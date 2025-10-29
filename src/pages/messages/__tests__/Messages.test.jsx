import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { TEST_IDS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import Messages from '../Messages'

import messagesStyles from '../messages.module.scss'

/**
 * Messages Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic and correct application of CSS classes
 * - Verifies that the main container and heading are rendered as expected
 * - Ensures the <main> element has both global and module-specific classes
 * - Checks that the <h1> displays the correct text
 * - Uses isolated rendering to avoid external dependencies
 */

describe('Messages', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('applies both mainContainer and messagesContainer classes to <main>', () => {
			render(<Messages />)

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp(messagesStyles.messagesContainer),
			)
		})

		it('renders <h1> with correct value', () => {
			render(<Messages />)

			const heading = screen.getByRole('heading', { level: 1 })

			expect(heading).toBeInTheDocument()
			expect(heading).toHaveTextContent('Messages page')
		})
	})
})
