import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSelector } from 'react-redux'

import usePrimaryNavItems from '@/components/layout/main-nav/hooks/usePrimaryNavItems'
import { MOCK_USER } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { NAVIGATION, PATHS } from '@/constants/ui'

const mockUseLocation = vi.fn()

vi.mock('react-router-dom', () => ({
	useLocation: () => mockUseLocation(),
}))

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

const OWN_DETAIL_PATH = `${PATHS.TRAVELLERS}/${MOCK_USER.USER_ID}`
const OWN_EDIT_PATH = `${OWN_DETAIL_PATH}${TRAVELLER_ITEM_CONFIG.EDIT_PATH_SEGMENT}`
const OTHER_DETAIL_PATH = `${PATHS.TRAVELLERS}/another-user-id`

// Three messages, two unread
const mockMessages = [
	{ id: 1, read: false },
	{ id: 2, read: false },
	{ id: 3, read: true },
]

const mockState = (isTraveller) => ({
	authentication: { userId: MOCK_USER.USER_ID },
	travellers: { isTraveller },
	messages: { messages: mockMessages },
})

const setPathname = (pathname) => mockUseLocation.mockReturnValue({ pathname })

const setStoreIsTraveller = (isTraveller) =>
	vi
		.mocked(useSelector)
		.mockImplementation((selector) => selector(mockState(isTraveller)))

const activeKeys = (items) =>
	items.filter((item) => item.isActive).map((item) => item.key)

describe('usePrimaryNavItems', () => {
	beforeEach(() => {
		setPathname('/current-path')
		setStoreIsTraveller(true)
	})

	describe('Item sets', () => {
		it('should return travellers, messages and my trip for a traveller', () => {
			const { result } = renderHook(() => usePrimaryNavItems())

			expect(result.current).toEqual([
				{
					key: 'travellers',
					label: NAVIGATION.TRAVELLERS,
					to: PATHS.TRAVELLERS,
					isActive: false,
				},
				{
					key: 'messages',
					label: NAVIGATION.MESSAGES,
					to: PATHS.MESSAGES,
					isActive: false,
					unreadMessages: 2,
				},
				{
					key: 'my-trip',
					label: NAVIGATION.MY_TRIP,
					to: OWN_DETAIL_PATH,
					isActive: false,
				},
			])
		})

		it('should return travellers and register for a non-traveller', () => {
			setStoreIsTraveller(false)

			const { result } = renderHook(() => usePrimaryNavItems())

			expect(result.current).toEqual([
				{
					key: 'travellers',
					label: NAVIGATION.TRAVELLERS,
					to: PATHS.TRAVELLERS,
					isActive: false,
				},
				{
					key: 'register',
					label: NAVIGATION.REGISTER,
					to: PATHS.REGISTER,
					isActive: false,
				},
			])
		})

		it('should count only unread messages', () => {
			const { result } = renderHook(() => usePrimaryNavItems())

			const messagesItem = result.current.find(
				(item) => item.key === 'messages',
			)

			expect(messagesItem.unreadMessages).toBe(2)
		})

		it('should report zero unread messages when all are read', () => {
			vi.mocked(useSelector).mockImplementation((selector) =>
				selector({
					...mockState(true),
					messages: { messages: [{ id: 1, read: true }] },
				}),
			)

			const { result } = renderHook(() => usePrimaryNavItems())

			const messagesItem = result.current.find(
				(item) => item.key === 'messages',
			)

			expect(messagesItem.unreadMessages).toBe(0)
		})
	})

	describe('isTraveller override', () => {
		it('should use the traveller items when true overrides a non-traveller store', () => {
			setStoreIsTraveller(false)

			const { result } = renderHook(() =>
				usePrimaryNavItems({ isTraveller: true }),
			)

			expect(result.current.map((item) => item.key)).toEqual([
				'travellers',
				'messages',
				'my-trip',
			])
		})

		it('should use the non-traveller items when false overrides a traveller store', () => {
			const { result } = renderHook(() =>
				usePrimaryNavItems({ isTraveller: false }),
			)

			expect(result.current.map((item) => item.key)).toEqual([
				'travellers',
				'register',
			])
		})
	})

	describe('Active item', () => {
		it.each([
			['travellers list', PATHS.TRAVELLERS, ['travellers']],
			['home', PATHS.HOME, ['travellers']],
			['messages', PATHS.MESSAGES, ['messages']],
			['own detail page', OWN_DETAIL_PATH, ['my-trip']],
			['own edit page', OWN_EDIT_PATH, ['my-trip']],
			["someone else's detail page", OTHER_DETAIL_PATH, []],
		])('should mark %s active for a traveller', (_, pathname, expected) => {
			setPathname(pathname)

			const { result } = renderHook(() => usePrimaryNavItems())

			expect(activeKeys(result.current)).toEqual(expected)
		})

		it.each([
			['travellers list', PATHS.TRAVELLERS, ['travellers']],
			['home', PATHS.HOME, ['travellers']],
			['register', PATHS.REGISTER, ['register']],
			["someone else's detail page", OTHER_DETAIL_PATH, []],
		])(
			'should mark %s active for a non-traveller',
			(_, pathname, expected) => {
				setStoreIsTraveller(false)
				setPathname(pathname)

				const { result } = renderHook(() => usePrimaryNavItems())

				expect(activeKeys(result.current)).toEqual(expected)
			},
		)
	})

	describe('Memoisation', () => {
		it('should return the same array when nothing changes', () => {
			const { result, rerender } = renderHook(() => usePrimaryNavItems())

			const firstItems = result.current
			rerender()

			expect(result.current).toBe(firstItems)
		})

		it('should return a new array when the pathname changes', () => {
			const { result, rerender } = renderHook(() => usePrimaryNavItems())

			const firstItems = result.current
			setPathname(PATHS.MESSAGES)
			rerender()

			expect(result.current).not.toBe(firstItems)
			expect(activeKeys(result.current)).toEqual(['messages'])
		})
	})
})
