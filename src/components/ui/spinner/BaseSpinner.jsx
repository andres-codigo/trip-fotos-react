import baseSpinnerStyles from './BaseSpinner.module.scss'
import loadingSpinner from '@/assets/loading-spinner.svg'

const BaseSpinner = () => {
	return (
		<div
			className={baseSpinnerStyles.spinner}
			data-cy="base-spinner">
			<img
				src={loadingSpinner}
				alt="Loading..."
				data-cy="base-spinner-img"
			/>
		</div>
	)
}

export default BaseSpinner
