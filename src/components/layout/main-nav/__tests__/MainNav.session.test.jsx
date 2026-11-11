import { act, render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import { PATHS } from '@/constants/ui'
import { SESSION_STORAGE_KEYS } from '@/constants/auth'

import authenticationReducer, {
	authActions,
	tryLogin,
} from '@/store/slices/authenticationSlice'
import travellersReducer, {
	checkIsTraveller,
	updateTraveller,
} from '@/store/slices/travellersSlice'
import messagesReducer from '@/store/slices/messagesSlice'

import MainNav from '@/components/layout/main-nav/MainNav'

const TRAVELLER = {
	id: 'traveller-uid',
	firstName: 'Ada',
	lastName: 'Lovelace',
}
const FULL_NAME = 'Ada Lovelace'
const SESSION = {
	token: 'token',
	userId: TRAVELLER.id,
	userEmail: 'ada@example.com',
	isAdmin: false,
}

const createStore = () =>
	configureStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
			messages: messagesReducer,
		},
	})

const json = (value) => ({ ok: true, json: async () => value })

// A page load without the travellers list: the session is restored and the traveller check reads the record, nothing else
const restoreSession = async (store, { isTraveller, displayName = '' }) => {
	localStorage.setItem(SESSION_STORAGE_KEYS.USER_NAME, displayName)
	global.fetch = vi.fn((url) =>
		Promise.resolve(
			json(
				url.includes('/firstName.json')
					? TRAVELLER.firstName
					: url.includes('/lastName.json')
						? TRAVELLER.lastName
						: isTraveller
							? { firstName: true }
							: null,
			),
		),
	)
	store.dispatch(
		tryLogin.fulfilled({ ...SESSION, userName: displayName }, 'req'),
	)
	await store.dispatch(checkIsTraveller(TRAVELLER.id))
}

// isTraveller is passed as false so the nav does not fetch messages; the name comes from the store either way
const renderNav = (store) =>
	render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[PATHS.MESSAGES]}>
				<MainNav
					isLoggedIn
					isTraveller={false}
				/>
			</MemoryRouter>
		</Provider>,
	)

const logoutLink = () => screen.getByRole('link', { name: /^Logout/ })

describe('<MainNav /> signed-in name', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it('shows the traveller name straight after a load, without the travellers list or an Auth display name', async () => {
		const store = createStore()
		await restoreSession(store, { isTraveller: true })

		renderNav(store)

		expect(logoutLink()).toHaveTextContent(`Logout ${FULL_NAME}`)
	})

	it('shows no name for a signed-in user who is not a traveller, even with a stale display name', async () => {
		const store = createStore()
		await restoreSession(store, {
			isTraveller: false,
			displayName: FULL_NAME,
		})

		renderNav(store)

		expect(logoutLink()).toHaveTextContent(/^Logout$/)
	})

	it('updates the name after the traveller edits it', async () => {
		const store = createStore()
		await restoreSession(store, { isTraveller: true })
		renderNav(store)

		act(() => {
			store.dispatch(
				updateTraveller.fulfilled(
					{ ...TRAVELLER, firstName: 'Augusta' },
					'req',
				),
			)
		})

		expect(logoutLink()).toHaveTextContent('Logout Augusta Lovelace')
	})

	it('clears the name when the session ends', async () => {
		const store = createStore()
		await restoreSession(store, { isTraveller: true })
		renderNav(store)

		act(() => {
			store.dispatch(authActions.clearUser())
		})

		expect(logoutLink()).toHaveTextContent(/^Logout$/)
	})
})
