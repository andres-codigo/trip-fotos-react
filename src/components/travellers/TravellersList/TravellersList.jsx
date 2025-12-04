import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { GLOBAL } from '@/constants/ui'
import { ERROR_MESSAGES } from '@/constants/errors'
import { PATHS } from '@/constants/ui'

import { selectIsAuthenticated } from '@/store/slices/authenticationSlice'

import {
	loadTravellers,
	selectTravellers,
	selectHasTravellers,
	selectIsTraveller,
} from '@/store/slices/travellersSlice'

import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import travellersListStyles from './TravellersList.module.scss'

const TravellersList = ({ initialError = false, isLoading = false }) => {
	const [error, setError] = useState(initialError)
	const [loading, setLoading] = useState(isLoading)
	const hasInitialisedRef = useRef(false)

	const dispatch = useDispatch()
	const isLoggedIn = useSelector(selectIsAuthenticated)

	const isTraveller = useSelector(selectIsTraveller)
	const hasTravellers = useSelector(selectHasTravellers)
	const travellers = useSelector(selectTravellers)

	const loadTravellersHandler = useCallback(
		async (refresh = false) => {
			try {
				setLoading(true)
				setError(null)

				const result = await dispatch(
					loadTravellers({ forceRefresh: refresh }),
				)

				if (loadTravellers.rejected.match(result)) {
					setError(
						result.payload || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
					)
				}
				setLoading(false)
			} catch (error) {
				setError(error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG)
				setLoading(false)
			}
		},
		[dispatch],
	)

	// Load travellers on mount if not already cached in Redux
	useEffect(() => {
		// Check travellers at time of mount, not reactive to changes
		const shouldLoad =
			!travellers ||
			(Array.isArray(travellers) && travellers.length === 0)

		if (shouldLoad && !hasInitialisedRef.current) {
			hasInitialisedRef.current = true
			loadTravellersHandler()
		}
		// Intentionally only run on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleError = () => setError(null)

	return (
		<section
			className={`pageSection ${travellersListStyles.travellerListContainer}`}
			data-cy="travellers-list-container">
			{error && (
				<BaseDialog
					show={true}
					isError={true}
					title={GLOBAL.ERROR_DIALOG_TITLE}
					onClose={handleError}
					data-cy="travellers-list-error-dialog">
					{error}
				</BaseDialog>
			)}
			<BaseCard>
				<div
					className={travellersListStyles.controls}
					data-cy="controls">
					<BaseButton
						mode={
							!hasTravellers && !loading
								? // 	||
									// (filteredTravellers &&
									// 	filteredTravellers.length === 0)
									'disabled'
								: 'outline'
						}
						disabled={!loading && !hasTravellers ? true : false}
						className={
							!hasTravellers && !loading
								? travellersListStyles.hide
								: ''
						}
						data-cy="refresh-button"
						onClick={() => loadTravellersHandler(true)}>
						Refresh
					</BaseButton>
					{isLoggedIn && !isTraveller && !loading && (
						<BaseButton
							isLink
							to={PATHS.REGISTER}
							data-cy="register-link">
							Register as a Traveller
						</BaseButton>
					)}
				</div>
				{loading && (
					<div className={travellersListStyles.spinnerContainer}>
						<BaseSpinner />
					</div>
				)}
				{!loading && hasTravellers && (
					<ul
						className={travellersListStyles.travellersList}
						data-cy="travellers-list">
						<li data-cy="traveller-item">Trip Item</li>
					</ul>
				)}
				{!loading && !hasTravellers && (
					<div className={travellersListStyles.noTravellersContainer}>
						<h3>No travellers listed.</h3>
					</div>
				)}
			</BaseCard>
		</section>
	)
}

TravellersList.propTypes = {
	initialError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
	isLoading: PropTypes.bool,
}

export default TravellersList
