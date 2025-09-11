import { GLOBAL } from '@/constants/global'

import baseSpinnerStyles from './BaseSpinner.module.scss'
import loadingSpinner from '@/assets/loading-spinner.svg'

const BaseSpinner = () => {
	return (
		<div
			className={baseSpinnerStyles.spinner}
			data-cy="base-spinner"
			role="status"
			aria-live="polite"
			aria-busy="true">
			<img
				src={loadingSpinner}
				alt={GLOBAL.LOADING_SPINNER_ALT}
				data-cy="base-spinner-img"
			/>
		</div>
	)
}

export default BaseSpinner
