import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import authenticationReducer, {
	authActions,
	login,
} from '@/store/slices/authenticationSlice'
import travellersReducer, {
	checkIsTraveller,
	loadTraveller,
	selectIsTraveller,
	selectSelectedTraveller,
} from '@/store/slices/travellersSlice'

const ADMIN_SESSION = {
	token: 'admin-token',
	userId: 'admin-uid',
	userName: 'Admin',
	userEmail: 'admin@example.com',
	isAdmin: true,
}
const STANDARD_SESSION = {
	token: 'standard-token',
	userId: 'standard-uid',
	userName: 'Standard',
	userEmail: 'standard@example.com',
	isAdmin: false,
}
const VIEWED_TRAVELLER = { id: 'traveller-uid', firstName: 'Ada' }

const createStore = () =>
	configureStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
		},
	})

const signInAs = (store, session) =>
	store.dispatch(login.fulfilled(session, 'req', {}))

describe('signing out and in as another user', () => {
	it('does not carry over admin, traveller or selected traveller state', () => {
		const store = createStore()
		signInAs(store, ADMIN_SESSION)
		store.dispatch(
			checkIsTraveller.fulfilled(true, 'req', ADMIN_SESSION.userId),
		)
		store.dispatch(
			loadTraveller.fulfilled(
				VIEWED_TRAVELLER,
				'req',
				VIEWED_TRAVELLER.id,
			),
		)
		expect(store.getState().authentication.isAdmin).toBe(true)
		expect(selectIsTraveller(store.getState())).toBe(true)

		store.dispatch(authActions.clearUser())
		signInAs(store, STANDARD_SESSION)

		const state = store.getState()
		expect(state.authentication).toMatchObject({
			userId: STANDARD_SESSION.userId,
			isAdmin: false,
		})
		expect(selectIsTraveller(state)).toBe(false)
		expect(selectSelectedTraveller(state)).toBeNull()
	})
})
