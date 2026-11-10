import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { GLOBAL } from '@/constants/ui'
import { SPINNER, TEST_IDS } from '@/constants/test'

import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

describe('BaseSpinner', () => {
	describe('Rendering tests', () => {
		it('shows the default loading text beside the spinner', () => {
			render(<BaseSpinner />)

			expect(screen.getByRole(SPINNER.ROLE_STATUS)).toHaveTextContent(
				GLOBAL.SPINNER_LABEL.DEFAULT,
			)
		})

		it('shows the label it is given', () => {
			render(<BaseSpinner label={GLOBAL.SPINNER_LABEL.MESSAGES} />)

			expect(
				screen.getByTestId(TEST_IDS.SPINNER.LABEL),
			).toHaveTextContent(GLOBAL.SPINNER_LABEL.MESSAGES)
		})

		it('pulses instead of turning under reduced motion', () => {
			render(<BaseSpinner />)

			const icon = screen.getByTestId(TEST_IDS.SPINNER.ICON)

			expect(icon).toHaveClass('animate-spin')
			expect(icon).toHaveClass('motion-reduce:animate-skeleton')
		})
	})

	describe('Accessibility tests', () => {
		it('should have proper aria attributes for screen readers', () => {
			render(<BaseSpinner />)

			const spinner = screen.getByRole(SPINNER.ROLE_STATUS)

			expect(spinner).toHaveAttribute('aria-live', 'polite')
			expect(spinner).toHaveAttribute('aria-busy', 'true')
		})

		it('hides the decorative icon from assistive technology', () => {
			render(<BaseSpinner />)

			expect(screen.getByTestId(TEST_IDS.SPINNER.ICON)).toHaveAttribute(
				'aria-hidden',
				'true',
			)
		})
	})
})
