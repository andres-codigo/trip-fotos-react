import PropTypes from 'prop-types'

import { YOU_TAG } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { cn } from '@/utils/cn'

// Marks the signed-in traveller's own record; plain text after the name, so screen readers hear "Amara Okafor You"
const YouTag = ({ className }) => (
	<span
		className={cn(
			'inline-flex shrink-0 items-center rounded-pill border border-accent-text bg-surface-accent px-2.5 py-0.5 text-xs leading-[1.2] font-medium text-accent-text',
			className,
		)}
		data-cy={YOU_TAG.ROOT}>
		{TRAVELLER_ITEM_CONFIG.YOU_LABEL}
	</span>
)

YouTag.propTypes = {
	className: PropTypes.string,
}

export default YouTag
