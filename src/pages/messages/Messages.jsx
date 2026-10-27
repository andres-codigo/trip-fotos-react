import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { handleApiError } from '@/utils/errorHandler'
import { MESSAGES_PAGE } from '@/constants/test'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import {
	loadMessages,
	selectHasMessages,
	selectMessages,
} from '@/store/slices/messagesSlice'

import MessageItem from '@/components/messages/message-item/MessageItem'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import messagesStyles from './Messages.module.scss'

const Messages = () => {
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)

	const dispatch = useDispatch()
	const messages = useSelector(selectMessages)
	const hasMessages = useSelector(selectHasMessages)

	useEffect(() => {
		let isActive = true

		dispatch(loadMessages()).then((result) => {
			if (!isActive) return
			if (loadMessages.rejected.match(result)) {
				setError(handleApiError(result.payload))
			}
			setIsLoading(false)
		})

		return () => {
			isActive = false
		}
	}, [dispatch])

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={`mainContainer cardPage ${messagesStyles.messagesContainer}`}
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
					<h1>Messages</h1>
					{isLoading && (
						<div data-cy={MESSAGES_PAGE.SPINNER}>
							<BaseSpinner />
						</div>
					)}
					{!isLoading && hasMessages && (
						<ul
							className={messagesStyles.messages}
							data-cy={MESSAGES_PAGE.LIST}>
							{messages.map((item) => (
								<MessageItem
									key={item.id}
									id={item.id}
									email={item.userEmail}
									message={item.message}
								/>
							))}
						</ul>
					)}
					{!isLoading && !hasMessages && (
						<h2
							className={messagesStyles.noMessages}
							data-cy={MESSAGES_PAGE.EMPTY}>
							You don&apos;t have any messages yet!
						</h2>
					)}
				</BaseCard>
			</section>
		</main>
	)
}

export default Messages
