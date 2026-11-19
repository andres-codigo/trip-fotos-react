import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { BUTTON } from '@/constants/test'

import BaseButton from '@/components/ui/button/BaseButton'

const renderWithRouter = (component) => {
	return render(<MemoryRouter>{component}</MemoryRouter>)
}

const ELEMENTS = {
	button: {},
	link: { isLink: true },
	'disabled link': { isLink: true, isDisabled: true },
}

const renderElement = (kind, props, children) =>
	renderWithRouter(
		<BaseButton
			modeType={BUTTON.MODE.FLAT}
			data-cy="subject"
			{...ELEMENTS[kind]}
			{...props}>
			{children}
		</BaseButton>,
	)

describe('<BaseButton />', () => {
	describe('Rendering tests', () => {
		it('renders a button, a link, or an unfocusable span for a disabled link', () => {
			renderWithRouter(
				<>
					<BaseButton
						isDisabled
						data-cy="button">
						Button
					</BaseButton>
					<BaseButton
						isLink
						to="/test"
						data-cy="link">
						Link
					</BaseButton>
					<BaseButton
						isLink
						data-cy="default-link">
						Home
					</BaseButton>
					<BaseButton
						isLink
						isDisabled
						to="/test"
						data-cy="disabled-link">
						Disabled
					</BaseButton>
				</>,
			)

			expect(screen.getByTestId('button').tagName).toBe('BUTTON')
			expect(screen.getByTestId('button')).toBeDisabled()
			expect(screen.getByTestId('link')).toHaveAttribute('href', '/test')
			expect(screen.getByTestId('link')).not.toHaveAttribute(
				'aria-disabled',
			)
			expect(screen.getByTestId('default-link')).toHaveAttribute(
				'href',
				'/',
			)
			const span = screen.getByTestId('disabled-link')
			expect(span.tagName).toBe('SPAN')
			expect(span).not.toHaveAttribute('href')
			expect(span).toHaveAttribute('aria-disabled', 'true')
			expect(span).toHaveAttribute('tabindex', '-1')
		})

		it.each([
			[
				'button',
				{ id: 'custom-id', tabIndex: 2 },
				{ id: 'custom-id', tabindex: '2' },
			],
			[
				'link',
				{ target: '_blank', rel: 'noopener' },
				{ target: '_blank', rel: 'noopener' },
			],
			[
				'disabled link',
				{ id: 'disabled-span', title: 'Tip' },
				{ id: 'disabled-span', title: 'Tip' },
			],
		])('spreads additional props to the %s', (kind, props, attributes) => {
			renderElement(kind, { ...props, onClick: () => {} }, 'Label')

			for (const [name, value] of Object.entries(attributes)) {
				expect(screen.getByTestId('subject')).toHaveAttribute(
					name,
					value,
				)
			}
		})
	})

	describe('Behaviour tests', () => {
		it.each(Object.keys(ELEMENTS))(
			'focuses the %s when isError is true',
			(kind) => {
				renderElement(kind, { isError: true }, 'Error')

				expect(screen.getByTestId('subject')).toHaveFocus()
			},
		)
	})

	describe('Accessibility tests', () => {
		it.each([
			['button', 'Button'],
			['link', 'Link'],
			['disabled link', 'Link'],
		])(
			'labels a %s with non-string children "%s" by default',
			(kind, label) => {
				renderElement(kind, {}, <span>🔥</span>)

				expect(screen.getByTestId('subject')).toHaveAttribute(
					'aria-label',
					label,
				)
			},
		)

		it.each(Object.keys(ELEMENTS))(
			'uses a custom aria-label on a %s with non-string children',
			(kind) => {
				renderElement(kind, { ariaLabel: 'Custom' }, <span>🔥</span>)

				expect(screen.getByTestId('subject')).toHaveAttribute(
					'aria-label',
					'Custom',
				)
			},
		)

		it.each(Object.keys(ELEMENTS))(
			'adds no aria-label to a %s with string children',
			(kind) => {
				renderElement(kind, {}, 'Click me')

				expect(screen.getByTestId('subject')).not.toHaveAttribute(
					'aria-label',
				)
			},
		)
	})

	describe('Busy state', () => {
		it('keeps the button, swaps in the -ing label and marks it busy', () => {
			renderWithRouter(
				<BaseButton
					type="submit"
					busyLabel="Logging in…">
					Log in
				</BaseButton>,
			)
			const button = screen.getByRole('button', { name: 'Logging in…' })

			expect(button).toBeDisabled()
			expect(button).toHaveAttribute('aria-busy', 'true')
		})

		it('is not busy without a busy label', () => {
			renderWithRouter(<BaseButton type="submit">Log in</BaseButton>)

			expect(
				screen.getByRole('button', { name: 'Log in' }),
			).not.toHaveAttribute('aria-busy')
		})
	})
})
