import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { THREAD_HEADER } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import ThreadHeader from '@/components/messages/thread-header/ThreadHeader'

const headerProps = {
	name: 'Ana Lopes',
	status: SENDER_STATUS.TRAVELLER,
	otherId: 'traveller-1',
	subtitle: MESSAGES_CONFIG.TRAVELLER_SUBTITLE('Lisbon'),
	backTo: PATHS.MESSAGES,
}

const renderHeader = (props = {}) => {
	const onDelete = vi.fn()
	const headingRef = createRef()
	render(
		<MemoryRouter>
			<ThreadHeader
				{...headerProps}
				onDelete={onDelete}
				headingRef={headingRef}
				{...props}
			/>
			<p>Outside</p>
		</MemoryRouter>,
	)
	return { onDelete, headingRef }
}

const menuButton = () => screen.getByTestId(THREAD_HEADER.MENU_BUTTON)

describe('<ThreadHeader />', () => {
	it('renders a back link, the name as a focusable heading and the subtitle', () => {
		const { headingRef } = renderHeader()

		expect(
			screen.getByRole('link', { name: MESSAGES_CONFIG.BACK_LABEL }),
		).toHaveAttribute('href', PATHS.MESSAGES)
		const heading = screen.getByRole('heading', { level: 2 })
		expect(heading).toHaveAttribute('tabindex', '-1')
		expect(headingRef.current).toBe(heading)
		expect(screen.getByTestId(THREAD_HEADER.SUBTITLE)).toHaveTextContent(
			'Traveller · Lisbon',
		)
	})

	it('links a traveller’s name to their card', () => {
		renderHeader()

		expect(screen.getByTestId(THREAD_HEADER.NAME_LINK)).toHaveAttribute(
			'href',
			`${PATHS.TRAVELLERS}/traveller-1`,
		)
	})

	it.each([SENDER_STATUS.FORMER, SENDER_STATUS.LEGACY])(
		'shows a %s name as plain text with no card in the menu',
		(status) => {
			renderHeader({ status, otherId: null })

			expect(
				screen.queryByTestId(THREAD_HEADER.NAME_LINK),
			).not.toBeInTheDocument()
			fireEvent.click(menuButton())
			expect(
				screen.queryByTestId(THREAD_HEADER.VIEW_CARD),
			).not.toBeInTheDocument()
			expect(screen.getByTestId(THREAD_HEADER.DELETE)).toBeInTheDocument()
		},
	)

	it('opens and closes the menu from its button', () => {
		renderHeader()

		expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
		expect(menuButton()).toHaveAccessibleName(MESSAGES_CONFIG.OPTIONS_LABEL)
		fireEvent.click(menuButton())

		const menu = screen.getByTestId(THREAD_HEADER.MENU)
		expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
		expect(menuButton()).toHaveAttribute('aria-controls', menu.id)
		expect(screen.getByTestId(THREAD_HEADER.VIEW_CARD)).toHaveAttribute(
			'href',
			`${PATHS.TRAVELLERS}/traveller-1`,
		)

		fireEvent.click(menuButton())
		expect(screen.queryByTestId(THREAD_HEADER.MENU)).not.toBeInTheDocument()
	})

	it('closes on Escape and returns focus to the button', () => {
		renderHeader()

		fireEvent.click(menuButton())
		fireEvent.keyDown(screen.getByTestId(THREAD_HEADER.DELETE), {
			key: 'Escape',
		})

		expect(screen.queryByTestId(THREAD_HEADER.MENU)).not.toBeInTheDocument()
		expect(menuButton()).toHaveFocus()
	})

	it('closes on a click outside', () => {
		renderHeader()

		fireEvent.click(menuButton())
		fireEvent.click(screen.getByText('Outside'))

		expect(screen.queryByTestId(THREAD_HEADER.MENU)).not.toBeInTheDocument()
	})

	it('closes the menu and calls onDelete', () => {
		const { onDelete } = renderHeader()

		fireEvent.click(menuButton())
		fireEvent.click(screen.getByTestId(THREAD_HEADER.DELETE))

		expect(onDelete).toHaveBeenCalledOnce()
		expect(screen.queryByTestId(THREAD_HEADER.MENU)).not.toBeInTheDocument()
	})
})
