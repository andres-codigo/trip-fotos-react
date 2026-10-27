import { vi } from 'vitest'

// Keeps the real Provider and friends; only the hooks become spies, with useDispatch returning a spy dispatch by default
export const createReactReduxMock = async () => {
	const actual = await vi.importActual('react-redux')

	return {
		...actual,
		useDispatch: vi.fn(() => vi.fn()),
		useSelector: vi.fn(),
	}
}
