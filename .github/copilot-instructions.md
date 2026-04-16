# GitHub Copilot Instructions for trip-fotos-react

## Language & Tone

- **Spelling**: Use British English (`en-GB`) for all comments, documentation, and strings (e.g., `colour`, `behaviour`, `optimise`).
- **Commit Messages**: Follow `en-GB` spelling conventions.

## Quick Architecture Reference

- **Entry Point**: `src/app/App.jsx` handles routing, auth checks, and global layout.
- **Routing**: Lazy-loaded routes defined in `App.jsx`. Protected routes redirect to `PATHS.AUTHENTICATION`.
- **Services**: Firebase initialisation in `src/services/firebase`.

## Coding Conventions

- **Imports**: Use `@` alias for `src` (e.g., `import { ... } from '@/components/...'`).
- **Naming**:
    - Components: PascalCase (e.g., `UserAuthenticationForm.jsx`).
    - Hooks/Utils: camelCase (e.g., `useViewport.js`).
    - Constants: UPPER_SNAKE_CASE.
- **Type Safety**: Use `prop-types` for all component props.
- **Constants**: Strictly use centralised constants from `src/constants`. Do not hardcode strings for paths, API URLs, or error messages.
- **Validation**: Use `src/utils/validation` for common checks (email, password).
- **Error Handling**: Use `src/utils/errorHandler` for API error extraction.

## Domain-Specific Guidance

For detailed guidance, refer to the following instruction files:

- **Components**: `.github/instructions/components.instructions.md` — Folder structure, reusability, testing, accessibility.
- **Pages**: `.github/instructions/pages.instructions.md` — Route-level composition, data loading orchestration, and page testing.
- **Redux Store**: `.github/instructions/store.instructions.md` — Slices, thunks, error handling, persistence, testing.
- **Styling**: `.github/instructions/styles.instructions.md` — SCSS modules, variables, mixins, naming conventions.

## Workflow Automation

Use the following agents for common tasks:

- **Create Component**: Use the `create-component` agent to scaffold new components with folder structure and tests.
- **Create Redux Slice**: Use the `create-redux-slice` agent to scaffold new Redux slices with thunks and tests.
