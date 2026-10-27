// The shared Vitest setup replaces localStorage with inert mocks; theme tests need one that remembers.
export const createMemoryStorage = () => {
	const store = new Map()
	return {
		getItem: (key) => (store.has(key) ? store.get(key) : null),
		setItem: (key, value) => store.set(key, String(value)),
		removeItem: (key) => store.delete(key),
		clear: () => store.clear(),
	}
}
