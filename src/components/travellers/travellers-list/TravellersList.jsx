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
	selectIsTravellerKnown,
	selectLastFetch,
} from '@/store/slices/travellersSlice'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'
import TravellerItem from '@/components/travellers/traveller-item/TravellerItem'

import useCityFilter from '@/components/travellers/travellers-list/hooks/useCityFilter'

import travellersListStyles from './TravellersList.module.scss'

const TravellersList = ({ initialError = false, isLoading = false }) => {
	const travellers = useSelector(selectTravellers)
	const lastFetch = useSelector(selectLastFetch)
	const [error, setError] = useState(initialError)
	const [shouldLoadOnMount] = useState(
		() =>
			!travellers ||
			(Array.isArray(travellers) && travellers.length === 0) ||
			!lastFetch,
	)
	// Start in the loading state when a mount load is due, so the first paint never shows an enabled Register link that the load then disables
	const [loading, setLoading] = useState(isLoading || shouldLoadOnMount)
	const hasInitialisedRef = useRef(false)

	const dispatch = useDispatch()
	const isLoggedIn = useSelector(selectIsAuthenticated)

	const isTraveller = useSelector(selectIsTraveller)
	const isTravellerKnown = useSelector(selectIsTravellerKnown)
	const hasTravellers = useSelector(selectHasTravellers)
	const { options, inactiveIds, toggleCity, filteredTravellers } =
		useCityFilter(travellers)

	const loadTravellersHandler = useCallback(
		async (refresh = false, silent = false) => {
			try {
				if (!silent) {
					setLoading(true)
					setError(null)
				}

				const result = await dispatch(
					loadTravellers({ forceRefresh: refresh }),
				)

				if (loadTravellers.rejected.match(result)) {
					setError(
						result.payload || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
					)
				}
				if (!silent) {
					setLoading(false)
				}
			} catch (error) {
				setError(error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG)
				if (!silent) {
					setLoading(false)
				}
			}
		},
		[dispatch],
	)

	// lastFetch is cleared on rehydrate, so a list not yet fetched this page load is loaded behind the spinner; a fetched one is revalidated quietly
	useEffect(() => {
		if (!hasInitialisedRef.current) {
			hasInitialisedRef.current = true
			loadTravellersHandler(false, !shouldLoadOnMount)
		}
		// Intentionally only run on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleError = () => setError(null)

	return (
		<>
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
			<h1 className={travellersListStyles.heading}>Travellers</h1>
			<div
				className={travellersListStyles.controls}
				data-cy="controls">
				<BaseButton
					modeType="outline"
					disabled={loading}
					data-cy="refresh-button"
					onClick={() => loadTravellersHandler(true)}>
					Refresh
				</BaseButton>
				{isLoggedIn && isTravellerKnown && !isTraveller && (
					<BaseButton
						isLink
						to={PATHS.REGISTER}
						isDisabled={loading}
						modeType="primary"
						data-cy="register-link">
						Register
					</BaseButton>
				)}
			</div>
			{loading && (
				<div className={travellersListStyles.spinnerContainer}>
					<BaseSpinner />
				</div>
			)}
			{!loading && hasTravellers && options.length > 0 && (
				<TravellerFilter
					options={options}
					inactiveIds={inactiveIds}
					onChangeFilter={toggleCity}
				/>
			)}
			{!loading && hasTravellers && filteredTravellers.length > 0 && (
				<ul
					className={travellersListStyles.travellersList}
					data-cy="travellers-list">
					{filteredTravellers.map((traveller) => (
						<TravellerItem
							key={traveller.id}
							{...traveller}
						/>
					))}
				</ul>
			)}
			{!loading && hasTravellers && filteredTravellers.length === 0 && (
				<div
					className={travellersListStyles.noTravellersContainer}
					data-cy="no-matching-travellers">
					<h2 className={travellersListStyles.message}>
						No travellers match the selected cities.
					</h2>
				</div>
			)}
			{!loading && !hasTravellers && (
				<div
					className={travellersListStyles.noTravellersContainer}
					data-cy="no-travellers-list">
					<h2 className={travellersListStyles.message}>
						No travellers listed.
					</h2>
				</div>
			)}
		</>
	)
}

TravellersList.propTypes = {
	initialError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
	isLoading: PropTypes.bool,
}

export default TravellersList
