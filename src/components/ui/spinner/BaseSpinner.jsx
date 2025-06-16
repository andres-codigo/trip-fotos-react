import baseSpinnerStyles from './BaseSpinner.module.scss'
import loadingSpinner from '@/assets/loading-spinner.svg'

const BaseSpinner = () => {
	return (
		<div
			className={baseSpinnerStyles.spinner}
			data-cy="base-spinner"
			role="status"
			aria-live="polite">
			<img
				src={loadingSpinner}
				alt="Loading, please wait..."
				data-cy="base-spinner-img"
			/>
		</div>
	)
}

export default BaseSpinner
