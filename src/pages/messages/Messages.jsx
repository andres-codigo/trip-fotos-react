import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler'
import { MESSAGE_ITEM, MESSAGES_PAGE } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import {
	deleteMessage,
	loadMessages,
	markMessagesRead,
	selectMessages,
} from '@/store/slices/messagesSlice'

import MessageItem from '@/components/messages/message-item/MessageItem'
import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'

import Alerts from '@/components/ui/alerts/Alerts'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import Toast from '@/components/ui/toast/Toast'

const HEADING = 'heading'

const without = (record, key) =>
	Object.fromEntries(Object.entries(record).filter(([id]) => id !== key))

const Messages = () => {
	const location = useLocation()
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
	const pendingRef = useRef(null)
	// Set by a delete or Undo, then moved to once the list has re-rendered
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

	useEffect(() => {
		const focusTarget = focusTargetRef.current
		if (!focusTarget) return
		focusTargetRef.current = null
		if (focusTarget === HEADING) {
			headingRef.current?.focus()
		} else {
			const item = listRef.current?.querySelector(
				`[data-message-id="${focusTarget}"]`,
			)
			item?.querySelector(
				`[data-cy="${MESSAGE_ITEM.REPLY}"], [data-cy="${MESSAGE_ITEM.DELETE}"]`,
			)?.focus()
		}
	})

	const visible = messages.filter((message) => message.id !== pendingId)

	const handleDelete = (id) => {
		if (pendingRef.current) sendDelete(pendingRef.current)

		const index = visible.findIndex((message) => message.id === id)
		const next = visible[index + 1] ?? visible[index - 1]

		setFailed((prev) => without(prev, id))
		focusTargetRef.current = next ? next.id : HEADING
		setPending(id)
	}

	const handleUndo = () => {
		const id = pendingRef.current
		focusTargetRef.current = id
		setPending(null)
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

	const unreadCount = visible.filter((message) =>
		newIds.includes(message.id),
	).length

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
			<section>
				<BaseCard>
					{alertMessage && (
						<Alerts
							message={alertMessage}
							onClose={() => setAlertMessage(null)}
						/>
					)}
					<h1
						ref={headingRef}
						tabIndex={-1}
						className="mt-0 mb-1">
						{MESSAGES_CONFIG.TITLE}
					</h1>
					{isLoading && (
						<>
							<p
								role="status"
								className="mt-1 mb-3.5 text-sm text-text-muted"
								data-cy={MESSAGES_PAGE.LOADING}>
								{GLOBAL.SPINNER_LABEL.MESSAGES}
							</p>
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
							<p
								role="status"
								className="mt-1 mb-3.5 text-sm text-text-muted"
								data-cy={MESSAGES_PAGE.SUMMARY}>
								{MESSAGES_CONFIG.SUMMARY(
									unreadCount,
									visible.length,
								)}
							</p>
							<ul
								ref={listRef}
								className="m-0 flex list-none flex-col gap-3 p-0"
								data-cy={MESSAGES_PAGE.LIST}>
								{visible.map((item) => (
									<MessageItem
										key={item.id}
										id={item.id}
										senderId={item.senderId}
										senderName={item.senderName}
										senderStatus={item.senderStatus}
										userEmail={item.userEmail}
										message={item.message}
										createdAt={item.createdAt}
										isNew={newIds.includes(item.id)}
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
