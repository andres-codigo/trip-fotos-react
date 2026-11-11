import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
		expect(link).toHaveAttribute('data-cy', 'nav-link')
		expect(link).not.toHaveAttribute('aria-current')
	})

	it('marks the current page with aria-current and the bar', () => {
		renderLink({ isActive: true })

		const link = screen.getByRole('link', { name: 'Travellers' })
		expect(link).toHaveAttribute('aria-current', 'page')
		expect(link.className).toMatch(/after:bg-accent-text/)
	})

	it('takes an accessible name and extra classes', () => {
		renderLink({ ariaLabel: 'All travellers', className: 'extra' })

		const link = screen.getByRole('link', { name: 'All travellers' })
		expect(link).toHaveClass('extra')
	})
})
