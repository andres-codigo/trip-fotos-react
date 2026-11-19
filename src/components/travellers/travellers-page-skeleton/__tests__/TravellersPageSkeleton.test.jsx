import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import configureTestStore from '@/testUtils/configureTestStore'

import TravellersPageSkeleton from '@/components/travellers/travellers-page-skeleton/TravellersPageSkeleton'
import {
	TRAVELLER_SKELETON,
	TRAVELLERS_PAGE_SKELETON,
	TRAVELLERS_WELCOME,
} from '@/constants/test'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'
import authenticationReducer from '@/store/slices/authenticationSlice'

const renderPage = (userId = null) => {
	const store = configureTestStore({
		reducer: { authentication: authenticationReducer },
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				userId,
			},
		},
	})
	return render(
		<Provider store={store}>
			<MemoryRouter>
				<TravellersPageSkeleton />
			</MemoryRouter>
		</Provider>,
	)
}

describe('TravellersPageSkeleton', () => {
	it('is the page landmark with the page heading', () => {
		renderPage()
		const root = screen.queryByTestId(TRAVELLERS_PAGE_SKELETON.ROOT)
		expect(root.tagName).toBe('MAIN')
		expect(
			screen.getByRole('heading', {
				level: 1,
				name: TRAVELLERS_LIST_CONFIG.TITLE,
			}),
		).toBeInTheDocument()
	})

	it('shows a visitor the welcome band and the public card shape', () => {
		renderPage()
		expect(
			screen.queryByTestId(TRAVELLERS_WELCOME.ROOT),
		).toBeInTheDocument()
		expect(
			screen.getAllByTestId(TRAVELLER_SKELETON.TEXT)[0].children,
		).toHaveLength(2)
	})

	it('shows a signed-in user no welcome band and the signed-in card shape', () => {
		renderPage('traveller-uid')
		expect(
			screen.queryByTestId(TRAVELLERS_WELCOME.ROOT),
		).not.toBeInTheDocument()
		expect(
			screen.getAllByTestId(TRAVELLER_SKELETON.TEXT)[0].children,
		).toHaveLength(5)
	})
})
