import PropTypes from 'prop-types'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import './LoadingFallback.module.scss'

const LoadingFallback = ({ isComponent }) => {
	return isComponent ? (
		<BaseCard className="loadingFallback">
			<BaseSpinner />
		</BaseCard>
	) : (
		<main
			className="mainContainer loadingFallback"
			data-cy="main-container">
			<BaseCard className="loadingFallback">
				<BaseSpinner />
			</BaseCard>
		</main>
	)
}

LoadingFallback.propTypes = {
	isComponent: PropTypes.bool.isRequired,
}

export default LoadingFallback
