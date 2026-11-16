import PropTypes from 'prop-types'

import { VERIFIED_CHIP_CONFIG } from '@/constants/auth'
import { VERIFIED_CHIP } from '@/constants/test'

import { cn } from '@/utils/cn'

const VerifiedChip = ({ verified, className }) => (
	<span
		className={cn(
			'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium',
			verified
				? 'border border-solid border-success text-success'
				: 'border border-dashed border-danger-text text-danger-text',
			className,
		)}
		data-cy={VERIFIED_CHIP.ROOT}>
		{verified && (
			<span
				aria-hidden="true"
				className="size-1.5 shrink-0 rounded-full bg-success"
			/>
		)}
		{verified
			? VERIFIED_CHIP_CONFIG.VERIFIED
			: VERIFIED_CHIP_CONFIG.NOT_VERIFIED}
	</span>
)

VerifiedChip.propTypes = {
	verified: PropTypes.bool.isRequired,
	className: PropTypes.string,
}

export default VerifiedChip
