import { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { handleApiError } from '@/utils/errorHandler'
import { MESSAGE_ITEM } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { deleteMessage } from '@/store/slices/messagesSlice'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

const fieldClasses = 'mb-3'
const fieldHeadingClasses = 'my-1 text-base'
const fieldTextClasses = 'mb-1 mt-0 wrap-anywhere'

const MessageItem = ({ id, email, message }) => {
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState(null)

	const dispatch = useDispatch()

	const deleteHandler = async () => {
		setIsDeleting(true)
		const result = await dispatch(deleteMessage(id))

		// On success the slice removes this message, unmounting the item
		if (deleteMessage.rejected.match(result)) {
			setError(handleApiError(result.payload))
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
					className="my-2 list-none"
					data-cy={MESSAGE_ITEM.SPINNER}>
					<BaseSpinner />
				</li>
			) : (
				<li
					className="my-4 list-none rounded-lg border border-muted-foreground p-4 text-left"
					data-cy={MESSAGE_ITEM.ROOT}>
					<div className={fieldClasses}>
						<h3 className={fieldHeadingClasses}>Email</h3>
						<p className={fieldTextClasses}>
							<a
								className="font-bold text-primary no-underline hover:text-link-hover active:text-link-hover"
								href={`mailto:${email}`}
								data-cy={MESSAGE_ITEM.EMAIL}>
								{email}
							</a>
						</p>
					</div>
					<div className={fieldClasses}>
						<h3 className={fieldHeadingClasses}>Message</h3>
						<p
							className={fieldTextClasses}
							data-cy={MESSAGE_ITEM.TEXT}>
							{message}
						</p>
					</div>
					<div className="flex justify-end">
						<BaseButton
							type="button"
							modeType="danger"
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
