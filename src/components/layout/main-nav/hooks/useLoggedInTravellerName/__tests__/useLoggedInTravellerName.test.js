import { createElement } from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Provider } from 'react-redux'
import configureTestStore from '@/testUtils/configureTestStore'

import travellersReducer, {
	setTravellerName,
} from '@/store/slices/travellersSlice'

import useLoggedInTravellerName from '@/components/layout/main-nav/hooks/useLoggedInTravellerName'

const renderWithName = (name) => {
	const store = configureTestStore({
		reducer: { travellers: travellersReducer },
	})
	if (name !== undefined) store.dispatch(setTravellerName(name))

	return renderHook(() => useLoggedInTravellerName(), {
		wrapper: ({ children }) => createElement(Provider, { store }, children),
	})
}

describe('useLoggedInTravellerName', () => {
	it('starts from the traveller name in the store', () => {
		const { result } = renderWithName('John Doe')

		expect(result.current[0]).toBe('John Doe')
	})

	it('starts empty when the store has no name', () => {
		const { result } = renderWithName()

		expect(result.current[0]).toBe('')
	})

	it('updates the name through its setter', () => {
		const { result } = renderWithName('John Doe')

		act(() => {
			result.current[1]('Jane Smith')
		})

		expect(result.current[0]).toBe('Jane Smith')
	})

	it('never reads the old localStorage name', () => {
		localStorage.setItem('userName', 'Stale Name')

		const { result } = renderWithName()

		expect(result.current[0]).toBe('')
		localStorage.clear()
	})
})
