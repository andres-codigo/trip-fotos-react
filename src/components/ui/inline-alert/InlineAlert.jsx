import PropTypes from 'prop-types'

import { INLINE_ALERT } from '@/constants/test'

import { cn } from '@/utils/cn'

import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

const InlineAlert = ({
	children,
	className,
	'data-cy': dataCy = INLINE_ALERT.ID,
}) => (
	<ErrorMessage
		className={cn(
			'm-0 flex items-start gap-2 rounded-md border border-solid border-danger bg-danger-surface p-3',
			className,
		)}
		data-cy={dataCy}>
		<svg
			aria-hidden="true"
			focusable="false"
			className="mt-0.5 shrink-0 text-danger-text"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round">
			<circle
				cx="12"
				cy="12"
				r="10"
			/>
			<path d="M12 8v4" />
			<path d="M12 16h.01" />
		</svg>
		<span className="min-w-0 wrap-anywhere">{children}</span>
	</ErrorMessage>
)

InlineAlert.propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default InlineAlert
