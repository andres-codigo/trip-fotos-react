import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'
import messagesReducer from '@/store/slices/messagesSlice'

import MainNav from '@/components/layout/main-nav/MainNav'

const USER_ID = 'ada-uid'

const createStore = ({ travellerName = 'Ada Lovelace', messages = [] } = {}) =>
	configureTestStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
			messages: messagesReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token: 'token',
				userId: USER_ID,
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				travellerName,
			},
			messages: {
				...messagesReducer(undefined, { type: '@@init' }),
				messages,
			},
		},
	})

// isTraveller is passed so the nav never fetches messages; the store's messages feed the count
const renderNav = ({
	isLoggedIn = true,
	isTraveller = true,
	path = PATHS.TRAVELLERS,
	store = createStore(),
	useLogout,
} = {}) => {
	render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[path]}>
				<MainNav
					isLoggedIn={isLoggedIn}
					isTraveller={isTraveller}
					{...(useLogout && { useLogout })}
				/>
				<Routes>
					<Route
						path="*"
						element={null}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	)
	return store
}

const mainNav = () => screen.getByRole('navigation', { name: 'Main' })

describe('<MainNav />', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	describe('Rendering tests', () => {
		it('renders nothing when logged out', () => {
			renderNav({ isLoggedIn: false })

			expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
			expect(
				screen.queryByRole('button', { name: /^Account/ }),
			).not.toBeInTheDocument()
		})

		it('lists Travellers, Messages and My trip for a traveller, and no Logout', () => {
			renderNav()

			const links = within(mainNav()).getAllByRole('link')
			expect(links.map((link) => link.textContent)).toEqual([
				'Travellers',
				'Messages',
				'My trip',
			])
			expect(links[2]).toHaveAttribute(
				'href',
				`${PATHS.TRAVELLERS}/${USER_ID}`,
			)
			expect(
				within(mainNav()).queryByText(/log ?out/i),
			).not.toBeInTheDocument()
		})

		it('lists Travellers and Register for a user who is not a traveller', () => {
			renderNav({ isTraveller: false })

			const links = within(mainNav()).getAllByRole('link')
			expect(links.map((link) => link.textContent)).toEqual([
				'Travellers',
				'Register',
			])
			expect(links[1]).toHaveAttribute('href', PATHS.REGISTER)
		})

		it.each([
			[PATHS.TRAVELLERS, 'Travellers'],
			[PATHS.MESSAGES, 'Messages'],
			[`${PATHS.TRAVELLERS}/${USER_ID}`, 'My trip'],
			[`${PATHS.TRAVELLERS}/${USER_ID}/edit`, 'My trip'],
		])('marks only the current page on %s', (path, current) => {
			renderNav({ path })

			const marked = within(mainNav())
				.getAllByRole('link')
				.filter((link) => link.getAttribute('aria-current') === 'page')
			expect(marked).toHaveLength(1)
			expect(marked[0]).toHaveTextContent(current)
		})

		it("marks nothing on someone else's trip", () => {
			renderNav({ path: `${PATHS.TRAVELLERS}/someone-else` })

			expect(
				within(mainNav())
					.getAllByRole('link')
					.some((link) => link.hasAttribute('aria-current')),
			).toBe(false)
		})

		it('shows the unread count on Messages', () => {
			renderNav({
				store: createStore({
					messages: [
						{ id: 'm1', read: false },
						{ id: 'm2', read: true },
					],
				}),
			})

			expect(
				within(mainNav()).getByRole('link', {
					name: 'Messages, 1 unread message',
				}),
			).toBeInTheDocument()
		})

		it('names the account button after the signed-in traveller', () => {
			renderNav()

			expect(
				screen.getByRole('button', { name: 'Account, Ada Lovelace' }),
			).toHaveAttribute('aria-expanded', 'false')
		})
	})

	describe('Behaviour tests', () => {
		it('logs out from the account menu', () => {
			const handleLogOut = vi.fn()
			renderNav({ useLogout: () => handleLogOut })

			fireEvent.click(
				screen.getByRole('button', { name: 'Account, Ada Lovelace' }),
			)
			fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

			expect(handleLogOut).toHaveBeenCalledOnce()
		})
	})
})
