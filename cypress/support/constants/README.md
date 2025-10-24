# Cypress Constants Directory

## Import Flexibility Options

### Option 1: Import everything from root

```javascript
import { pageSelectors, API_ENDPOINTS } from '../constants'
```

### Option 2: Import by category

```javascript
import * as selectors from '../constants/selectors'
import * as api from '../constants/api'
```

### Option 3: Import specific files

```javascript
import { pageSelectors } from '../constants/selectors/pages'
```

## Directory Structure

```
cypress/support/constants/
├── index.js                    # Root aggregator
├── api/
│   ├── index.js               # Re-exports endpoints.js, urls.js
│   ├── endpoints.js
│   └── urls.js
├── env/
│   ├── index.js               # Re-exports users.js, viewports.js
│   ├── users.js
│   └── viewports.js
├── selectors/
│   ├── index.js               # Re-exports pages.js, components.js, etc.
│   ├── components.js
│   ├── pages.js
│   └── test-utilities.js
└── ui/
    ├── index.js               # Re-exports pages.js, components.js, etc.
    ├── accessibility.js
    ├── dialog.js
    └── error-messages.js
```
