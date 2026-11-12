import PropTypes from 'prop-types'

import { REQUIRED_LEGEND } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { requiredMarkClasses } from '@/components/ui/form/fieldClasses'
import { cn } from '@/utils/cn'

const RequiredLegend = ({ className }) => (
	<p
		className={cn('m-0 text-sm text-text-muted', className)}
		data-cy={REQUIRED_LEGEND.ROOT}>
		<span className={requiredMarkClasses}>*</span> {GLOBAL.REQUIRED_LEGEND}
	</p>
)

RequiredLegend.propTypes = {
	className: PropTypes.string,
}

export default RequiredLegend
