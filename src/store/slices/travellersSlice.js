import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { selectAuthenticationToken } from './authenticationSlice';

import { handleApiError } from '@/utils/errorHandler';

import { TRAVELLERS_ACTION_TYPES } from '@/constants/action-types';
import { API_ERROR_MESSAGE } from '@/constants/api-messages';
import { API_DATABASE } from '@/constants/api';

export const travellerName = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.TRAVELLER_NAME,
	async (data, { getState, rejectWithValue, dispatch }) => {
		const fullName = `${data.first} ${data.last}`;

		try {
			const token = selectAuthenticationToken(getState());

			const response = await fetch(
				`${API_DATABASE.API_URL}update?key=${API_DATABASE.API_KEY}`,
				{
					method: API_DATABASE.POST,
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						idToken: token,
						displayName: fullName,
					}),
				},
			);

			const updateResponse = await response.json();

			if (!response.ok) {
				return rejectWithValue(
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLER_NAME}${fullName}.`,
				);
			}

			localStorage.setItem('userName', updateResponse.displayName);
			dispatch(setTravellerName(updateResponse.displayName));
			return updateResponse.displayName;
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLER_NAME_CATCH}${fullName}`,
				),
			);
		}
	},
);

const travellersSlice = createSlice({
	name: 'travellers',
	initialState: {
		travellerName: '',
		status: 'idle',
		error: null,
	},
	reducers: {
		setTravellerName(state, action) {
			state.travellerName = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(travellerName.pending, (state) => {
				state.status = 'loading';
			})
			.addCase(travellerName.fulfilled, (state, action) => {
				state.status = 'succeeded';
				state.travellerName = action.payload;
			})
			.addCase(travellerName.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload;
			});
	},
});

export const { setTravellerName } = travellersSlice.actions;
export default travellersSlice.reducer;
