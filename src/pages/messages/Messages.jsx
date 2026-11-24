import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { MESSAGES_PAGE } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PAGE_LAYOUT, PATHS } from '@/constants/ui'

import {
	selectEmailVerified,
	selectUserId,
} from '@/store/slices/authenticationSlice'
import {
	deleteConversation,
	deleteLegacyMessage,
	dismissFailedMessage,
	loadConversations,
	loadThread,
	markConversationRead,
	selectConversations,
	selectIsConversationUnread,
	selectLegacyMessages,
	selectThread,
	selectUnreadConversationsCount,
	sendMessage,
} from '@/store/slices/messagesSlice'

import { cn } from '@/utils/cn'
import { otherMemberId } from '@/utils/conversationId'
import { handleApiError } from '@/utils/errorHandler'
import { senderLabel } from '@/utils/messageSender'
import useViewport from '@/utils/useViewport'

import ConversationList from '@/components/messages/conversation-list/ConversationList'
import ConversationSkeleton from '@/components/messages/conversation-skeleton/ConversationSkeleton'
import MessageThread from '@/components/messages/message-thread/MessageThread'
import ReplyBox from '@/components/messages/reply-box/ReplyBox'
import ThreadHeader from '@/components/messages/thread-header/ThreadHeader'
import ThreadNote from '@/components/messages/thread-note/ThreadNote'
import VerifyEmailNote from '@/components/forms/verify-email-note/VerifyEmailNote'

import Alerts from '@/components/ui/alerts/Alerts'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import Toast from '@/components/ui/toast/Toast'

const LEGACY_PREFIX = MESSAGES_CONFIG.LEGACY_ID_PREFIX
const isLegacyId = (id) => id?.startsWith(LEGACY_PREFIX) ?? false

const CARD = 'rounded-lg border border-border-card shadow-card'
const LIST_CARD = cn(CARD, 'overflow-hidden bg-surface')

const subtitleFor = ({ status, place }) => {
	if (status === SENDER_STATUS.TRAVELLER)
		return MESSAGES_CONFIG.TRAVELLER_SUBTITLE(place)
	if (status === SENDER_STATUS.FORMER) return MESSAGES_CONFIG.FORMER_SUBTITLE
	if (status === SENDER_STATUS.LEGACY) return MESSAGES_CONFIG.LEGACY_SUBTITLE
	return null
}

const Messages = () => {
	const { conversationId: openId = null } = useParams()
	const location = useLocation()
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const store = useStore()
	const { width } = useViewport()
	const isWide = width >= GLOBAL.BREAKPOINT.TABLET

	const userId = useSelector(selectUserId)
	const emailVerified = useSelector(selectEmailVerified)
	const conversations = useSelector(selectConversations)
	const legacyMessages = useSelector(selectLegacyMessages)
	const unreadCount = useSelector(selectUnreadConversationsCount)
	const thread = useSelector((state) =>
		openId && !isLegacyId(openId) ? selectThread(state, openId) : null,
	)

	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)
	const [alertMessage, setAlertMessage] = useState(
		() => location.state?.alertMessage || null,
	)
	const [pendingId, setPendingId] = useState(null)
	// Where unread messages started when each thread was first opened this visit, so "New" stays after they are marked read
	const [newSince, setNewSince] = useState({})

	const pendingRef = useRef(null)
	const headingRef = useRef(null)
	const threadHeadingRef = useRef(null)
	const replyRef = useRef(null)
	const listRef = useRef(null)
	// Set by an action, then moved to once the page has re-rendered with its target
	const focusTargetRef = useRef(null)

	useEffect(() => {
		if (alertMessage) {
			window.history.replaceState(window.history.state, document.title)
		}
	}, [alertMessage])

	useEffect(() => {
		let isActive = true

		dispatch(loadConversations()).then((result) => {
			if (!isActive) return
			if (loadConversations.rejected.match(result)) {
				setError(handleApiError(result.payload))
			}
			setIsLoading(false)
		})

		return () => {
			isActive = false
		}
	}, [dispatch])

	const rows = [
		...conversations.map((conversation) => ({
			id: conversation.id,
			to: `${PATHS.MESSAGES}/${conversation.id}`,
			name: senderLabel({
				senderStatus: conversation.otherStatus,
				senderName: conversation.otherName,
			}),
			status: conversation.otherStatus,
			place: conversation.otherPlace ?? null,
			otherId: conversation.otherId,
			lastMessage: conversation.lastMessage,
			lastAt: conversation.lastAt,
			isLastMine: conversation.lastSenderId === userId,
			isUnread:
				!conversation.readPending &&
				conversation.lastSenderId !== userId &&
				conversation.lastAt > (conversation.readAt ?? 0),
			readAt: conversation.readAt ?? 0,
		})),
		...legacyMessages.map((item) => ({
			id: `${LEGACY_PREFIX}${item.id}`,
			legacyId: item.id,
			to: `${PATHS.MESSAGES}/${LEGACY_PREFIX}${item.id}`,
			name: item.userEmail,
			status: SENDER_STATUS.LEGACY,
			place: null,
			otherId: null,
			userEmail: item.userEmail,
			lastMessage: item.message,
			lastAt: null,
			isLastMine: false,
			isUnread: false,
		})),
	]
	const visible = rows.filter(({ id }) => id !== pendingId)

	const isLegacyOpen = isLegacyId(openId)
	const openRow = rows.find(({ id }) => id === openId) ?? null
	const otherId =
		openId && !isLegacyOpen && userId ? otherMemberId(openId, userId) : null
	const isMember =
		!openId ||
		isLegacyOpen ||
		(Boolean(userId) && openId.split('_').includes(userId))

	// A thread opened from a traveller's card, with nothing said yet, is listed while it is open
	const draftRow =
		!isLoading &&
		openId &&
		!isLegacyOpen &&
		!openRow &&
		openId !== pendingId &&
		thread?.otherStatus
			? {
					id: openId,
					to: `${PATHS.MESSAGES}/${openId}`,
					name: senderLabel({
						senderStatus: thread.otherStatus,
						senderName: thread.otherName,
					}),
					status: thread.otherStatus,
					place: thread.otherPlace ?? null,
					otherId,
					lastMessage: MESSAGES_CONFIG.SAY_HELLO_PREVIEW,
					lastAt: null,
					isLastMine: false,
					isUnread: false,
				}
			: null
	const listed = draftRow ? [draftRow, ...visible] : visible

	// Marked read once the thread has loaded; where unread messages started is kept for the visit, so "New" stays
	useEffect(() => {
		if (isLoading || !openId || isLegacyOpen || !isMember) return
		let isActive = true
		dispatch(loadThread(openId)).then((result) => {
			if (!isActive || !loadThread.fulfilled.match(result)) return
			const state = store.getState()
			if (!selectIsConversationUnread(state, openId)) return
			const readAt =
				selectConversations(state).find(({ id }) => id === openId)
					?.readAt ?? 0
			setNewSince((prev) =>
				openId in prev ? prev : { ...prev, [openId]: readAt },
			)
			dispatch(markConversationRead(openId))
		})
		return () => {
			isActive = false
		}
	}, [dispatch, store, isLoading, openId, isLegacyOpen, isMember])

	// Replacing the entry keeps one Back leaving the page; the router can still be showing this page after the browser moved on, when replacing would pull the visitor back
	const openConversation = useCallback(
		(id, { replace = false } = {}) => {
			const currentKey = window.history.state?.key
			if (replace && currentKey && currentKey !== location.key) return
			navigate(id ? `${PATHS.MESSAGES}/${id}` : PATHS.MESSAGES, {
				replace,
			})
		},
		[location.key, navigate],
	)

	// From 1024px a conversation is always open beside the list
	const firstId = visible[0]?.id ?? null
	useEffect(() => {
		if (!isWide || isLoading || openId || !firstId) return
		openConversation(firstId, { replace: true })
	}, [isWide, isLoading, openId, firstId, openConversation])

	const sendDelete = useCallback(
		(id) => {
			const action = isLegacyId(id)
				? deleteLegacyMessage(id.slice(LEGACY_PREFIX.length))
				: deleteConversation(id)
			return dispatch(action).then((result) => {
				if (result.meta.requestStatus === 'rejected') {
					setAlertMessage(
						ERROR_MESSAGES.FAILED_TO_DELETE_CONVERSATION,
					)
				}
			})
		},
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
		const target = focusTargetRef.current
		if (!target) return
		if (target.type === 'reply') {
			if (openId !== target.id) return
			;(replyRef.current ?? threadHeadingRef.current)?.focus()
		} else if (target.type === 'heading') {
			if (openId) return
			headingRef.current?.focus()
		} else {
			const link = listRef.current?.querySelector(
				`[data-conversation-id="${target.id}"] a`,
			)
			if (!link) return
			link.focus()
		}
		focusTargetRef.current = null
	})

	const handleSelect = (id) => {
		focusTargetRef.current = { type: 'reply', id }
	}

	const handleDelete = () => {
		const id = openId
		if (pendingRef.current) sendDelete(pendingRef.current)

		const index = visible.findIndex((row) => row.id === id)
		const next = visible[index + 1] ?? visible[index - 1]

		setPending(id)
		if (isWide && next) {
			focusTargetRef.current = { type: 'reply', id: next.id }
			openConversation(next.id, { replace: true })
		} else {
			focusTargetRef.current = { type: 'heading' }
			openConversation(null, { replace: true })
		}
	}

	const handleUndo = () => {
		const id = pendingRef.current
		setPending(null)
		if (isWide) {
			focusTargetRef.current = { type: 'reply', id }
			openConversation(id, { replace: true })
		} else {
			focusTargetRef.current = { type: 'row', id }
		}
	}

	const handleToastClose = () => {
		const id = pendingRef.current
		setPending(null)
		if (id) sendDelete(id)
	}

	const handleSend = (message) => {
		dispatch(sendMessage({ otherId, message }))
	}

	const handleRetry = (id) => {
		const failed = thread?.messages.find((item) => item.id === id)
		if (!failed) return
		dispatch(dismissFailedMessage({ cid: openId, id }))
		dispatch(sendMessage({ otherId, message: failed.message }))
	}

	if (!isMember) {
		return (
			<Navigate
				to={PATHS.MESSAGES}
				replace
			/>
		)
	}

	if (!isLoading && isLegacyOpen && !openRow && openId !== pendingId) {
		return (
			<Navigate
				to={PATHS.MESSAGES}
				replace
			/>
		)
	}

	const isEmpty = !isLoading && listed.length === 0
	const showThread = Boolean(openId) && openId !== pendingId

	const heading = (
		<h1
			ref={headingRef}
			tabIndex={-1}
			className="mt-0 mb-1 text-title font-bold lg:text-display">
			{MESSAGES_CONFIG.TITLE}
		</h1>
	)

	const status = (
		<p
			role="status"
			className="mt-1 mb-3 text-sm text-text-muted lg:mb-4"
			data-cy={isLoading ? MESSAGES_PAGE.LOADING : MESSAGES_PAGE.SUMMARY}>
			{isLoading
				? GLOBAL.SPINNER_LABEL.MESSAGES
				: !isEmpty &&
					MESSAGES_CONFIG.SUMMARY(unreadCount, listed.length)}
		</p>
	)

	const empty = (
		<div
			className="px-3 py-7 text-center"
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
	)

	const listCard = (
		<div
			ref={listRef}
			className={cn(LIST_CARD, showThread && 'max-lg:hidden')}
			data-cy={MESSAGES_PAGE.LIST_CARD}>
			{isLoading && (
				<ConversationSkeleton
					variant="list"
					count={
						isWide
							? MESSAGES_CONFIG.DESKTOP_LIST_SKELETON_COUNT
							: MESSAGES_CONFIG.LIST_SKELETON_COUNT
					}
				/>
			)}
			{isEmpty && empty}
			{!isLoading && !isEmpty && (
				<ConversationList
					conversations={listed}
					openId={showThread ? openId : null}
					label={MESSAGES_CONFIG.TITLE}
					onSelect={handleSelect}
				/>
			)}
		</div>
	)

	const header = openRow ?? draftRow
	const threadName =
		header?.name ??
		(thread?.otherStatus
			? senderLabel({
					senderStatus: thread.otherStatus,
					senderName: thread.otherName,
				})
			: null)
	const threadStatus = header?.status ?? thread?.otherStatus ?? null
	const canReply =
		!isLegacyOpen &&
		threadStatus !== SENDER_STATUS.FORMER &&
		(threadStatus !== null || thread?.status === 'failed')
	const isThreadLoading =
		!isLegacyOpen &&
		(isLoading ||
			!thread ||
			(thread.status === 'loading' &&
				thread.status !== 'succeeded' &&
				thread.messages.length === 0))

	const legacyMessage =
		isLegacyOpen && openRow
			? [
					{
						id: openRow.legacyId,
						senderId: null,
						message: openRow.lastMessage,
						createdAt: null,
						status: 'sent',
					},
				]
			: null

	const threadCard = showThread && (
		<div
			role="region"
			aria-label={
				threadName
					? MESSAGES_CONFIG.THREAD_LABEL(threadName)
					: undefined
			}
			className={cn(
				'flex min-h-0 flex-col bg-bg',
				'max-lg:fixed max-lg:inset-x-0 max-lg:top-20 max-lg:bottom-0 max-lg:z-[1]',
				'lg:h-[calc(100dvh-15rem)] lg:min-h-[28rem] lg:overflow-hidden',
				CARD,
				'max-lg:rounded-none max-lg:border-0 max-lg:shadow-none',
			)}
			data-cy={MESSAGES_PAGE.THREAD_CARD}>
			{/* Below 1024px the thread fills the screen, so its content keeps the list's 640px column */}
			<div
				className="mx-auto flex min-h-0 w-full max-w-160 flex-1 flex-col lg:max-w-none"
				data-cy={MESSAGES_PAGE.THREAD_COLUMN}>
				{threadName ? (
					<ThreadHeader
						name={threadName}
						status={threadStatus}
						otherId={otherId}
						subtitle={subtitleFor({
							status: threadStatus,
							place: header?.place ?? thread?.otherPlace,
						})}
						backTo={PATHS.MESSAGES}
						onDelete={handleDelete}
						headingRef={threadHeadingRef}
					/>
				) : (
					<ConversationSkeleton variant="header" />
				)}
				{thread?.status === 'failed' && (
					<div
						role="alert"
						className="mx-3 mt-2 flex flex-wrap items-center gap-2.5 rounded-sm border border-danger bg-danger-surface px-3 py-2 text-sm"
						data-cy={MESSAGES_PAGE.THREAD_ERROR}>
						<span className="min-w-36 flex-1">
							{MESSAGES_CONFIG.THREAD_LOAD_ERROR}
						</span>
						<button
							type="button"
							className="min-h-11 cursor-pointer rounded-pill border-0 bg-transparent px-3 font-sans text-[0.9375rem] font-medium text-danger-text underline underline-offset-4"
							onClick={() => dispatch(loadThread(openId))}
							data-cy={MESSAGES_PAGE.THREAD_TRY_AGAIN}>
							{MESSAGES_CONFIG.TRY_AGAIN}
						</button>
					</div>
				)}
				<MessageThread
					key={`thread-${openId}`}
					messages={legacyMessage ?? thread?.messages ?? []}
					userId={userId}
					otherName={threadName ?? MESSAGES_CONFIG.UNKNOWN_TRAVELLER}
					newFromId={
						openId in newSince
							? (thread?.messages.find(
									(item) =>
										item.senderId !== userId &&
										item.createdAt > newSince[openId],
								)?.id ?? null)
							: null
					}
					isLoading={isThreadLoading}
					canSayHello={thread?.status !== 'failed'}
					onRetry={handleRetry}
					label={MESSAGES_CONFIG.TITLE}
					className="min-h-0 flex-1"
				/>
				{isLegacyOpen && openRow && (
					<ThreadNote
						status={SENDER_STATUS.LEGACY}
						email={openRow.userEmail}
						message={openRow.lastMessage}
					/>
				)}
				{threadStatus === SENDER_STATUS.FORMER && (
					<ThreadNote status={SENDER_STATUS.FORMER} />
				)}
				{canReply && !emailVerified && (
					<VerifyEmailNote variant="bar" />
				)}
				{canReply && emailVerified && (
					<ReplyBox
						key={`reply-${openId}`}
						label={MESSAGES_CONFIG.REPLY_LABEL(
							threadName ?? MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
						)}
						onSend={handleSend}
						inputRef={replyRef}
					/>
				)}
			</div>
		</div>
	)

	// No split until there is a conversation, as drawn
	const isSplit = !isEmpty

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage text-left"
			data-cy="main-container"
			data-cy-alt="messages-main-container">
			<title>{`${MESSAGES_CONFIG.TITLE} · ${GLOBAL.SITE_NAME}`}</title>
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
			<div className={PAGE_LAYOUT.WIDE}>
				{alertMessage && (
					<div className="mb-4">
						<Alerts
							message={alertMessage}
							onClose={() => setAlertMessage(null)}
						/>
					</div>
				)}
				<div className={cn(showThread && 'max-lg:sr-only')}>
					{heading}
					{status}
				</div>
				{isSplit ? (
					<div className={PAGE_LAYOUT.COLUMNS}>
						{listCard}
						{threadCard}
						{!showThread && isLoading && isWide && (
							<div
								aria-hidden="true"
								className={cn(
									CARD,
									'flex h-[calc(100dvh-15rem)] min-h-[28rem] flex-col overflow-hidden bg-bg',
								)}>
								<ConversationSkeleton variant="header" />
								<div className="mt-auto p-3">
									<ConversationSkeleton variant="thread" />
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="max-w-[32.5rem]">{listCard}</div>
				)}
			</div>
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
