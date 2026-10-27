---
name: create-redux-slice
description: Use when creating a new Redux slice. Automates slice structure, reducer and thunk generation with proper error handling, test file setup, and store configuration updates.
---

# Redux Slice Scaffolding Workflow

Use this agent when you need to create a new Redux slice with reducers, async logic, and corresponding tests.

## Workflow Steps

1. **Slice Details**
    - Get the slice name (e.g., `travellers`, `messages`)
    - Determine what state this slice will manage (e.g., list of items, loading status, error state)
    - Identify async operations (fetching data, creating items, updating items)

2. **Async Pattern**
    - Thunks (`createAsyncThunk`) are the only pattern; there is no RTK Query in this app
    - Realtime Database calls use `fetch` inside the thunk, Auth and Storage calls use the Firebase SDK
    - Follow `.github/instructions/store.instructions.md` → Data Fetching Strategy

3. **Slice File Creation** (`src/store/slices/{sliceName}Slice.js`)
    - Create the slice using `createSlice` from Redux Toolkit
    - Define the initial state (items, `status`, `error`)
    - Generate reducer functions for state updates
    - Export selectors (`select{Thing}`) from the slice file; components and thunks read state through them, not `localStorage`

4. **Async Logic Implementation**
    - Create thunks using `createAsyncThunk`, reading `token`/`userId` via the authentication selectors
    - Use the shared request helper if it exists (#396); otherwise copy the `loadMessages` shape in `messagesSlice.js`
    - Check `!response.ok` and throw `ERROR_MESSAGES.REQUEST_ERROR` or a user-facing message; reject with `rejectWithValue(error.message)`
    - Do NOT perform granular status code checks (e.g., 404, 500) unless specific UI behaviour depends on them
    - Add extra reducers for pending, fulfilled, and rejected states
    - If the slice holds private data, clear it on `logout.fulfilled` and `logout.rejected` and keep it out of redux-persist

5. **Constants**
    - Use centralised constants from `src/constants` for:
        - API endpoints (`API_DATABASE`)
        - Paths (`PATHS`)
        - Error messages (`API_ERROR_MESSAGE` technical, `ERROR_MESSAGES` user-facing)
    - Do not hardcode strings

6. **Export Actions & Reducer**
    - Export auto-generated actions from the slice (e.g., `actions.setTravellers`)
    - Export the default reducer
    - Export thunks and selectors for use in components

7. **Test File Setup** (`src/store/slices/{sliceName}Slice.test.js`)
    - Create a Vitest test file
    - Import the reducer, actions, and async logic
    - Write test cases for:
        - Initial state shape
        - Sync reducer actions
        - Thunk success and error paths
        - Error message handling
    - Use `src/testUtils` and `src/constants/test` for mocks and test data

8. **Store Configuration Update** (`src/store/store.js`)
    - Add the new slice's reducer to the store's `combineReducers` or rootReducer
    - If the slice should be persisted, update the `redux-persist` configuration
    - There is no store index; components import from the slice file directly

9. **Output**
    - Summarise the created slice structure
    - Link to `.github/instructions/store.instructions.md` for ongoing conventions
    - Provide next steps: use the thunks in components, write integration tests, and verify persistence

## Notes

- Thunks are the only async pattern; do not introduce `createApi`
- Error handling must follow the `!response.ok` check pattern with generic `REQUEST_ERROR` or user-facing messages
- Slice tests must be created immediately when the slice is created
- Persist configuration must be updated if the slice's state should survive page reloads
- All generated files must end with a trailing newline at EOF to satisfy linting rules
- Linting and formatting must be checked for every generated or edited file; keep them ESLint-clean and Prettier-formatted before handoff.
