import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PATHS } from '@/constants/ui'
import { TRAVELLERS_WELCOME } from '@/constants/test'
import { TRAVELLERS_WELCOME_CONFIG } from '@/constants/travellers'

import TravellersWelcome from '@/components/travellers/travellers-welcome/TravellersWelcome'

const renderWelcome = (props = {}) =>
	render(
		<MemoryRouter>
			<TravellersWelcome {...props} />
		</MemoryRouter>,
	)

describe('<TravellersWelcome />', () => {
	it('shows the heading and the copy', () => {
		renderWelcome()

		expect(
			screen.getByRole('heading', {
				level: 2,
				name: TRAVELLERS_WELCOME_CONFIG.TITLE,
			}),
		).toBeInTheDocument()
		expect(
			screen.getByText(TRAVELLERS_WELCOME_CONFIG.TEXT),
		).toBeInTheDocument()
		expect(
			screen.getByText(TRAVELLERS_WELCOME_CONFIG.LOG_IN_PROMPT, {
				exact: false,
			}),
		).toBeInTheDocument()
	})

	it('labels the section with its heading', () => {
		renderWelcome()

		expect(
			screen.getByRole('region', {
				name: TRAVELLERS_WELCOME_CONFIG.TITLE,
			}),
		).toBe(screen.getByTestId(TRAVELLERS_WELCOME.ROOT))
	})

	it('sends Create an account to the sign-up form', () => {
		renderWelcome()

		const link = screen.getByRole('link', {
			name: TRAVELLERS_WELCOME_CONFIG.CREATE_ACCOUNT,
		})
		expect(link).toHaveAttribute(
			'href',
			`${PATHS.AUTHENTICATION}?mode=signup`,
		)
		expect(link).toBe(screen.getByTestId(TRAVELLERS_WELCOME.CREATE_ACCOUNT))
	})

	it('sends Log in to the authentication page', () => {
		renderWelcome()

		const link = screen.getByRole('link', {
			name: TRAVELLERS_WELCOME_CONFIG.LOG_IN,
		})
		expect(link).toHaveAttribute('href', PATHS.AUTHENTICATION)
		expect(link).toBe(screen.getByTestId(TRAVELLERS_WELCOME.LOG_IN))
	})

	it('merges a className passed by the parent', () => {
		renderWelcome({ className: 'mt-2' })

		expect(screen.getByTestId(TRAVELLERS_WELCOME.ROOT)).toHaveClass(
			'mt-2',
			'bg-surface-accent',
		)
	})
})
