# GitHub Copilot Instructions for trip-fotos-react

## Project Context

- **Stack**: React 19, Redux Toolkit, Firebase, React Router 7, Vite.
- **Styling**: SCSS Modules (`*.module.scss`) and global SCSS (`src/styles`).
- **Testing**: Cypress (E2E & Component), Vitest (Unit/Integration).
- **State Management**: Redux Toolkit with `redux-persist`.

## Architecture & Patterns

- **Entry Point**: `src/app/App.jsx` handles routing, auth checks, and global layout.
- **Routing**: Lazy-loaded routes defined in `App.jsx`. Protected routes redirect to `PATHS.AUTHENTICATION`.
- **State**:
    - Slices located in `src/store/slices`.
    - Async logic should use Redux Thunks.
    - Persisted state configuration in `src/store/store.js`.
- **Components**:
    - Located in `src/components`, categorized by type (`common`, `forms`, `layout`, `ui`, `travellers`).
    - **Folder Structure**: Each component must reside in its own contextual folder (e.g., `src/components/forms/user-auth/UserAuthForm.jsx`).
        - If adding to a folder with flat components, refactor existing components into their own folders first.
        - Each component folder must contain a `__tests__` directory.
        - If a component has specific hooks, place them in a `hooks` subfolder within the component's folder (e.g., `src/components/forms/user-auth/hooks/useUserAuth.js`).
    - Use functional components with hooks.
    - Use default exports.
    - **Reusability**: When creating or recreating components, check `src/components/ui` or `src/components/common` for existing reusable components (e.g., `Input`, `Button`) and use them. If a reusable pattern emerges, create a new reusable component in the appropriate folder.
- **Services**: Firebase initialization in `src/services/firebase`.
- **Constants**:
    - **Strictly** use centralized constants from `src/constants` (e.g., `PATHS`, `API_DATABASE`).
    - Do not hardcode strings for paths, API URLs, or error messages.
- **Utils**:
    - **Validation**: Use `src/utils/validation` for common checks (email, password).
    - **Error Handling**: Use `src/utils/errorHandler` for API error extraction.

## Development Workflow

- **Start Server**: `npm run dev` (Vite).
- **Lint & Format**: `npm run lint:fix` (ESLint + Prettier).
- **Dependency Check**: `npm run check:dependencies`.
- **Documentation**: Whenever new folders/files are added, or new patterns are introduced, reference the `README.md` file and update it if applicable (e.g., updating the Folder Structure section).

## Testing Strategy

- **Creation Rule**: When creating a new component or page, always create the corresponding test files:
    - **Local Tests** (in `__tests__` directory):
        - Cypress component test (`*.cy.jsx`) for UI/interaction.
        - Vitest unit test (`*.test.js`) for logic/hooks.
    - **E2E Tests** (in `cypress/e2e`):
        - For Pages: Create `[PageName].page.cy.js` in `cypress/e2e/pages`.
        - For Components: Create `[ComponentName].component.cy.js` in `cypress/e2e/components`.
- **State Management Tests**: When modifying Redux slices (`src/store/slices`) or the store configuration (`src/store/store.js`), immediately update or create the corresponding Vitest test file (`*.test.js`) to reflect changes in reducers, actions, thunks, or store setup.
- **Component Tests**: Use Cypress (`*.cy.jsx`). Located alongside components.
    - Run: `npm run cy:run:auto {path/to/component}`.
- **E2E Tests**: Use Cypress (`cypress/e2e`).
    - Run: `npm run cy:open:e2e` or `npm run cy:run:e2e`.
    - **Constants**: Strictly use `cypress/support/constants` for selectors, URLs, and test data in E2E tests.
- **Unit/Integration**: Use Vitest (`*.test.js`).
    - Run: `npm run vitest:run` or `npm run vitest:watch`.
- **Mocking**: Use `src/testUtils` and `src/constants/test` for mocks and selectors.

## Coding Conventions

- **Imports**: Use `@` alias for `src` (e.g., `import { ... } from '@/components/...'`).
- **Naming**:
    - Components: PascalCase (`UserAuthForm.jsx`). Use descriptive suffixes (e.g., `Form`, `List`, `Card`) to avoid conflicts with page names or other components.
    - Hooks/Utils: camelCase (`useViewport.js`).
    - Constants: UPPER_SNAKE_CASE.
- **Type Safety**: Use `prop-types` for all component props.
- **Styling**:
    - Use SCSS modules for component-specific styles. Import as `styles` (e.g., `import styles from './Component.module.scss'`).
    - **Variables & Mixins**: When creating a new SCSS file, always review `src/styles` for available variables and mixins to ensure consistency.

## Key Files

- `vite.config.js`: Build and test configuration.
- `cypress.config.js`: Cypress setup and environment variables.
- `src/constants/index.js`: Root for application constants.
