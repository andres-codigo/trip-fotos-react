import { configureStore } from '@reduxjs/toolkit';

import authenticationReducer from './slices/authenticationSlice';
import travellersReducer from './slices/travellersSlice';

const store = configureStore({
	reducer: {
		authentication: authenticationReducer,
		travellers: travellersReducer,
	},
});

export default store;
