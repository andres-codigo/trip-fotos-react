import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import NavMenuButtonLink from '@/components/layout/main-nav/nav-menu/NavMenuButtonLink'

const renderLink = (props = {}) =>
	render(
		<MemoryRouter>
			<NavMenuButtonLink
				to="/travellers"
				data-cy="nav-link"
				{...props}>
				Travellers
			</NavMenuButtonLink>
		</MemoryRouter>,
	)

describe('<NavMenuButtonLink />', () => {
	it('renders a link to the given path', () => {
		renderLink()

		const link = screen.getByRole('link', { name: 'Travellers' })
		expect(link).toHaveAttribute('href', '/travellers')
		expect(link).not.toHaveAttribute('aria-current')
	})

	it('marks the current page with aria-current', () => {
		renderLink({ isActive: true })

		const link = screen.getByRole('link', { name: 'Travellers' })
		expect(link).toHaveAttribute('aria-current', 'page')
	})

	it('takes an accessible name', () => {
		renderLink({ ariaLabel: 'All travellers' })

		expect(
			screen.getByRole('link', { name: 'All travellers' }),
		).toBeInTheDocument()
	})

	describe('scroll to the top', () => {
		afterEach(() => vi.restoreAllMocks())

		it('scrolls to the top when the current page is tapped', () => {
			const scrollTo = vi
				.spyOn(window, 'scrollTo')
				.mockImplementation(() => {})
			renderLink({ isActive: true })

			fireEvent.click(screen.getByRole('link', { name: 'Travellers' }))

			expect(scrollTo).toHaveBeenCalledWith(
				expect.objectContaining({ top: 0 }),
			)
		})

		it('leaves the scroll to the route change for another page', () => {
			const scrollTo = vi
				.spyOn(window, 'scrollTo')
				.mockImplementation(() => {})
			renderLink()

			fireEvent.click(screen.getByRole('link', { name: 'Travellers' }))

			expect(scrollTo).not.toHaveBeenCalled()
		})
	})
})
