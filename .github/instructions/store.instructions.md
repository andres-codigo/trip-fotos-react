---
name: redux-store-development
description: Use when creating Redux slices, async thunks, configuring state, or modifying store logic. Covers slice structure, thunk error handling, persistence configuration, and testing requirements.
applyTo: ['src/store/**/*.js', 'src/store/**/*.jsx']
---

# Redux Store Development Guidance

## Slices & State Structure

- Redux slices are located in `src/store/slices/`.
- Each slice file should export a reducer and any associated actions or thunks.
- State is persisted using `redux-persist`; configuration is in `src/store/store.js`.

## Async Logic: Thunks

All asynchronous operations should use **Redux Thunks**. This ensures consistent state management and error handling across the application.

### Error Handling Pattern

The standard practice is to check `!response.ok` and throw a generic `REQUEST_ERROR` (or a valid user-facing error message) rather than performing granular status code checks, **unless specific UI behaviour depends on the status code**.

```javascript
export const fetchTravellersThunk = createAsyncThunk(
	'travellers/fetchTravellersThunk',
	async (_, { rejectWithValue }) => {
		try {
			const response = await fetch(API_URL)
			if (!response.ok) {
				throw new Error(REQUEST_ERROR)
			}
			return await response.json()
		} catch (error) {
			return rejectWithValue(error.message)
		}
	},
)
```

## Constants & Error Messages

- **Strictly** use centralized constants from `src/constants` (e.g., `PATHS`, `API_DATABASE`, `REQUEST_ERROR`).
- Do not hardcode strings for error messages, API URLs, or paths.
- **Error Constants separation**:
    - Use `API_ERROR_MESSAGE` for internal/technical log messages and logic checks (e.g., 'Failed to fetch').
    - Use `ERROR_MESSAGES` for user-facing UI strings.

## State Persistence

Persisted state is configured in `src/store/store.js`. When modifying which slices or state properties should persist, update the persist configuration accordingly.

## Testing

When modifying Redux slices (`src/store/slices/`) or the store configuration (`src/store/store.js`), **immediately update or create** the corresponding Vitest test file (`*.test.js`) to reflect changes in:

- Reducers
- Actions
- Thunks (especially error handling)
- Store setup and persistence

### Running Tests

- Unit/Integration tests: `npm run vitest:run` or `npm run vitest:watch`
- Test with coverage: `npm run vitest:coverage`

### Mocking

Use `src/testUtils` and `src/constants/test` for mocks and test data.
