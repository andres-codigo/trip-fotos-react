import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { TOP_NAVIGATION_SELECTORS } from '@/constants/test'

import NavMenuMessagesLink from '@/components/layout/main-nav/nav-menu/NavMenuMessagesLink'

const renderLink = (props = {}) =>
	render(
		<MemoryRouter>
			<ul>
				<NavMenuMessagesLink
					to="/messages"
					data-cy="nav-menu-item-messages"
					{...props}
				/>
			</ul>
		</MemoryRouter>,
	)

const countSelector = TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES

describe('<NavMenuMessagesLink />', () => {
	it('renders a list item with a Messages link', () => {
		renderLink()

		const link = screen.getByRole('link', { name: 'Messages' })
		expect(link.closest('li')).toBeInTheDocument()
		expect(link).toHaveAttribute('href', '/messages')
		expect(link).toHaveAttribute('data-cy', 'nav-menu-item-messages')
		expect(document.querySelector(countSelector)).toBeNull()
	})

	it('shows the unread count inside the link and in its name', () => {
		renderLink({ unreadMessages: 12 })

		const link = screen.getByRole('link', {
			name: 'Messages, 12 unread messages',
		})
		expect(link.querySelector(countSelector)).toHaveTextContent('12')
	})

	it('marks the current page', () => {
		renderLink({ isActive: true })

		expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
	})
})
