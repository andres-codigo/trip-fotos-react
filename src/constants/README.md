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
import { HEADER_SELECTORS } from '../../../src/constants/test/selectors/components'
import { IDENTITY_TOOLKIT_ERRORS } from '../../../src/constants/test/mock-data/mock-api'
```

## Directory Structure

```
src/constants/
├── api/
│   ├── index.js
│   ├── endpoints.js           # API_DATABASE, SDK_METHOD_TYPE_URLS, CITY_SEARCH (Photon)
│   ├── headers.js
│   └── messages.js
├── auth/
│   └── index.js               # FIREBASE_ERRORS (Auth SDK code → ERROR_MESSAGES text)
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
│   │   ├── mock-messages.js
│   │   ├── mock-travellers.js
│   │   └── mock-user.js
│   ├── selectors/
│   │   ├── _ids.js
│   │   ├── components.js
│   │   └── pages.js
│   ├── ui-constants.js
│   └── utilities/
│       └── selectors.js
├── travellers/
│   └── index.js               # TRAVELLER_REGISTRATION_FIELDS, TRAVELLER_REGISTRATION_CITIES
├── ui/
│   ├── index.js
│   ├── accessibility.js
│   ├── global.js
│   └── paths.js
└── validation/
    └── index.js               # VALIDATION_MESSAGES, FILE_UPLOAD (accepted types, size limit)
```
