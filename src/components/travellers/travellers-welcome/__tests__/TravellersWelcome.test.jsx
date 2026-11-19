import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PATHS } from '@/constants/ui'
import { TRAVELLERS_WELCOME_CONFIG } from '@/constants/travellers'

import TravellersWelcome from '@/components/travellers/travellers-welcome/TravellersWelcome'

const renderWelcome = (props = {}) =>
	render(
		<MemoryRouter>
			<TravellersWelcome {...props} />
		</MemoryRouter>,
	)

describe('<TravellersWelcome />', () => {
	it('shows a section labelled by its heading, and the copy', () => {
		renderWelcome()

		expect(
			screen.getByRole('region', {
				name: TRAVELLERS_WELCOME_CONFIG.TITLE,
			}),
		).toContainElement(
			screen.getByRole('heading', {
				level: 2,
				name: TRAVELLERS_WELCOME_CONFIG.TITLE,
			}),
		)
		expect(
			screen.getByText(TRAVELLERS_WELCOME_CONFIG.TEXT),
		).toBeInTheDocument()
		expect(
			screen.getByText(TRAVELLERS_WELCOME_CONFIG.LOG_IN_PROMPT, {
				exact: false,
			}),
		).toBeInTheDocument()
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
	})

	it('sends Log in to the authentication page', () => {
		renderWelcome()

		const link = screen.getByRole('link', {
			name: TRAVELLERS_WELCOME_CONFIG.LOG_IN,
		})
		expect(link).toHaveAttribute('href', PATHS.AUTHENTICATION)
	})
})
