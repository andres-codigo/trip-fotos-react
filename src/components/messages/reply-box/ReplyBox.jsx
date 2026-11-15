import {
	useId,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'
import PropTypes from 'prop-types'

import { REPLY_BOX } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import { cn } from '@/utils/cn'

const hasFinePointer = () =>
	window.matchMedia?.('(pointer: fine)').matches ?? false

function ReplyBox({ label, onSend, inputRef, className }) {
	const [text, setText] = useState('')
	const textareaRef = useRef(null)
	const inputId = useId()

	const trimmed = text.trim()
	const isEmpty = trimmed === ''

	useImperativeHandle(inputRef, () => textareaRef.current, [])

	useLayoutEffect(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		const style = getComputedStyle(textarea)
		const maxHeight =
			parseFloat(style.lineHeight) * MESSAGES_CONFIG.REPLY_MAX_LINES +
			parseFloat(style.paddingTop) +
			parseFloat(style.paddingBottom) +
			parseFloat(style.borderTopWidth) +
			parseFloat(style.borderBottomWidth)

		textarea.style.height = 'auto'
		const fullHeight =
			textarea.scrollHeight +
			parseFloat(style.borderTopWidth) +
			parseFloat(style.borderBottomWidth)
		textarea.style.height = `${Math.min(fullHeight, maxHeight)}px`
		textarea.style.overflowY = fullHeight > maxHeight ? 'auto' : 'hidden'
	}, [text])

	const send = () => {
		if (isEmpty) return
		onSend(trimmed)
		setText('')
	}

	const handleSubmit = (event) => {
		event.preventDefault()
		send()
	}

	// On touch screens Enter is the only way to add a line, so only a fine pointer sends with it
	const handleKeyDown = (event) => {
		if (
			event.key !== 'Enter' ||
			event.shiftKey ||
			event.nativeEvent.isComposing ||
			!hasFinePointer()
		) {
			return
		}
		event.preventDefault()
		send()
	}

	return (
		<form
			className={cn(
				'flex items-end gap-2 border-0 border-t border-solid border-border bg-bg px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
				className,
			)}
			data-cy={REPLY_BOX.ROOT}
			onSubmit={handleSubmit}>
			<label
				htmlFor={inputId}
				className="sr-only">
				{label}
			</label>
			<textarea
				ref={textareaRef}
				id={inputId}
				rows={1}
				value={text}
				maxLength={MESSAGES_CONFIG.MAX_LENGTH}
				placeholder={MESSAGES_CONFIG.REPLY_PLACEHOLDER}
				className="m-0 min-h-11 flex-1 resize-none rounded-[1.375rem] border border-solid border-border-strong bg-surface px-4 py-2.5 font-sans text-[0.9375rem] leading-[1.375rem] text-text placeholder:text-text-muted"
				data-cy={REPLY_BOX.INPUT}
				onChange={(event) => setText(event.target.value)}
				onKeyDown={handleKeyDown}
			/>
			<button
				type="submit"
				aria-label={MESSAGES_CONFIG.SEND}
				aria-disabled={isEmpty || undefined}
				className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-solid border-accent bg-accent p-0 text-on-accent not-aria-disabled:hover:border-accent-hover not-aria-disabled:hover:bg-accent-hover aria-disabled:cursor-default aria-disabled:border-border-strong aria-disabled:bg-surface-sunken aria-disabled:text-text-muted"
				data-cy={REPLY_BOX.SEND}>
				<svg
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
					viewBox="0 0 24 24"
					className="size-5">
					<path d="M12 19V5" />
					<path d="m5 12 7-7 7 7" />
				</svg>
			</button>
		</form>
	)
}

ReplyBox.propTypes = {
	label: PropTypes.string.isRequired,
	onSend: PropTypes.func.isRequired,
	inputRef: PropTypes.oneOfType([
		PropTypes.func,
		PropTypes.shape({ current: PropTypes.any }),
	]),
	className: PropTypes.string,
}

export default ReplyBox
