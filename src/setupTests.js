import { configure } from '@testing-library/react'

// See vite.config.js for the test environment setup
import '@testing-library/jest-dom' // For DOM assertions like `.toBeInTheDocument()`

configure({ testIdAttribute: 'data-cy' })
