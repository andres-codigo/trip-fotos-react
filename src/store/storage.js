// redux-persist's own storage engine (redux-persist/lib/storage) is a CJS-only
// module whose default export gets mis-detected by Vite/esbuild's CJS-to-ESM
// interop, resolving to the raw module object instead of the storage adapter.
// This is a drop-in replacement matching the same Promise-based interface.
const storage = {
	getItem(key) {
		return Promise.resolve(window.localStorage.getItem(key))
	},
	setItem(key, value) {
		return Promise.resolve(window.localStorage.setItem(key, value))
	},
	removeItem(key) {
		return Promise.resolve(window.localStorage.removeItem(key))
	},
}

export default storage
