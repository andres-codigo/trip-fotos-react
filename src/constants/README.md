# Source Constants Directory

## Import Convention

Always import from the subdirectory barrel (`index.js`), never from individual files within a subdirectory.

**src/ files** — use the `@/` alias:

```javascript
import { TRAVELLER_REGISTRATION_FIELDS } from '@/constants/travellers'
import { VALIDATION_MESSAGES } from '@/constants/validation'
import { API_ENDPOINTS } from '@/constants/api'
```

**Cypress files** — use relative paths (the `@/` alias is not available in Cypress):

```javascript
import { MOCK_USER_DATA } from '../../src/constants/test'
import { COMPONENT_SELECTORS } from '../../src/constants/test/selectors'
```

## Directory Structure

```
src/constants/
├── api/
│   ├── index.js
│   ├── endpoints.js
│   ├── headers.js
│   └── messages.js
├── auth/
│   └── index.js               # FIREBASE_ERRORS
├── config/
│   ├── index.js
│   ├── users.js
│   └── viewports.js
├── errors/
│   ├── index.js
│   └── messages.js
├── firebase/
│   └── index.js               # FIREBASE (env-based config)
├── redux/
│   └── index.js               # TRAVELLERS_ACTION_TYPES, AUTHENTICATION_ACTION_TYPES
├── test/
│   ├── index.js               # Re-exports all test constants
│   ├── mock-data/
│   │   ├── mock-api.js
│   │   ├── mock-common.js
│   │   ├── mock-travellers.js
│   │   └── mock-user.js
│   ├── selectors/
│   │   ├── index.js
│   │   ├── _ids.js
│   │   ├── components.js
│   │   └── pages.js
│   ├── ui-constants.js
│   └── utilities/
│       ├── index.js
│       └── selectors.js
├── travellers/
│   └── index.js               # TRAVELLER_REGISTRATION_FIELDS, TRAVELLER_REGISTRATION_CITIES
├── ui/
│   ├── index.js
│   ├── accessibility.js
│   ├── attributes.js
│   ├── global.js
│   └── paths.js
└── validation/
    └── index.js               # VALIDATION_MESSAGES
```
