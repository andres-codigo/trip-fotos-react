import { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { ERROR_MESSAGES } from '@/constants/errors'
import { MESSAGE_ITEM } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { deleteMessage } from '@/store/slices/messagesSlice'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import messageItemStyles from './MessageItem.module.scss'

const MessageItem = ({ id, email, message }) => {
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState(null)

	const dispatch = useDispatch()

	const deleteHandler = async () => {
		setIsDeleting(true)
		const result = await dispatch(deleteMessage(id))

		// On success the slice removes this message, unmounting the item
		if (deleteMessage.rejected.match(result)) {
			setError(result.payload || ERROR_MESSAGES.SOMETHING_WENT_WRONG)
			setIsDeleting(false)
		}
	}

	return (
		<>
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={() => setError(null)}
					data-cy={MESSAGE_ITEM.ERROR_DIALOG}>
					{error}
				</BaseDialog>
			)}
			{isDeleting ? (
				<li
					className={messageItemStyles.spinnerContainer}
					data-cy={MESSAGE_ITEM.SPINNER}>
					<BaseSpinner />
				</li>
			) : (
				<li
					className={messageItemStyles.message}
					data-cy={MESSAGE_ITEM.ROOT}>
					<div className={messageItemStyles.field}>
						<h3>Email</h3>
						<p>
							<a
								href={`mailto:${email}`}
								data-cy={MESSAGE_ITEM.EMAIL}>
								{email}
							</a>
						</p>
					</div>
					<div className={messageItemStyles.field}>
						<h3>Message</h3>
						<p data-cy={MESSAGE_ITEM.TEXT}>{message}</p>
					</div>
					<div className={messageItemStyles.actions}>
						<BaseButton
							type="button"
							className={messageItemStyles.delete}
							onClick={deleteHandler}
							data-cy={MESSAGE_ITEM.DELETE}>
							Delete
						</BaseButton>
					</div>
				</li>
			)}
		</>
	)
}

MessageItem.propTypes = {
	id: PropTypes.string.isRequired,
	email: PropTypes.string.isRequired,
	message: PropTypes.string.isRequired,
}

export default MessageItem
