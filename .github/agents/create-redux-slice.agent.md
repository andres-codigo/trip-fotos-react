---
name: create-redux-slice
description: Use when creating a new Redux slice. Automates slice structure, reducer and thunk generation with proper error handling, test file setup, and store configuration updates.
---

# Redux Slice Scaffolding Workflow

Use this agent when you need to create a new Redux slice with reducers, async thunks, and corresponding tests.

## Workflow Steps

1. **Slice Details**
    - Get the slice name (e.g., `travellers`, `messages`)
    - Determine what state this slice will manage (e.g., list of items, loading status, error state)
    - Identify async operations (fetching data, creating items, updating items)

2. **Slice File Creation** (`src/store/slices/{sliceName}.js`)
    - Create the slice using `createSlice` from Redux Toolkit
    - Define the initial state (items, loading, error)
    - Generate reducer functions for state updates
    - Include proper TypeScript-like comments describing state shape

3. **Async Thunks**
    - For each async operation (fetch, create, update, delete):
        - Create a thunk using `createAsyncThunk`
        - Implement error handling: check `!response.ok` and throw `REQUEST_ERROR` or user-facing error
        - Do NOT perform granular status code checks (e.g., 404, 500) unless specific UI behaviour depends on them
    - Add extra reducers to handle thunk pending, fulfilled, and rejected states

4. **Constants**
    - Use centralized constants from `src/constants` for:
        - API endpoints (`API_DATABASE`)
        - Paths (`PATHS`)
        - Error messages (`API_ERROR_MESSAGE`, `ERROR_MESSAGES`)
    - Do not hardcode strings

5. **Export Actions & Reducer**
    - Export auto-generated actions from the slice (e.g., `actions.setTravellers`)
    - Export the default reducer
    - Export thunks for use in components

6. **Test File Setup** (`src/store/slices/{sliceName}.test.js`)
    - Create a Vitest test file
    - Import the reducer, actions, and thunks
    - Write test cases for:
        - Initial state shape
        - Sync reducer actions
        - Thunk pending, fulfilled, and rejected states
        - Error message handling
    - Use `src/testUtils` for mocking API calls

7. **Store Configuration Update** (`src/store/store.js`)
    - Add the new slice's reducer to the store's `combineReducers` or rootReducer
    - If the slice should be persisted, update the `redux-persist` configuration
    - Re-export the new actions and thunks from the store index if needed

8. **Output**
    - Summarise the created slice structure
    - Link to `.github/instructions/store.instructions.md` for ongoing conventions
    - Provide next steps: use the thunks in components, write integration tests, and verify persistence

## Notes

- Always use Redux Thunks for async logic—no middleware, sagas, or other patterns
- Error handling must follow the `!response.ok` check pattern with generic `REQUEST_ERROR` or user-facing messages
- Slice tests must be created immediately when the slice is created
- Persist configuration must be updated if the slice's state should survive page reloads
