import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { GLOBAL } from '@/constants/ui'

import ErrorSummary from '@/components/ui/form/error-summary/ErrorSummary'

const ERRORS = [
	{ id: 'first-name', message: 'Enter your first name' },
	{ id: 'last-name', message: 'Enter your last name' },
]

const getSummary = () =>
	screen.getByRole('heading', { name: GLOBAL.ERROR_SUMMARY_TITLE })
		.parentElement

describe('<ErrorSummary />', () => {
	it('renders nothing when there are no errors', () => {
		const { container } = render(<ErrorSummary errors={[]} />)
		expect(container).toBeEmptyDOMElement()
	})

	it('renders the heading and one link per error, in order', () => {
		render(<ErrorSummary errors={ERRORS} />)
		const heading = screen.getByRole('heading', {
			level: 2,
			name: GLOBAL.ERROR_SUMMARY_TITLE,
		})
		expect(getSummary()).toHaveAttribute('aria-labelledby', heading.id)

		const links = screen.getAllByRole('link')
		expect(links.map((link) => link.textContent)).toEqual(
			ERRORS.map(({ message }) => message),
		)
		expect(links.map((link) => link.getAttribute('href'))).toEqual(
			ERRORS.map(({ id }) => `#${id}`),
		)
	})

	it('uses a custom title', () => {
		render(
			<ErrorSummary
				errors={ERRORS}
				title="Check your trip"
			/>,
		)
		expect(
			screen.getByRole('heading', { name: 'Check your trip' }),
		).toBeInTheDocument()
	})

	it('moves focus to the field when its link is clicked', () => {
		render(
			<>
				<ErrorSummary errors={ERRORS} />
				<input id="first-name" />
				<input id="last-name" />
			</>,
		)
		const field = document.getElementById('last-name')
		field.scrollIntoView = vi.fn()

		const event = fireEvent.click(
			screen.getByRole('link', { name: 'Enter your last name' }),
		)

		expect(event).toBe(false)
		expect(field).toHaveFocus()
		expect(field.scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
	})

	it('does not take focus on first render with focusKey 0', () => {
		render(<ErrorSummary errors={ERRORS} />)
		expect(getSummary()).not.toHaveFocus()
	})

	it('takes focus each time focusKey goes up', () => {
		const { rerender } = render(
			<>
				<ErrorSummary
					errors={ERRORS}
					focusKey={0}
				/>
				<input aria-label="Other" />
			</>,
		)
		const other = screen.getByRole('textbox', { name: 'Other' })

		rerender(
			<>
				<ErrorSummary
					errors={ERRORS}
					focusKey={1}
				/>
				<input aria-label="Other" />
			</>,
		)
		expect(getSummary()).toHaveFocus()

		other.focus()
		rerender(
			<>
				<ErrorSummary
					errors={ERRORS.slice(1)}
					focusKey={1}
				/>
				<input aria-label="Other" />
			</>,
		)
		expect(other).toHaveFocus()

		rerender(
			<>
				<ErrorSummary
					errors={ERRORS.slice(1)}
					focusKey={2}
				/>
				<input aria-label="Other" />
			</>,
		)
		expect(getSummary()).toHaveFocus()
	})
})
