import { configureStore } from '@reduxjs/toolkit'

import { middleware } from '@/store/middleware'

// configureStore with the app's middleware limits, so a busy test run does not fail on a timing warning the app never shows
const configureTestStore = (options) =>
	configureStore({ ...options, middleware })

export default configureTestStore
