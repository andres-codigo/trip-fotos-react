import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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

const TEST_DATA = {
	ERROR_MESSAGE: 'Test error message',
	CLOSEABLE_ERROR: 'Closeable error',
	FALSY_VALUES: [null, undefined, '', false, 0],
}

const renderTravellersList = (props = {}) => {
	const defaultProps = {
		initialError: false,
	}

	return render(
		<TravellersList
			{...defaultProps}
			{...props}
		/>,
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
