import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { selectAuthenticationToken } from './authenticationSlice';

import { handleApiError } from '../../utils/errorHandler';

import { TravellersActionTypes } from '../../constants/action-types';
import { APIErrorMessageConstants } from '../../constants/api-messages';
import { APIConstants } from '../../constants/api';

export const travellerName = createAsyncThunk(
	TravellersActionTypes.TRAVELLER_NAME,
	async (data, { getState, rejectWithValue, dispatch }) => {
		try {
			const token = selectAuthenticationToken(getState());
			const fullName = `${data.first} ${data.last}`;

			const response = await fetch(
				`${APIConstants.API_URL}update?key=${APIConstants.API_KEY}`,
				{
					method: APIConstants.POST,
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
					`${APIErrorMessageConstants.UPDATE_TRAVELLER_NAME}${fullName}.`,
				);
			}

			localStorage.setItem('userName', updateResponse.displayName);
			dispatch(setTravellerName(updateResponse.displayName));
			return updateResponse.displayName;
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${APIErrorMessageConstants.UPDATE_TRAVELLER_NAME_CATCH} ${data.first} ${data.last}.`,
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
