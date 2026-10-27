---
name: redux-store-development
description: Use when creating Redux slices, async thunks, configuring state, or modifying store logic. Covers slice structure, thunk patterns, error handling, persistence, and testing requirements.
applyTo: 'src/store/**/*.{jsx,js}'
---

# Redux Store Development Guidance

## Slices & State Structure

- Redux slices are located in `src/store/slices/`.
- Each slice file should export a reducer and any associated actions, thunks and selectors.
- State is persisted using `redux-persist`; configuration is in `src/store/store.js`.

## Data Fetching Strategy

Thunks (`createAsyncThunk`) are the single standard for server data. There is no RTK Query in this app; do not add `createApi` alongside them.

- **Realtime Database** calls use `fetch` from inside a thunk.
- **Auth and Storage** calls use the Firebase SDK from inside a thunk.
- Components, hooks and pages never call `fetch` themselves; they dispatch a thunk (target: `useCitySearch` still does, see #396).
- Each slice owns `status` and `error` for its thunks, set from `pending`/`fulfilled`/`rejected` extra reducers.

### Shared Request Helper (target — #396)

Today each thunk repeats the `fetch(\`${API_DATABASE.BASE_URL}/...json?auth=${token}\`, { headers: COMMON_HEADERS.JSON })` block. New thunks must not add another copy: use the shared helper once it exists, and until then follow the shape below exactly so migration is mechanical.

### Error Handling Pattern

Check `!response.ok` and throw a generic `REQUEST_ERROR` (or a user-facing message from `ERROR_MESSAGES`) rather than performing granular status code checks, **unless specific UI behaviour depends on the status code**. Always reject with a string: `rejectWithValue(error.message)`, never the error object.

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

Reference implementations: `loadMessages` in `src/store/slices/messagesSlice.js` (fetch) and `login` in `src/store/slices/authenticationSlice.js` (Firebase SDK, where `error.code` is mapped to a message).

## Constants & Error Messages

- **Strictly** use centralised constants from `src/constants` (e.g., `PATHS`, `API_DATABASE`, `REQUEST_ERROR`). The Realtime Database base URL is `API_DATABASE.BASE_URL`.
- Do not hardcode strings for error messages, API URLs, or paths.
- **Error Constants separation**:
    - Use `API_ERROR_MESSAGE` for internal/technical log messages and logic checks (e.g., 'Failed to fetch').
    - Use `ERROR_MESSAGES` for user-facing UI strings.
    - Firebase Auth messages currently sit under `AUTHENTICATION_ACTION_TYPES.*_MESSAGE` in `src/constants/auth`; do not add a further location (target: fold into `ERROR_MESSAGES`, #397).
    - Use `handleApiError` from `src/utils/errorHandler` to turn a caught error into a message; do not repeat `error.message || '...'` inline.

## State Persistence

Persisted state is configured in `src/store/store.js`. When modifying which slices or state properties should persist, update the persist configuration accordingly.

- `authentication` and `travellers` persist; `messages` is blacklisted.
- A `resetLastFetch` transform nulls `travellers.lastFetch` on rehydrate so a persisted list is always reconciled with the database.
- `src/store/storage.js` is a Vite CommonJS interop shim for `redux-persist`'s storage; import storage from it, not from `redux-persist/lib/storage`.
- Non-serialisable action arguments (e.g. `meta.arg.files`) are listed in `ignoredActionPaths` in the serialisable check; add to it rather than disabling the check.
- The session is also mirrored to `localStorage` (`token`, `userId`, `userName`, `userEmail`, `tokenExpiration`, `isAdmin`). Read it through the selectors in `authenticationSlice.js` (`selectUserId`, `selectAuthenticationToken`, …), never `localStorage.getItem` (target: key constant and call-site cleanup, #398).

- Keep private data (e.g. messages) out of redux-persist, and clear it on logout — including when logout is rejected.

## Authentication

- Sign in through the Firebase Auth SDK, not the Identity Toolkit REST API — the Storage SDK needs a signed-in SDK user to authorise uploads.
- Ensure Auth is initialised before Storage is used.

## Testing

When modifying Redux slices (`src/store/slices/`) or the store configuration (`src/store/store.js`), **immediately update or create** the corresponding Vitest test file (`*.test.js`) to reflect changes in:

- Reducers
- Actions
- Thunks (especially error handling)
- Store setup and persistence

See [testing.instructions.md](./testing.instructions.md) for broader Vitest/Cypress conventions.

## Linting And Formatting

- Ensure every edited or newly created store file and related test file is ESLint-clean and Prettier-formatted before finishing work.

### Running Tests

- Unit/Integration tests: `npm run vitest:run` or `npm run vitest:watch`
- Test with coverage: `npm run vitest:coverage`

### Mocking

Use `src/testUtils` and `src/constants/test` for mocks and test data.
