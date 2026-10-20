import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
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

const persistConfig = {
	key: 'root',
	storage,
	// Messages are private and fetched fresh on the Messages page, so they must not sit in localStorage
	blacklist: ['messages'],
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
