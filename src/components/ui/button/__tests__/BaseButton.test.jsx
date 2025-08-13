import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { createClassNamesMock } from '@/testUtils/vitest/mockClassNames'

import { BUTTON } from '@/constants/test/button'

import BaseButton from '@/components/ui/button/BaseButton'

/**
 * BaseButton Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, edge cases, and implementation details
 * - Complements Cypress tests which cover rendering, behavior, and accessibility scenarios
 * - Tests conditional rendering logic (button vs Link vs span for disabled links)
 * - Tests conditional aria-label application based on children type
 * - Verifies prop spreading and className handling
 */

// Mock the CSS module and classNames
vi.mock('classnames', () => ({
	default: createClassNamesMock(),
}))

vi.mock('@/components/ui/button/BaseButton.module.scss', () => ({
	default: {
		flat: 'mocked-flat-class',
		outlined: 'mocked-outlined-class',
	},
}))

import classNames from 'classnames'

const mockClassNames = vi.mocked(classNames)

const renderWithRouter = (component) => {
	return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('<BaseButton />', () => {
	afterEach(() => {
		vi.resetModules()
	})

	describe('Rendering tests', () => {
		it('combines className with modeType styles using classNames utility', () => {
			render(
				<BaseButton
					className="custom-class"
					modeType={BUTTON.MODE.OUTLINED}
					data-cy="styled-button">
					Styled Button
				</BaseButton>,
			)

			const button = screen.getByTestId('styled-button')

			expect(mockClassNames).toHaveBeenCalledWith(
				'custom-class',
				'mocked-outlined-class',
			)

			expect(button).toHaveClass('custom-class mocked-outlined-class')
		})

		it('spreads additional props to button element without conflicts', () => {
			render(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy="button-with-props"
					onClick={() => {}}
					id="custom-id"
					tabIndex={2}>
					Submit
				</BaseButton>,
			)

			const button = screen.getByTestId('button-with-props')
			expect(button).toHaveAttribute('id', 'custom-id')
			expect(button).toHaveAttribute('tabindex', '2')
		})

		it('spreads additional props to link element without conflicts', () => {
			renderWithRouter(
				<BaseButton
					isLink
					modeType={BUTTON.MODE.FLAT}
					data-cy="link-with-props"
					onClick={() => {}}
					target="_blank"
					rel="noopener">
					Link Button
				</BaseButton>,
			)

			const link = screen.getByTestId('link-with-props')
			expect(link).toHaveAttribute('target', '_blank')
			expect(link).toHaveAttribute('rel', 'noopener')
		})

		it('spreads additional props to disabled link (span) element', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isDisabled
					modeType={BUTTON.MODE.FLAT}
					data-cy="disabled-link-with-props"
					id="disabled-span"
					title="Disabled tooltip">
					Disabled Link
				</BaseButton>,
			)

			const span = screen.getByTestId('disabled-link-with-props')
			expect(span).toHaveAttribute('id', 'disabled-span')
			expect(span).toHaveAttribute('title', 'Disabled tooltip')
		})
	})

	describe('Behaviour tests', () => {
		it('defaults ariaLabel to "Button" when children is not a string and no ariaLabel provided', () => {
			render(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy="icon-button">
					<span>🔥</span>
				</BaseButton>,
			)

			const button = screen.getByTestId('icon-button')
			expect(button).toHaveAttribute('aria-label', 'Button')
		})

		it('defaults ariaLabel to "Link" when isLink=true, children is not a string, and no ariaLabel provided', () => {
			renderWithRouter(
				<BaseButton
					isLink
					modeType={BUTTON.MODE.FLAT}
					data-cy="icon-link">
					<span>🔥</span>
				</BaseButton>,
			)

			const link = screen.getByTestId('icon-link')
			expect(link).toHaveAttribute('aria-label', 'Link')
		})
	})

	describe('Accessibility tests', () => {
		it('applies correct aria-label based on element type and children', () => {
			// Test button with custom aria-label
			const { unmount } = render(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy="custom-button"
					ariaLabel="Custom Button">
					<span>🔥</span>
				</BaseButton>,
			)

			const button = screen.getByTestId('custom-button')
			expect(button).toHaveAttribute('aria-label', 'Custom Button')
			unmount()

			// Test link with custom aria-label
			renderWithRouter(
				<BaseButton
					isLink
					modeType={BUTTON.MODE.FLAT}
					data-cy="custom-link"
					ariaLabel="Custom Link">
					<span>🔥</span>
				</BaseButton>,
			)

			const link = screen.getByTestId('custom-link')
			expect(link).toHaveAttribute('aria-label', 'Custom Link')
		})

		it('does not apply aria-label when children is a string', () => {
			const { unmount } = render(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy="text-button">
					Click me
				</BaseButton>,
			)

			const button = screen.getByTestId('text-button')
			expect(button).not.toHaveAttribute('aria-label')
			unmount()

			renderWithRouter(
				<BaseButton
					isLink
					modeType={BUTTON.MODE.FLAT}
					data-cy="text-link">
					Click me
				</BaseButton>,
			)

			const link = screen.getByTestId('text-link')
			expect(link).not.toHaveAttribute('aria-label')
		})
	})
})
