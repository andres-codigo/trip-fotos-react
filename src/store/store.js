import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, createTransform } from 'redux-persist'
import { combineReducers } from 'redux'

import storage from './storage'
import authenticationReducer from './slices/authenticationSlice'
import travellersReducer from './slices/travellersSlice'
import messagesReducer from './slices/messagesSlice'

const rootReducer = combineReducers({
	authentication: authenticationReducer,
	travellers: travellersReducer,
	messages: messagesReducer,
})

// A persisted list can outlive the database, so a reload must not trust it until it has been fetched again
const resetLastFetch = createTransform(
	(inboundState) => inboundState,
	(outboundState) => ({ ...outboundState, lastFetch: null }),
	{ whitelist: ['travellers'] },
)

const persistConfig = {
	key: 'root',
	storage,
	// Messages are private and fetched fresh on the Messages page, so they must not sit in localStorage
	blacklist: ['messages'],
	transforms: [resetLastFetch],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				warnAfter: 128,
				ignoredActions: [
					'persist/FLUSH',
					'persist/REHYDRATE',
					'persist/PAUSE',
					'persist/PERSIST',
					'persist/PURGE',
					'persist/REGISTER',
				],
				// File objects are passed to the upload thunk, never stored in state
				ignoredActionPaths: ['meta.arg.files'],
			},
		}),
})

export const persistor = persistStore(store)

export default store
