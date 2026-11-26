import { useEffect, useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { THREAD_HEADER } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import ConversationAvatar from '@/components/messages/conversation-avatar/ConversationAvatar'
import BaseButton from '@/components/ui/button/BaseButton'
import { cn } from '@/utils/cn'

const iconProps = {
	'aria-hidden': true,
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	viewBox: '0 0 24 24',
}

const ROUND_BUTTON =
	'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 hover:bg-surface-sunken'

const MENU_ITEM =
	'flex min-h-11 w-full cursor-pointer items-center rounded-sm border-0 bg-transparent px-3 text-left font-sans text-[0.9375rem] no-underline hover:bg-surface-accent focus-visible:-outline-offset-3'

function ThreadHeader({
	name,
	status,
	otherId = null,
	subtitle,
	backTo,
	onDelete,
	headingRef,
	className,
}) {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef(null)
	const buttonRef = useRef(null)
	const menuId = useId()

	const isTraveller = status === SENDER_STATUS.TRAVELLER && Boolean(otherId)
	const cardPath = `${PATHS.TRAVELLERS}/${otherId}`

	useEffect(() => {
		if (!isOpen) return undefined

		const handleClickOutside = (event) => {
			if (!rootRef.current?.contains(event.target)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	}, [isOpen])

	const handleKeyDown = (event) => {
		if (isOpen && event.key === 'Escape') {
			event.stopPropagation()
			setIsOpen(false)
			buttonRef.current?.focus()
		}
	}

	const handleDelete = () => {
		setIsOpen(false)
		onDelete()
	}

	return (
		<header
			className={cn(
				'flex min-h-15 items-center gap-2.5 border-0 border-b border-solid border-border px-3 py-2',
				className,
			)}
			data-cy={THREAD_HEADER.ROOT}>
			<BaseButton
				isLink
				to={backTo}
				ariaLabel={MESSAGES_CONFIG.BACK_LABEL}
				className={cn(ROUND_BUTTON, 'text-text-link lg:hidden')}
				data-cy={THREAD_HEADER.BACK}>
				<svg
					{...iconProps}
					className="size-6">
					<path d="m15 18-6-6 6-6" />
				</svg>
			</BaseButton>
			<ConversationAvatar
				name={name}
				status={status}
				size="sm"
			/>
			{/* The heading takes focus when a read-only thread opens; its ring hugs the name and stays clear of the subtitle */}
			<div className="flex min-w-0 flex-1 flex-col items-start gap-1">
				<h2
					ref={headingRef}
					tabIndex={-1}
					className="m-0 max-w-full truncate rounded-sm text-[1.0625rem] leading-snug font-bold focus-visible:outline-offset-0"
					data-cy={THREAD_HEADER.NAME}>
					{isTraveller ? (
						<BaseButton
							isLink
							to={cardPath}
							className="inline text-text-link underline underline-offset-4"
							data-cy={THREAD_HEADER.NAME_LINK}>
							{name}
						</BaseButton>
					) : (
						name
					)}
				</h2>
				{subtitle && (
					<p
						className="m-0 max-w-full truncate text-[0.8125rem] text-text-muted"
						data-cy={THREAD_HEADER.SUBTITLE}>
						{subtitle}
					</p>
				)}
			</div>
			<div
				ref={rootRef}
				className="relative"
				onKeyDown={handleKeyDown}>
				<button
					ref={buttonRef}
					type="button"
					className={cn(ROUND_BUTTON, 'text-text-muted')}
					aria-label={MESSAGES_CONFIG.OPTIONS_LABEL}
					aria-expanded={isOpen}
					aria-controls={menuId}
					data-cy={THREAD_HEADER.MENU_BUTTON}
					onClick={() => setIsOpen((prev) => !prev)}>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-6">
						<circle
							cx="5"
							cy="12"
							r="2"
						/>
						<circle
							cx="12"
							cy="12"
							r="2"
						/>
						<circle
							cx="19"
							cy="12"
							r="2"
						/>
					</svg>
				</button>
				{isOpen && (
					<div
						id={menuId}
						className="absolute top-[calc(100%+0.25rem)] right-0 z-popover flex min-w-55 flex-col rounded-md border border-solid border-border-card bg-surface p-1.5 shadow-overlay"
						data-cy={THREAD_HEADER.MENU}>
						{isTraveller && (
							<BaseButton
								isLink
								to={cardPath}
								className={cn(MENU_ITEM, 'text-text')}
								data-cy={THREAD_HEADER.VIEW_CARD}>
								{MESSAGES_CONFIG.VIEW_CARD}
							</BaseButton>
						)}
						<button
							type="button"
							className={cn(MENU_ITEM, 'text-danger-text')}
							data-cy={THREAD_HEADER.DELETE}
							onClick={handleDelete}>
							{MESSAGES_CONFIG.DELETE_CONVERSATION}
						</button>
					</div>
				)}
			</div>
		</header>
	)
}

ThreadHeader.propTypes = {
	name: PropTypes.string.isRequired,
	status: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
	otherId: PropTypes.string,
	subtitle: PropTypes.string,
	backTo: PropTypes.string.isRequired,
	onDelete: PropTypes.func.isRequired,
	headingRef: PropTypes.oneOfType([
		PropTypes.func,
		PropTypes.shape({ current: PropTypes.any }),
	]),
	className: PropTypes.string,
}

export default ThreadHeader
