import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import configureTestStore from '@/testUtils/configureTestStore'

import TravellersPageSkeleton from '@/components/travellers/travellers-page-skeleton/TravellersPageSkeleton'
import { TRAVELLER_SKELETON, TRAVELLERS_PAGE_SKELETON } from '@/constants/test'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'
import authenticationReducer from '@/store/slices/authenticationSlice'

const renderPage = (token = null) => {
	const store = configureTestStore({
		reducer: { authentication: authenticationReducer },
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token,
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
		const { container } = renderPage()
		const root = container.querySelector(
			`[data-cy="${TRAVELLERS_PAGE_SKELETON.ROOT}"]`,
		)
		expect(root.tagName).toBe('MAIN')
		expect(
			screen.getByRole('heading', {
				level: 1,
				name: TRAVELLERS_LIST_CONFIG.TITLE,
			}),
		).toBeInTheDocument()
	})

	it('shows a visitor the welcome band and the public card shape', () => {
		const { container } = renderPage()
		expect(
			container.querySelector('[data-cy="travellers-welcome"]'),
		).toBeInTheDocument()
		expect(
			container.querySelector(`[data-cy="${TRAVELLER_SKELETON.TEXT}"]`)
				.children,
		).toHaveLength(2)
	})

	it('shows a signed-in user no welcome band and the signed-in card shape', () => {
		const { container } = renderPage('token')
		expect(
			container.querySelector('[data-cy="travellers-welcome"]'),
		).not.toBeInTheDocument()
		expect(
			container.querySelector(`[data-cy="${TRAVELLER_SKELETON.TEXT}"]`)
				.children,
		).toHaveLength(5)
	})
})
