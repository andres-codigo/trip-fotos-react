import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { TAB_BAR } from '@/constants/test'
import { NAVIGATION, PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'
import messagesReducer from '@/store/slices/messagesSlice'

import TabBar from '@/components/layout/tab-bar/TabBar'

const USER_ID = 'traveller-uid'
const MY_TRIP_PATH = `${PATHS.TRAVELLERS}/${USER_ID}`

const createStore = ({
	token = 'token',
	isTraveller = true,
	messages = [],
} = {}) => {
	const store = configureTestStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
			messages: messagesReducer,
		},
	})
	const initial = store.getState()
	return configureTestStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
			messages: messagesReducer,
		},
		preloadedState: {
			authentication: {
				...initial.authentication,
				token,
				userId: USER_ID,
			},
			travellers: { ...initial.travellers, isTraveller },
			messages: { ...initial.messages, messages },
		},
	})
}

const renderTabBar = ({ path = PATHS.TRAVELLERS, props, ...state } = {}) =>
	render(
		<Provider store={createStore(state)}>
			<MemoryRouter initialEntries={[path]}>
				<TabBar {...props} />
			</MemoryRouter>
		</Provider>,
	)

const getNav = () =>
	screen.getByRole('navigation', { name: NAVIGATION.MAIN_LABEL })

describe('<TabBar />', () => {
	it('renders nothing when the user is not logged in', () => {
		const { container } = renderTabBar({ token: null })

		expect(container).toBeEmptyDOMElement()
	})

	it('shows Travellers, Messages and My trip for a traveller', () => {
		renderTabBar()

		const links = within(getNav()).getAllByRole('link')
		expect(links.map((link) => link.textContent)).toEqual([
			NAVIGATION.TRAVELLERS,
			NAVIGATION.MESSAGES,
			NAVIGATION.MY_TRIP,
		])
		expect(screen.getByTestId(TAB_BAR.TRAVELLERS)).toHaveAttribute(
			'href',
			PATHS.TRAVELLERS,
		)
		expect(screen.getByTestId(TAB_BAR.MESSAGES)).toHaveAttribute(
			'href',
			PATHS.MESSAGES,
		)
		expect(screen.getByTestId(TAB_BAR.MY_TRIP)).toHaveAttribute(
			'href',
			MY_TRIP_PATH,
		)
		expect(screen.queryByTestId(TAB_BAR.REGISTER)).not.toBeInTheDocument()
	})

	it('shows Travellers and Register for a user who is not a traveller', () => {
		renderTabBar({ isTraveller: false })

		const links = within(getNav()).getAllByRole('link')
		expect(links.map((link) => link.textContent)).toEqual([
			NAVIGATION.TRAVELLERS,
			NAVIGATION.REGISTER,
		])
		expect(screen.getByTestId(TAB_BAR.REGISTER)).toHaveAttribute(
			'href',
			PATHS.REGISTER,
		)
		expect(screen.queryByTestId(TAB_BAR.MESSAGES)).not.toBeInTheDocument()
		expect(screen.queryByTestId(TAB_BAR.MY_TRIP)).not.toBeInTheDocument()
	})

	it('lets the isTraveller prop override the store', () => {
		renderTabBar({ isTraveller: false, props: { isTraveller: true } })

		expect(screen.getByTestId(TAB_BAR.MY_TRIP)).toBeInTheDocument()
		expect(screen.queryByTestId(TAB_BAR.REGISTER)).not.toBeInTheDocument()
	})

	it.each([
		[PATHS.TRAVELLERS, TAB_BAR.TRAVELLERS],
		[PATHS.MESSAGES, TAB_BAR.MESSAGES],
		[MY_TRIP_PATH, TAB_BAR.MY_TRIP],
	])('marks only the current item on %s', (path, currentId) => {
		renderTabBar({ path })

		const current = within(getNav())
			.getAllByRole('link')
			.filter((link) => link.getAttribute('aria-current') === 'page')
		expect(current).toEqual([screen.getByTestId(currentId)])
		expect(screen.getByTestId(currentId)).toHaveAttribute(
			'aria-current',
			'page',
		)
	})

	it('shows the unread count and names it in the Messages link', () => {
		renderTabBar({
			messages: [
				{ id: 'm1', read: false },
				{ id: 'm2', read: false },
				{ id: 'm3', read: true },
			],
		})

		expect(screen.getByTestId(TAB_BAR.UNREAD)).toHaveTextContent('2')
		expect(
			screen.getByRole('link', { name: 'Messages, 2 unread messages' }),
		).toBe(screen.getByTestId(TAB_BAR.MESSAGES))
	})

	it('shows no count and a plain name when nothing is unread', () => {
		renderTabBar({ messages: [{ id: 'm1', read: true }] })

		expect(screen.queryByTestId(TAB_BAR.UNREAD)).not.toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Messages' })).toBe(
			screen.getByTestId(TAB_BAR.MESSAGES),
		)
	})
})
