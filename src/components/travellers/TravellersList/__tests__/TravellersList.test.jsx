import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { DIALOG } from '@/constants/test/dialog'
import { GLOBAL } from '@/constants/global'
import { MOCK_MESSAGES, MOCK_TEST_VALUES } from '@/constants/mock-data'

import TravellersList from '../TravellersList'

/**
 * TravellersList Unit Tests
 *
 * Mocks:
 * - BaseDialog: Mock component for error dialog testing with proper role and interaction handling
 * - BaseCard: Mock component for card container testing
 * - BaseButton: Mock component for button/link testing
 * - Redux Store: Mock store with authentication and travellers state
 * - Router: BrowserRouter for React Router context
 *
 * Test Coverage:
 * - Rendering: Component structure, conditional error dialog, prop handling
 * - Behaviour: Error dialog interactions, state management, prop updates
 * - Accessibility: ARIA attributes, semantic structure, dialog roles
 *
 * Test Strategy:
 * - Focuses on error state management and dialog interactions
 * - Tests conditional rendering logic based on initialError prop
 * - Verifies component structure and accessibility features
 * - Uses mocks for UI components to isolate logic testing
 */

// Mock UI components
vi.mock('@/components/ui/dialog/BaseDialog', () => ({
	__esModule: true,
	default: ({
		show,
		isError,
		title,
		onClose,
		children,
		'data-cy': dataCy,
		...props
	}) =>
		show ? (
			<div
				role={isError ? DIALOG.ROLE_ALERTDIALOG : DIALOG.ROLE_DIALOG}
				data-cy={dataCy}
				{...props}>
				<div>{title}</div>
				<div>{children}</div>
				<button onClick={onClose}>Close</button>
			</div>
		) : null,
}))

vi.mock('@/components/ui/card/BaseCard', () => ({
	__esModule: true,
	default: ({ children, ...props }) => (
		<div
			data-cy="base-card"
			{...props}>
			{children}
		</div>
	),
}))

vi.mock('@/components/ui/button/BaseButton', () => ({
	__esModule: true,
	default: ({ children, isLink, to, ...props }) =>
		isLink ? (
			<a
				href={to}
				{...props}>
				{children}
			</a>
		) : (
			<button {...props}>{children}</button>
		),
}))

// Create mock store
const createMockStore = (initialState = {}) => {
	return configureStore({
		reducer: {
			authentication: () => ({
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
				didAutoLogout: false,
				...initialState.authentication,
			}),
			travellers: () => ({
				travellerName: '',
				isTraveller: false,
				status: 'idle',
				error: null,
				...initialState.travellers,
			}),
		},
	})
}

const renderTravellersList = (props = {}, storeState = {}) => {
	const defaultProps = {
		initialError: false,
	}

	const store = createMockStore(storeState)

	return render(
		<BrowserRouter>
			<Provider store={store}>
				<TravellersList
					{...defaultProps}
					{...props}
				/>
			</Provider>
		</BrowserRouter>,
	)
}

describe('<TravellersList />', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('renders with default props and correct structure', () => {
			renderTravellersList()

			const mainSection = document.querySelector(
				'.pageSection.travellerListContainer',
			)
			expect(mainSection).toBeInTheDocument()
			expect(screen.getByTestId('base-card')).toBeInTheDocument()
		})

		it('does not render error dialog by default', () => {
			renderTravellersList()

			expect(
				screen.queryByRole(DIALOG.ROLE_ALERTDIALOG),
			).not.toBeInTheDocument()
		})

		it('renders error dialog when initialError is provided', () => {
			renderTravellersList({ initialError: MOCK_MESSAGES.TEST_ERROR })

			expect(
				screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
			).toBeInTheDocument()
			expect(
				screen.getByText(GLOBAL.ERROR_DIALOG_TITLE),
			).toBeInTheDocument()
			expect(
				screen.getByText(MOCK_MESSAGES.TEST_ERROR),
			).toBeInTheDocument()
		})

		it.each(MOCK_TEST_VALUES.FALSY_VALUES)(
			'does not render error dialog for falsy value: %s',
			(value) => {
				renderTravellersList({ initialError: value })

				expect(
					screen.queryByRole(DIALOG.ROLE_ALERTDIALOG),
				).not.toBeInTheDocument()
			},
		)

		it('renders Register as Traveller button when user is logged in but not a traveller', () => {
			renderTravellersList(
				{},
				{
					authentication: { token: 'mock-token' },
					travellers: { isTraveller: false },
				},
			)

			expect(
				screen.getByText('Register as a Traveller'),
			).toBeInTheDocument()
		})

		it('does not render Register as Traveller button when user is not logged in', () => {
			renderTravellersList(
				{},
				{
					authentication: { token: null },
					travellers: { isTraveller: false },
				},
			)

			expect(
				screen.queryByText('Register as a Traveller'),
			).not.toBeInTheDocument()
		})

		it('does not render Register as Traveller button when user is already a traveller', () => {
			renderTravellersList(
				{},
				{
					authentication: { token: 'mock-token' },
					travellers: { isTraveller: true },
				},
			)

			expect(
				screen.queryByText('Register as a Traveller'),
			).not.toBeInTheDocument()
		})

		it('does not render Register as Traveller button when isLoading is true', () => {
			renderTravellersList(
				{ isLoading: true },
				{
					authentication: { token: 'mock-token' },
					travellers: { isTraveller: false },
				},
			)

			expect(
				screen.queryByText('Register as a Traveller'),
			).not.toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		it('closes error dialog when close button is clicked', async () => {
			renderTravellersList({
				initialError: MOCK_MESSAGES.CLOSEABLE_ERROR,
			})

			expect(
				screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
			).toBeInTheDocument()

			fireEvent.click(screen.getByText('Close'))

			await waitFor(() => {
				expect(
					screen.queryByRole(DIALOG.ROLE_ALERTDIALOG),
				).not.toBeInTheDocument()
			})
		})
	})

	describe('Accessibility tests', () => {
		it('error dialog has proper ARIA attributes', () => {
			renderTravellersList({ initialError: MOCK_MESSAGES.TEST_ERROR })

			const dialog = screen.getByRole(DIALOG.ROLE_ALERTDIALOG)
			expect(dialog).toHaveAttribute('role', DIALOG.ROLE_ALERTDIALOG)
			expect(
				screen.getByText(GLOBAL.ERROR_DIALOG_TITLE),
			).toBeInTheDocument()
		})

		it('has proper semantic structure', () => {
			renderTravellersList()

			const mainSection = document.querySelector(
				'.pageSection.travellerListContainer',
			)
			expect(mainSection.tagName.toLowerCase()).toBe('section')
		})
	})
})
