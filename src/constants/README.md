# Source Constants Directory

## Import Flexibility Options

### Option 1: Import everything from root

```javascript
import {
	API_ENDPOINTS,
	FIREBASE_ERRORS,
	VALIDATION_MESSAGES,
} from '../constants'
```

### Option 2: Import by category

```javascript
import * as api from '../constants/api'
import * as errors from '../constants/errors'
import * as test from '../constants/test'
```

### Option 3: Import specific files

```javascript
import { API_ENDPOINTS } from '../constants/api/endpoints'
import { MOCK_USER_DATA } from '../constants/test/mock-data/mock-user'
```

## Directory Structure

```
src/constants/
├── index.js                   # Root aggregator
├── api/
│   ├── index.js               # Re-exports endpoints.js, headers.js, etc.
│   ├── endpoints.js
│   ├── headers.js
│   ├── messages.js
│   └── firebase-errors.js
├── errors/
│   ├── index.js               # Re-exports messages.js, types.js
│   ├── messages.js
│   └── types.js
├── firebase/
│   ├── index.js               # Re-exports config.js
│   └── config.js
├── redux/
│   ├── index.js               # Re-exports action-types.js
│   └── action-types.js
├── test/
│   ├── index.js               # Re-exports all test-related constants
│   ├── mock-data/
│   │   ├── index.js           # Re-exports all mock data files
│   │   ├── mock-user.js
│   │   ├── mock-api.js
│   │   ├── mock-travellers.js
│   │   └── mock-common.js
│   ├── ui-constants/
│   │   ├── index.js           # Re-exports all UI constant files
│   │   ├── button.js
│   │   ├── dialog.js
│   │   ├── input.js
│   │   ├── spinner.js
│   │   └── ui-text.js
│   └── test-utilities/
│       ├── index.js           # Re-exports selectors.js
│       └── selectors.js
├── ui/
│   ├── index.js               # Re-exports accessibility.js, global.js, paths.js
│   ├── accessibility.js
│   ├── global.js
│   └── paths.js
└── validation/
    ├── index.js               # Re-exports messages.js
    └── messages.js
```

## Usage Examples

### Application Code

```javascript
// Component imports
import { UI_PATHS, ACCESSIBILITY_LABELS } from '../../constants'

// API service imports
import { API_ENDPOINTS, API_HEADERS } from '../../constants/api'
```

### Test Code

```javascript
// Test utilities
import { TEST_SELECTORS } from '../../constants/test/test-utilities'

// Mock data for tests
import {
	MOCK_USER_DATA,
	MOCK_API_RESPONSES,
} from '../../constants/test/mock-data'

// UI constants for testing
import { BUTTON_TEXT, DIALOG_CONFIG } from '../../constants/test/ui-constants'
```

### Redux Code

```javascript
// Action types
import { ACTION_TYPES } from '../../constants/redux'
```
