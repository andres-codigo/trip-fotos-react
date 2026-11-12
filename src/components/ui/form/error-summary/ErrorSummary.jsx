import { useEffect, useId, useRef } from 'react'
import PropTypes from 'prop-types'

import { ERROR_SUMMARY } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { cn } from '@/utils/cn'

const ErrorSummary = ({
	errors,
	focusKey = 0,
	title = GLOBAL.ERROR_SUMMARY_TITLE,
	className,
}) => {
	const headingId = useId()
	const summaryRef = useRef(null)
	const hasErrors = errors.length > 0

	// Keyed on focusKey, not errors, so the summary takes focus once per failed submit rather than on every edit
	useEffect(() => {
		if (focusKey > 0) summaryRef.current?.focus()
	}, [focusKey])

	if (!hasErrors) return null

	const handleLinkClick = (event, id) => {
		event.preventDefault()
		const field = document.getElementById(id)
		if (!field) return
		field.scrollIntoView?.({ block: 'center' })
		field.focus()
	}

	return (
		<div
			ref={summaryRef}
			tabIndex={-1}
			aria-labelledby={headingId}
			className={cn(
				'flex flex-col gap-2 rounded-md border-2 border-danger-text bg-surface p-4',
				className,
			)}
			data-cy={ERROR_SUMMARY.ROOT}>
			<h2
				id={headingId}
				className="m-0 text-[1.25rem] font-bold">
				{title}
			</h2>
			<ul className="m-0 flex list-none flex-col gap-1 p-0">
				{errors.map(({ id, message }) => (
					<li key={id}>
						<a
							href={`#${id}`}
							onClick={(event) => handleLinkClick(event, id)}
							className="font-medium text-danger-text underline underline-offset-4"
							data-cy={ERROR_SUMMARY.LINK}>
							{message}
						</a>
					</li>
				))}
			</ul>
		</div>
	)
}

ErrorSummary.propTypes = {
	errors: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			message: PropTypes.string.isRequired,
		}),
	).isRequired,
	focusKey: PropTypes.number,
	title: PropTypes.string,
	className: PropTypes.string,
}

export default ErrorSummary
