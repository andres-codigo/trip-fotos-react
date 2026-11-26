import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import { ACCOUNT_MENU } from '@/constants/test'
import { NAVIGATION, PATHS } from '@/constants/ui'

import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/getInitials'

import VerifiedChip from '@/components/ui/verified-chip/VerifiedChip'

const iconProps = {
	'aria-hidden': true,
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	viewBox: '0 0 24 24',
}

const getWords = (name) => name.trim().split(/\s+/).filter(Boolean)

const itemClasses =
	'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sm border-0 bg-transparent px-3 text-left font-sans text-base text-text no-underline hover:bg-surface-accent hover:text-accent-text focus-visible:-outline-offset-3'

function AccountMenu({
	name,
	email = '',
	emailVerified = true,
	onLogOut,
	className,
}) {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef(null)
	const buttonRef = useRef(null)
	const panelId = useId()

	const hasName = name.trim() !== ''
	const initials = getInitials(name)
	const firstName = getWords(name)[0] ?? NAVIGATION.ACCOUNT_FALLBACK

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

	const handleLogOut = (event) => {
		setIsOpen(false)
		onLogOut(event)
	}

	return (
		<div
			ref={rootRef}
			className={cn('relative', className)}
			data-cy={ACCOUNT_MENU.ROOT}
			onKeyDown={handleKeyDown}>
			<button
				ref={buttonRef}
				type="button"
				className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-solid border-border-strong bg-transparent py-1 pr-3 pl-1 font-sans text-base text-on-header hover:text-on-header-hover focus-visible:-outline-offset-3 mobile:size-11 mobile:justify-center mobile:rounded-full mobile:border-0 mobile:p-0"
				aria-expanded={isOpen}
				aria-controls={panelId}
				aria-label={NAVIGATION.ACCOUNT_LABEL(name.trim())}
				data-cy={ACCOUNT_MENU.BUTTON}
				onClick={() => setIsOpen((prev) => !prev)}>
				{/* Initials are generated content: as text, axe flags them as visible words missing from the aria-label */}
				<span
					aria-hidden="true"
					data-initials={initials}
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-accent text-sm leading-none font-medium text-accent-text before:content-[attr(data-initials)]">
					{hasName ? null : (
						<svg
							{...iconProps}
							className="size-5">
							<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
							<circle
								cx="12"
								cy="7"
								r="4"
							/>
						</svg>
					)}
				</span>
				<span className="max-w-40 truncate mobile:hidden">
					{firstName}
				</span>
				<svg
					{...iconProps}
					className="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none mobile:hidden">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			{isOpen && (
				<div
					id={panelId}
					className="absolute top-[calc(100%+0.5rem)] right-0 z-popover flex w-64 flex-col gap-1 rounded-md border border-solid border-border-card bg-surface p-2 text-text shadow-overlay"
					data-cy={ACCOUNT_MENU.PANEL}>
					{(hasName || email) && (
						<div
							className="border-0 border-b border-solid border-border px-3 pt-1 pb-3"
							data-cy={ACCOUNT_MENU.SIGNED_IN_AS}>
							<p className="m-0 text-sm text-text-muted">
								{NAVIGATION.SIGNED_IN_AS}
							</p>
							{hasName && (
								<p className="m-0 font-medium break-words text-text">
									{name.trim()}
								</p>
							)}
							{email && (
								<p
									className="m-0 text-sm wrap-anywhere text-text-muted"
									data-cy={ACCOUNT_MENU.EMAIL}>
									{email}
								</p>
							)}
							{!emailVerified && (
								<VerifiedChip
									verified={false}
									className="mt-1.5"
								/>
							)}
						</div>
					)}
					<Link
						to={PATHS.ACCOUNT}
						className={itemClasses}
						data-cy={ACCOUNT_MENU.ACCOUNT_SETTINGS}
						onClick={() => setIsOpen(false)}>
						<svg
							{...iconProps}
							className="size-5 shrink-0">
							<circle
								cx="12"
								cy="12"
								r="3"
							/>
							<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
						</svg>
						{NAVIGATION.ACCOUNT_SETTINGS}
					</Link>
					<button
						type="button"
						className={itemClasses}
						data-cy={ACCOUNT_MENU.LOG_OUT}
						onClick={handleLogOut}>
						<svg
							{...iconProps}
							className="size-5 shrink-0">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<path d="m16 17 5-5-5-5" />
							<path d="M21 12H9" />
						</svg>
						{NAVIGATION.LOG_OUT}
					</button>
				</div>
			)}
		</div>
	)
}

AccountMenu.propTypes = {
	name: PropTypes.string.isRequired,
	email: PropTypes.string,
	emailVerified: PropTypes.bool,
	onLogOut: PropTypes.func.isRequired,
	className: PropTypes.string,
}

export default AccountMenu
