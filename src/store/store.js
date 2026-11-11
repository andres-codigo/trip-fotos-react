import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, createTransform } from 'redux-persist'
import { combineReducers } from 'redux'

import { middleware } from './middleware'
import storage from './storage'
import authenticationReducer from './slices/authenticationSlice'
import travellersReducer from './slices/travellersSlice'
import messagesReducer from './slices/messagesSlice'

const rootReducer = combineReducers({
	authentication: authenticationReducer,
	travellers: travellersReducer,
	messages: messagesReducer,
})

// A persisted list can outlive the database, so a reload must not trust it until it has been fetched again; an upload cannot survive a reload either
const resetLastFetch = createTransform(
	(inboundState) => inboundState,
	(outboundState) => ({
		...outboundState,
		lastFetch: null,
		uploadProgress: null,
	}),
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
	middleware,
})

export const persistor = persistStore(store)

export default store
