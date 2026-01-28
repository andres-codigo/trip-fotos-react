import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { TEST_IDS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { TRAVELLER_REGISTRATION_FORM_SELECTORS } from '../../../constants/test/selectors/components'

import Register from '../Register'

import registerStyles from '../register.module.scss'

vi.mock(
	'@/components/forms/traveller-registration/TravellerRegistrationForm',
	() => ({
		default: ({ isLoading }) => (
			<div
				data-cy="traveller-registration-form"
				data-loading={isLoading ? 'true' : 'false'}
			/>
		),
	}),
)

/**
 * Register Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic and correct application of CSS classes
 * - Verifies that the main container is rendered as expected
 * - Ensures the <main> element has both global and module-specific classes
 * - Checks that the BaseCard component is rendered
 * - Checks that the TravellerRegistrationForm is rendered with correct props
 */

describe('Register', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('renders the <main> element', () => {
			render(<Register />)

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('applies both mainContainer and registerContainer classes to <main>', () => {
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

		it('renders the BaseCard component', () => {
			render(<Register />)
			expect(screen.getByTestId(TEST_IDS.BASE_CARD)).toBeInTheDocument()
		})

		it('renders the TravellerRegistrationForm within BaseCard', () => {
			render(<Register />)

			const baseCard = screen.getByTestId(TEST_IDS.BASE_CARD)
			expect(
				baseCard.querySelector(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM,
				),
			).toBeInTheDocument()
		})

		it('passes correct props to TravellerRegistrationForm', () => {
			render(<Register />)

			const form = screen.getByTestId('traveller-registration-form')
			expect(form).toHaveAttribute('data-loading', 'false')
		})
	})
})
