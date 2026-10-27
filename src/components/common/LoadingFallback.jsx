import PropTypes from 'prop-types'

import { ACCESSIBILITY } from '@/constants/ui'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import './LoadingFallback.module.scss'

const LoadingFallback = ({ isComponent }) => {
	const card = (
		<BaseCard className="loadingFallback">
			<BaseSpinner />
		</BaseCard>
	)

	return isComponent ? (
		card
	) : (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer loadingFallback"
			data-cy="main-container">
			{card}
		</main>
	)
}

LoadingFallback.propTypes = {
	isComponent: PropTypes.bool.isRequired,
}

export default LoadingFallback
