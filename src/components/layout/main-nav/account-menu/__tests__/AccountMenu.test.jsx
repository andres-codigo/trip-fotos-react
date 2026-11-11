import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ACCOUNT_MENU } from '@/constants/test'
import { NAVIGATION } from '@/constants/ui'

import AccountMenu from '@/components/layout/main-nav/account-menu/AccountMenu'

const NAME = 'Ada Byron Lovelace'

const renderMenu = (props = {}) => {
	const onLogOut = vi.fn()
	render(
		<AccountMenu
			name={NAME}
			onLogOut={onLogOut}
			{...props}
		/>,
	)
	return { onLogOut, button: screen.getByTestId(ACCOUNT_MENU.BUTTON) }
}

const getAvatar = (button) => button.querySelector('[data-initials]')

const queryPanel = () => screen.queryByTestId(ACCOUNT_MENU.PANEL)

describe('<AccountMenu />', () => {
	describe('Rendering tests', () => {
		it('renders a closed disclosure button', () => {
			const { button } = renderMenu()
			expect(screen.getByTestId(ACCOUNT_MENU.ROOT)).toBeInTheDocument()
			expect(button).toHaveAttribute('type', 'button')
			expect(button).toHaveAttribute('aria-expanded', 'false')
			expect(button).toHaveAttribute('aria-controls')
			expect(queryPanel()).not.toBeInTheDocument()
		})

		it('labels the button with the name', () => {
			const { button } = renderMenu()
			expect(button).toHaveAccessibleName(NAVIGATION.ACCOUNT_LABEL(NAME))
		})

		it('labels the button generically without a name', () => {
			const { button } = renderMenu({ name: '' })
			expect(button).toHaveAccessibleName(NAVIGATION.ACCOUNT_LABEL(''))
			expect(button).toHaveTextContent(NAVIGATION.ACCOUNT_FALLBACK)
			expect(getAvatar(button)).toHaveAttribute('data-initials', '')
			expect(button.querySelector('svg')).toHaveAttribute(
				'aria-hidden',
				'true',
			)
		})

		it('shows the initials of the first and last word and the first name', () => {
			const { button } = renderMenu()
			expect(getAvatar(button)).toHaveAttribute('data-initials', 'AL')
			expect(button).toHaveTextContent(/^Ada$/)
		})

		it('shows one initial for a single-word name', () => {
			const { button } = renderMenu({ name: 'cher' })
			expect(getAvatar(button)).toHaveAttribute('data-initials', 'C')
		})
	})

	describe('Behaviour tests', () => {
		it('toggles aria-expanded and the panel', () => {
			const { button } = renderMenu()
			fireEvent.click(button)
			expect(button).toHaveAttribute('aria-expanded', 'true')
			expect(queryPanel()).toHaveAttribute(
				'id',
				button.getAttribute('aria-controls'),
			)
			fireEvent.click(button)
			expect(button).toHaveAttribute('aria-expanded', 'false')
			expect(queryPanel()).not.toBeInTheDocument()
		})

		it('shows who is signed in and the Log out button', () => {
			const { button } = renderMenu()
			fireEvent.click(button)
			const signedInAs = screen.getByTestId(ACCOUNT_MENU.SIGNED_IN_AS)
			expect(signedInAs).toHaveTextContent(NAVIGATION.SIGNED_IN_AS)
			expect(signedInAs).toHaveTextContent(NAME)
			expect(screen.getByTestId(ACCOUNT_MENU.LOG_OUT)).toHaveTextContent(
				NAVIGATION.LOG_OUT,
			)
		})

		it('omits the signed-in block when there is no name', () => {
			const { button } = renderMenu({ name: '' })
			fireEvent.click(button)
			expect(
				screen.queryByTestId(ACCOUNT_MENU.SIGNED_IN_AS),
			).not.toBeInTheDocument()
			expect(screen.getByTestId(ACCOUNT_MENU.LOG_OUT)).toBeInTheDocument()
		})

		it('calls onLogOut with the event and closes', () => {
			const { button, onLogOut } = renderMenu()
			fireEvent.click(button)
			fireEvent.click(screen.getByTestId(ACCOUNT_MENU.LOG_OUT))
			expect(onLogOut).toHaveBeenCalledTimes(1)
			expect(onLogOut.mock.calls[0][0]).toHaveProperty('type', 'click')
			expect(queryPanel()).not.toBeInTheDocument()
			expect(button).toHaveAttribute('aria-expanded', 'false')
		})

		it('closes on Escape from inside the panel and refocuses the button', () => {
			const { button } = renderMenu()
			fireEvent.click(button)
			const logOut = screen.getByTestId(ACCOUNT_MENU.LOG_OUT)
			logOut.focus()
			fireEvent.keyDown(logOut, { key: 'Escape' })
			expect(queryPanel()).not.toBeInTheDocument()
			expect(button).toHaveFocus()
		})

		it('closes on Escape from the button', () => {
			const { button } = renderMenu()
			fireEvent.click(button)
			fireEvent.keyDown(button, { key: 'Escape' })
			expect(queryPanel()).not.toBeInTheDocument()
			expect(button).toHaveFocus()
		})

		it('closes on a click outside, not inside the panel', () => {
			const { button } = renderMenu()
			fireEvent.click(button)
			fireEvent.click(screen.getByTestId(ACCOUNT_MENU.SIGNED_IN_AS))
			expect(queryPanel()).toBeInTheDocument()
			fireEvent.click(document.body)
			expect(queryPanel()).not.toBeInTheDocument()
		})
	})
})
