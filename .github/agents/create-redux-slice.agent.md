---
name: create-redux-slice
description: Use when creating a new Redux slice. Automates slice structure, reducer and thunk/RTK Query generation with proper error handling, test file setup, and store configuration updates.
---

# Redux Slice Scaffolding Workflow

Use this agent when you need to create a new Redux slice with reducers, async logic, and corresponding tests.

## Workflow Steps

1. **Slice Details**
    - Get the slice name (e.g., `travellers`, `messages`)
    - Determine what state this slice will manage (e.g., list of items, loading status, error state)
    - Identify async operations (fetching data, creating items, updating items)

2. **Choose Async Pattern**
    - **RTK Query**: default for all new server reads and most mutations
    - **Redux Thunk**: for orchestration side effects or when extending existing thunk-based flows
    - Apply incremental migration: move existing thunks only when those areas are already being changed

3. **Slice File Creation** (`src/store/slices/{sliceName}.js`)
    - Create the slice using `createSlice` from Redux Toolkit
    - Define the initial state (items, loading, error)
    - Generate reducer functions for state updates
    - Include proper TypeScript-like comments describing state shape

4. **Async Logic Implementation**
    - If using RTK Query:
        - Create an API file (e.g., `src/store/slices/{sliceName}Api.js`) with `createApi`
        - Add query and mutation endpoints
        - Export generated hooks for component usage
    - If using thunks:
        - Create thunks using `createAsyncThunk`
        - Implement error handling: check `!response.ok` and throw `REQUEST_ERROR` or user-facing error
        - Do NOT perform granular status code checks (e.g., 404, 500) unless specific UI behaviour depends on them
        - Add extra reducers for pending, fulfilled, and rejected states

5. **Constants**
    - Use centralised constants from `src/constants` for:
        - API endpoints (`API_DATABASE`)
        - Paths (`PATHS`)
        - Error messages (`API_ERROR_MESSAGE`, `ERROR_MESSAGES`)
    - Do not hardcode strings

6. **Export Actions & Reducer**
    - Export auto-generated actions from the slice (e.g., `actions.setTravellers`)
    - Export the default reducer
    - Export thunks or RTK Query hooks for use in components

7. **Test File Setup** (`src/store/slices/{sliceName}.test.js`)
    - Create a Vitest test file
    - Import the reducer, actions, and async logic
    - Write test cases for:
        - Initial state shape
        - Sync reducer actions
        - Thunk or RTK Query success and error paths
        - Error message handling
    - Use `src/testUtils` and `src/constants/test` for mocks and test data

8. **Store Configuration Update** (`src/store/store.js`)
    - Add the new slice's reducer to the store's `combineReducers` or rootReducer
    - If using RTK Query, register API reducer path and middleware
    - If the slice should be persisted, update the `redux-persist` configuration
    - Re-export the new actions and async interfaces from the store index if needed

9. **Output**
    - Summarise the created slice structure
    - Link to `.github/instructions/store.instructions.md` for ongoing conventions
    - Provide next steps: use the thunks in components, write integration tests, and verify persistence

## Notes

- Prefer RTK Query for all new server reads and most mutations
- Use thunks for orchestration and existing flows until touched
- Error handling must follow the `!response.ok` check pattern with generic `REQUEST_ERROR` or user-facing messages
- Slice tests must be created immediately when the slice is created
- Persist configuration must be updated if the slice's state should survive page reloads
- All generated files must end with a trailing newline at EOF to satisfy linting rules
- Linting and formatting must be checked for every generated or edited file; keep them ESLint-clean and Prettier-formatted before handoff.
