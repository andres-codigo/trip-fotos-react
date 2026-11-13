import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useSearchParams } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { cn } from '@/utils/cn'
import { handleApiError } from '@/utils/errorHandler'
import useViewport from '@/utils/useViewport'
import { MESSAGE_ACTIONS, MESSAGE_ROW, MESSAGES_PAGE } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT, PATHS } from '@/constants/ui'

import {
	deleteMessage,
	loadMessages,
	markMessagesRead,
	selectMessages,
} from '@/store/slices/messagesSlice'

import MessageItem from '@/components/messages/message-item/MessageItem'
import MessagePane from '@/components/messages/message-pane/MessagePane'
import MessageRow from '@/components/messages/message-row/MessageRow'
import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'

import Alerts from '@/components/ui/alerts/Alerts'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import Toast from '@/components/ui/toast/Toast'

const HEADING = 'heading'
const PANE_HEADING = 'pane-heading'
const ITEM = 'item'
const PARAM = MESSAGES_CONFIG.MESSAGE_PARAM
const INBOX_LIST_CLASSES =
	'm-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border-card bg-surface p-0 shadow-card'

const without = (record, key) =>
	Object.fromEntries(Object.entries(record).filter(([id]) => id !== key))

const Messages = () => {
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const { width } = useViewport()
	const isWide = width >= GLOBAL.BREAKPOINT.TABLET

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)
	const [alertMessage, setAlertMessage] = useState(
		() => location.state?.alertMessage || null,
	)
	// Messages unread when the page opened keep their marker for the visit, though they are marked read at once
	const [newIds, setNewIds] = useState([])
	const [pendingId, setPendingId] = useState(null)
	const [failed, setFailed] = useState({})
	const [retrying, setRetrying] = useState({})

	const dispatch = useDispatch()
	const messages = useSelector(selectMessages)

	const listRef = useRef(null)
	const headingRef = useRef(null)
	const paneHeadingRef = useRef(null)
	const pendingRef = useRef(null)
	// A failed delete reopens its message in the inbox pane; null below 1024px and once the page has gone
	const reopenRef = useRef(null)
	// The message asked of the router (null for none) until the URL shows it
	const requestedRef = useRef(undefined)
	// Set by a delete, Undo or a chosen row, then moved to once the page has re-rendered
	const focusTargetRef = useRef(null)

	useEffect(() => {
		if (alertMessage) {
			window.history.replaceState({}, document.title)
		}
	}, [alertMessage])

	useEffect(() => {
		let isActive = true

		dispatch(loadMessages()).then((result) => {
			if (!isActive) return
			if (loadMessages.rejected.match(result)) {
				setError(handleApiError(result.payload))
			} else {
				const unread = result.payload
					.filter((message) => !message.read)
					.map((message) => message.id)
				setNewIds(unread)
				if (unread.length > 0) dispatch(markMessagesRead(unread))
			}
			setIsLoading(false)
		})

		return () => {
			isActive = false
		}
	}, [dispatch])

	const sendDelete = useCallback(
		(id) =>
			dispatch(deleteMessage(id)).then((result) => {
				if (deleteMessage.rejected.match(result)) {
					setFailed((prev) => ({
						...prev,
						[id]: ERROR_MESSAGES.FAILED_TO_DELETE_MESSAGE,
					}))
					reopenRef.current?.(id)
				}
			}),
		[dispatch],
	)

	const setPending = (id) => {
		pendingRef.current = id
		setPendingId(id)
	}

	// Leaving the page sends the waiting delete straight away
	useEffect(
		() => () => {
			if (pendingRef.current) sendDelete(pendingRef.current)
		},
		[sendDelete],
	)

	const visible = messages.filter((message) => message.id !== pendingId)

	const paramId = searchParams.get(PARAM)
	const isInbox = isWide && (isLoading || visible.length > 0)
	// A message just deleted from the pane hands over to its neighbour, the next older one where there is one
	const paramIndex = messages.findIndex((message) => message.id === paramId)
	const openMessage = isInbox
		? (visible.find((message) => message.id === paramId) ??
			(paramIndex === -1
				? undefined
				: (visible[paramIndex] ?? visible[paramIndex - 1])) ??
			visible.find((message) => newIds.includes(message.id)) ??
			visible[0])
		: undefined
	const openId = openMessage?.id ?? null

	// The router renders a navigation as a transition, so this page can still be on screen after the browser has moved on; replacing the entry then would pull the visitor back
	const openInPane = useCallback(
		(id) => {
			const currentKey = window.history.state?.key
			if (currentKey && currentKey !== location.key) return
			requestedRef.current = id ?? null
			setSearchParams(id ? { [PARAM]: id } : {}, { replace: true })
		},
		[location.key, setSearchParams],
	)

	// The message opened on load, or in place of a missing one, replaces the entry, so one Back still leaves the page
	useEffect(() => {
		// Until a message this page asked for reaches the URL, the stale param would open the wrong one
		if (requestedRef.current !== undefined) {
			if (requestedRef.current !== paramId) return
			requestedRef.current = undefined
		}
		if (!isInbox || isLoading || !openId || openId === paramId) return
		openInPane(openId)
	}, [isInbox, isLoading, openId, paramId, openInPane])

	useEffect(() => {
		reopenRef.current = isWide ? openInPane : null
		return () => {
			reopenRef.current = null
		}
	}, [isWide, openInPane])

	// The router applies a navigation in a later render, so a target waits until its message is open (or, for the heading, none is left)
	useEffect(() => {
		const target = focusTargetRef.current
		if (!target) return
		if (target.type === HEADING) {
			if (visible.length > 0) return
			headingRef.current?.focus()
		} else {
			if (isInbox && openId !== target.id) return
			if (target.type === PANE_HEADING) {
				paneHeadingRef.current?.focus()
			} else {
				const item = listRef.current?.querySelector(
					`[data-message-id="${target.id}"]`,
				)
				item?.querySelector(
					`[data-cy="${MESSAGE_ROW.LINK}"], [data-cy="${MESSAGE_ACTIONS.REPLY}"], [data-cy="${MESSAGE_ACTIONS.DELETE}"]`,
				)?.focus()
			}
		}
		focusTargetRef.current = null
	})

	const handleDelete = (id) => {
		if (pendingRef.current) sendDelete(pendingRef.current)

		const index = visible.findIndex((message) => message.id === id)
		const next = visible[index + 1] ?? visible[index - 1]

		setFailed((prev) => without(prev, id))
		focusTargetRef.current = next
			? { type: ITEM, id: next.id }
			: { type: HEADING }
		setPending(id)
		if (isWide) openInPane(next?.id)
	}

	const handleUndo = () => {
		const id = pendingRef.current
		focusTargetRef.current = { type: ITEM, id }
		setPending(null)
		if (isWide) openInPane(id)
	}

	const handleToastClose = () => {
		const id = pendingRef.current
		setPending(null)
		if (id) sendDelete(id)
	}

	const handleRetry = (id) => {
		setRetrying((prev) => ({ ...prev, [id]: true }))
		sendDelete(id).then(() => setRetrying((prev) => without(prev, id)))
	}

	const handleSelect = (id) => {
		focusTargetRef.current = { type: PANE_HEADING, id }
	}

	const unreadCount = visible.filter((message) =>
		newIds.includes(message.id),
	).length

	const alert = alertMessage && (
		<Alerts
			message={alertMessage}
			onClose={() => setAlertMessage(null)}
		/>
	)

	const heading = (
		<h1
			ref={headingRef}
			tabIndex={-1}
			className="mt-0 mb-1">
			{MESSAGES_CONFIG.TITLE}
		</h1>
	)

	// The inbox head sits 16px above its columns, as the design draws it
	const statusClasses = cn(
		'mt-1 text-sm text-text-muted',
		isInbox ? 'mb-4' : 'mb-3.5',
	)
	const status = isLoading ? (
		<p
			role="status"
			className={statusClasses}
			data-cy={MESSAGES_PAGE.LOADING}>
			{GLOBAL.SPINNER_LABEL.MESSAGES}
		</p>
	) : (
		<p
			role="status"
			className={statusClasses}
			data-cy={MESSAGES_PAGE.SUMMARY}>
			{MESSAGES_CONFIG.SUMMARY(unreadCount, visible.length)}
		</p>
	)

	const messageProps = (item) => ({
		id: item.id,
		senderId: item.senderId,
		senderName: item.senderName,
		senderStatus: item.senderStatus,
		userEmail: item.userEmail,
		message: item.message,
		createdAt: item.createdAt,
		isNew: newIds.includes(item.id),
	})

	const inbox = (
		<div
			className={PAGE_LAYOUT.WIDE}
			data-cy={MESSAGES_PAGE.INBOX}>
			{alert && <div className="mb-4">{alert}</div>}
			{heading}
			{status}
			<div className={PAGE_LAYOUT.COLUMNS}>
				{isLoading ? (
					<>
						<ul
							aria-busy="true"
							className={INBOX_LIST_CLASSES}>
							{Array.from(
								{
									length: MESSAGES_CONFIG.INBOX_SKELETON_COUNT,
								},
								(_, index) => (
									<MessageSkeleton
										key={index}
										variant="row"
									/>
								),
							)}
						</ul>
						<MessageSkeleton variant="pane" />
					</>
				) : (
					<>
						<ul
							ref={listRef}
							aria-label={MESSAGES_CONFIG.TITLE}
							className={INBOX_LIST_CLASSES}
							data-cy={MESSAGES_PAGE.INBOX_LIST}>
							{visible.map((item) => (
								<MessageRow
									key={item.id}
									{...messageProps(item)}
									isOpen={item.id === openId}
									onSelect={handleSelect}
								/>
							))}
						</ul>
						{openMessage && (
							<MessagePane
								key={openMessage.id}
								{...messageProps(openMessage)}
								headingRef={paneHeadingRef}
								deleteError={failed[openMessage.id] ?? null}
								isRetrying={Boolean(retrying[openMessage.id])}
								onDelete={handleDelete}
								onRetry={handleRetry}
							/>
						)}
					</>
				)}
			</div>
		</div>
	)

	const cards = (
		<section>
			<BaseCard>
				{alert}
				{heading}
				{isLoading && (
					<>
						{status}
						<ul
							aria-busy="true"
							className="m-0 flex list-none flex-col gap-3 p-0">
							{Array.from(
								{ length: MESSAGES_CONFIG.SKELETON_COUNT },
								(_, index) => (
									<MessageSkeleton key={index} />
								),
							)}
						</ul>
					</>
				)}
				{!isLoading && visible.length > 0 && (
					<>
						{status}
						<ul
							ref={listRef}
							className="m-0 flex list-none flex-col gap-3 p-0"
							data-cy={MESSAGES_PAGE.LIST}>
							{visible.map((item) => (
								<MessageItem
									key={item.id}
									{...messageProps(item)}
									deleteError={failed[item.id] ?? null}
									isRetrying={Boolean(retrying[item.id])}
									onDelete={handleDelete}
									onRetry={handleRetry}
								/>
							))}
						</ul>
					</>
				)}
				{!isLoading && visible.length === 0 && (
					<div
						className="px-1 pt-3 pb-1 text-center"
						data-cy={MESSAGES_PAGE.EMPTY}>
						<h2 className="mt-0 mb-1.5 text-xl font-bold">
							{MESSAGES_CONFIG.EMPTY_TITLE}
						</h2>
						<p className="mx-auto mt-0 mb-4 max-w-[30ch] text-text-muted">
							{MESSAGES_CONFIG.EMPTY_TEXT}
						</p>
						<BaseButton
							isLink
							modeType="outline"
							to={PATHS.TRAVELLERS}
							data-cy={MESSAGES_PAGE.BROWSE_TRAVELLERS}>
							{MESSAGES_CONFIG.BROWSE_TRAVELLERS}
						</BaseButton>
					</div>
				)}
			</BaseCard>
		</section>
	)

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={'mainContainer cardPage text-left'}
			data-cy="main-container"
			data-cy-alt="messages-main-container">
			<title>{`Messages · ${GLOBAL.SITE_NAME}`}</title>
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={() => setError(null)}
					data-cy={MESSAGES_PAGE.ERROR_DIALOG}>
					{error}
				</BaseDialog>
			)}
			{isInbox ? inbox : cards}
			{pendingId && (
				<Toast
					key={pendingId}
					message={MESSAGES_CONFIG.DELETED}
					actionLabel={MESSAGES_CONFIG.UNDO}
					onAction={handleUndo}
					onClose={handleToastClose}
					duration={MESSAGES_CONFIG.UNDO_DURATION_MS}
					data-cy={MESSAGES_PAGE.UNDO_TOAST}
				/>
			)}
		</main>
	)
}

export default Messages
