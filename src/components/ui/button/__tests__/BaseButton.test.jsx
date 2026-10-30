import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { BUTTON } from '@/constants/test'

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

const renderWithRouter = (component) => {
	return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('<BaseButton />', () => {
	describe('Rendering tests', () => {
		it('keeps a consumer className alongside the mode styles', () => {
			render(
				<BaseButton
					className="custom-class"
					modeType={BUTTON.MODE.OUTLINE}
					data-cy="styled-button">
					Styled Button
				</BaseButton>,
			)

			const button = screen.getByTestId('styled-button')
			expect(button).toHaveClass('custom-class')
			expect(button.className).toContain('border-secondary')
		})

		it('lets a consumer className override a conflicting utility', () => {
			render(
				<BaseButton
					className="px-2"
					data-cy="override-button">
					Override
				</BaseButton>,
			)

			const button = screen.getByTestId('override-button')
			expect(button).toHaveClass('px-2')
			expect(button).not.toHaveClass('px-6')
		})

		it('falls back to the primary look for an unknown modeType', () => {
			render(
				<BaseButton
					modeType="nonexistent"
					data-cy="unknown-mode">
					Unknown
				</BaseButton>,
			)

			expect(screen.getByTestId('unknown-mode')).toHaveClass(
				'bg-accent-foreground',
			)
		})

		it('styles a link with a modeType as a button', () => {
			renderWithRouter(
				<BaseButton
					isLink
					modeType={BUTTON.MODE.OUTLINE}
					data-cy="button-styled-link">
					Contact
				</BaseButton>,
			)

			expect(screen.getByTestId('button-styled-link')).toHaveClass(
				'inline-flex',
			)
		})

		it('styles a link without a modeType as a text link', () => {
			renderWithRouter(
				<BaseButton
					isLink
					data-cy="text-link">
					Switch to Login
				</BaseButton>,
			)

			const link = screen.getByTestId('text-link')
			expect(link).toHaveClass('inline-block')
			expect(link).not.toHaveClass('inline-flex')
		})

		it('greys out a disabled button-styled link', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isDisabled
					modeType={BUTTON.MODE.OUTLINE}
					data-cy="disabled-button-link">
					Register
				</BaseButton>,
			)

			const span = screen.getByTestId('disabled-button-link')
			expect(span).toHaveAttribute('aria-disabled', 'true')
			expect(span).toHaveClass('bg-muted', 'cursor-default')
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

		it('focuses element when isError is true', () => {
			render(
				<BaseButton
					isError
					modeType={BUTTON.MODE.FLAT}
					data-cy="error-button">
					Error Button
				</BaseButton>,
			)

			const button = screen.getByTestId('error-button')
			expect(button).toHaveFocus()
		})

		it('focuses link element when isError is true', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isError
					modeType={BUTTON.MODE.FLAT}
					data-cy="error-link">
					Error Link
				</BaseButton>,
			)

			const link = screen.getByTestId('error-link')
			expect(link).toHaveFocus()
		})

		it('focuses disabled link (span) when isError is true', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isDisabled
					isError
					modeType={BUTTON.MODE.FLAT}
					data-cy="error-disabled-link">
					Error Disabled Link
				</BaseButton>,
			)

			const span = screen.getByTestId('error-disabled-link')
			expect(span).toHaveFocus()
		})
	})

	describe('Accessibility tests', () => {
		it('applies correct custom aria-label based on element type and children', () => {
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

		it('applies default "Link" aria-label to disabled link with non-string children', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isDisabled
					modeType={BUTTON.MODE.FLAT}
					data-cy="disabled-icon-link">
					<span>🔗</span>
				</BaseButton>,
			)

			const span = screen.getByTestId('disabled-icon-link')
			expect(span).toHaveAttribute('aria-label', 'Link')
		})

		it('applies custom aria-label to disabled link with non-string children', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isDisabled
					modeType={BUTTON.MODE.FLAT}
					data-cy="disabled-custom-icon-link"
					ariaLabel="Custom Disabled Link">
					<span>🔗</span>
				</BaseButton>,
			)

			const span = screen.getByTestId('disabled-custom-icon-link')
			expect(span).toHaveAttribute('aria-label', 'Custom Disabled Link')
		})

		it('does not apply aria-label to disabled link with string children', () => {
			renderWithRouter(
				<BaseButton
					isLink
					isDisabled
					modeType={BUTTON.MODE.FLAT}
					data-cy="disabled-text-link">
					Disabled Link Text
				</BaseButton>,
			)

			const span = screen.getByTestId('disabled-text-link')
			expect(span).not.toHaveAttribute('aria-label')
		})
	})
})
