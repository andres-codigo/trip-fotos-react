import { render, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { GLOBAL } from '@/constants/global'

import BaseSpinner from '../BaseSpinner'

/**
 * BaseSpinner Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering verification and accessibility compliance
 * - Tests basic rendering of spinner container and loading image
 * - Verifies correct aria attributes for screen reader compatibility
 * - Ensures descriptive alternative text is provided for the loading indicator
 * - Tests SVG asset loading and image source attribution
 */

vi.mock('@/assets/loading-spinner.svg', () => ({
	default: 'mock-spinner.svg',
}))

describe('BaseSpinner', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('should render spinner with loading image', () => {
			render(<BaseSpinner />)

			const spinner = screen.getByRole('status')
			const loadingImage = screen.getByAltText(GLOBAL.LOADING_SPINNER_ALT)

			expect(spinner).toBeInTheDocument()
			expect(loadingImage).toBeInTheDocument()
			expect(loadingImage).toHaveAttribute('src', 'mock-spinner.svg')
		})
	})

	describe('Accessibility tests', () => {
		it('should have proper aria attributes for screen readers', () => {
			render(<BaseSpinner />)

			const spinner = screen.getByRole('status')

			expect(spinner).toHaveAttribute('aria-live', 'polite')
			expect(spinner).toHaveAttribute('aria-busy', 'true')
		})

		it('should provide descriptive alternative text for loading image', () => {
			render(<BaseSpinner />)

			const loadingImage = screen.getByAltText(GLOBAL.LOADING_SPINNER_ALT)

			expect(loadingImage).toBeInTheDocument()
		})
	})
})
