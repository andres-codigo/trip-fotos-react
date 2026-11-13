import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { handleApiError } from '@/utils/errorHandler'
import { PATHS } from '@/constants/ui'
import {
	TRAVELLER_FILTER_CONFIG,
	TRAVELLERS_LIST_CONFIG,
} from '@/constants/travellers'

import { selectIsAuthenticated } from '@/store/slices/authenticationSlice'

import {
	loadPublicTrips,
	loadTravellers,
	selectPublicTrips,
	selectTravellers,
	selectIsTraveller,
	selectIsTravellerKnown,
	selectLastFetch,
} from '@/store/slices/travellersSlice'

import BaseButton from '@/components/ui/button/BaseButton'

import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'
import PublicTravellerItem from '@/components/travellers/public-traveller-item/PublicTravellerItem'
import TravellerItem from '@/components/travellers/traveller-item/TravellerItem'
import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'
import TravellersWelcome from '@/components/travellers/travellers-welcome/TravellersWelcome'

import useCityFilter from '@/components/travellers/travellers-list/hooks/useCityFilter'
import usePaging from '@/components/travellers/travellers-list/hooks/usePaging'

const SKELETON_KEYS = Array.from(
	{ length: TRAVELLERS_LIST_CONFIG.PAGE_SIZE },
	(_, index) => index,
)

const RefreshIcon = () => (
	<svg
		aria-hidden="true"
		width="22"
		height="22"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<path d="M21 12a9 9 0 1 1-3-6.7" />
		<path d="M21 4v5h-5" />
	</svg>
)

const TravellersList = ({ initialError = false, isLoading = false }) => {
	const isLoggedIn = useSelector(selectIsAuthenticated)
	// Logged-out visitors see the public summaries; the full records need sign-in
	const travellers = useSelector(
		isLoggedIn ? selectTravellers : selectPublicTrips,
	)
	const lastFetch = useSelector(selectLastFetch)
	const [error, setError] = useState(initialError)
	const [shouldLoadOnMount] = useState(
		() =>
			!travellers ||
			(Array.isArray(travellers) && travellers.length === 0) ||
			(isLoggedIn && !lastFetch),
	)
	// Start in the loading state when a mount load is due, so the first paint never shows an enabled Register link that the load then disables
	const [loading, setLoading] = useState(isLoading || shouldLoadOnMount)
	const [refreshCount, setRefreshCount] = useState(0)
	const hasInitialisedRef = useRef(false)
	const wasLoggedInRef = useRef(isLoggedIn)
	const listRef = useRef(null)

	const dispatch = useDispatch()

	const isTraveller = useSelector(selectIsTraveller)
	const isTravellerKnown = useSelector(selectIsTravellerKnown)
	const hasTravellers = travellers?.length > 0
	const {
		options,
		selectedIds,
		isFiltered,
		toggleCity,
		showAllCities,
		filteredTravellers,
	} = useCityFilter(travellers)
	const {
		visibleItems,
		visibleCount,
		total,
		nextCount,
		hasMore,
		showMore,
		firstNewIndex,
	} = usePaging(filteredTravellers, {
		pageSize: TRAVELLERS_LIST_CONFIG.PAGE_SIZE,
		resetKey: `${refreshCount}|${selectedIds.join('|')}`,
	})

	const loadTravellersHandler = useCallback(
		async (refresh = false, silent = false) => {
			try {
				if (!silent) {
					setLoading(true)
					setError(null)
				}

				const load = isLoggedIn ? loadTravellers : loadPublicTrips
				const result = await dispatch(load({ forceRefresh: refresh }))

				if (load.rejected.match(result)) {
					setError(handleApiError(result.payload))
				}
				if (!silent) {
					setLoading(false)
				}
			} catch (error) {
				setError(handleApiError(error))
				if (!silent) {
					setLoading(false)
				}
			}
		},
		[dispatch, isLoggedIn],
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

	// Logging out on this page swaps to the public list, which has to be fetched
	useEffect(() => {
		if (wasLoggedInRef.current === isLoggedIn) return
		wasLoggedInRef.current = isLoggedIn
		setRefreshCount((count) => count + 1)
		loadTravellersHandler(true)
	}, [isLoggedIn, loadTravellersHandler])

	// Keyboard and screen-reader users land on the first card that Show more added, not back at the button
	useEffect(() => {
		if (firstNewIndex === null) return
		const firstNew = listRef.current?.children[firstNewIndex]
		if (!firstNew) return
		firstNew.setAttribute('tabindex', '-1')
		firstNew.focus()
	}, [firstNewIndex])

	const refreshTravellers = () => {
		setRefreshCount((count) => count + 1)
		loadTravellersHandler(true)
	}

	const isPaged = total > TRAVELLERS_LIST_CONFIG.PAGE_SIZE
	const isPublicEmpty = !isLoggedIn && !loading && !error && !hasTravellers
	const Item = isLoggedIn ? TravellerItem : PublicTravellerItem

	return (
		<>
			{!isLoggedIn && <TravellersWelcome />}
			{/* Refresh and Register wrap together below the heading when the row is too narrow, so neither overflows the card */}
			<div
				className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1"
				data-cy="controls">
				<h1 className="my-0 grow">Travellers</h1>
				<div className="ml-auto flex items-center gap-2">
					{!isPublicEmpty && (
						<BaseButton
							modeType="flat"
							ariaLabel="Refresh travellers"
							className="size-11 p-0 disabled:cursor-default disabled:opacity-50"
							disabled={loading}
							data-cy="refresh-button"
							onClick={refreshTravellers}>
							<RefreshIcon />
						</BaseButton>
					)}
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
			</div>
			{!loading && error && (
				<div
					role="alert"
					className="my-4 flex flex-col items-start gap-3 rounded-lg border border-danger-text p-4"
					data-cy="travellers-load-error">
					<p className="m-0 font-bold text-danger-text">
						{TRAVELLERS_LIST_CONFIG.LOAD_ERROR_TITLE}
					</p>
					<p className="m-0">{error}</p>
					<BaseButton
						type="button"
						modeType="primary"
						onClick={refreshTravellers}
						data-cy="travellers-try-again">
						{TRAVELLERS_LIST_CONFIG.TRY_AGAIN}
					</BaseButton>
				</div>
			)}
			{loading && (
				<>
					<p
						role="status"
						className="my-2 text-text-muted"
						data-cy="travellers-loading">
						{TRAVELLERS_LIST_CONFIG.LOADING_LABEL}
					</p>
					<ul
						aria-busy="true"
						className="m-0 list-none p-0"
						data-cy="travellers-skeleton-list">
						{SKELETON_KEYS.map((key) => (
							<TravellerSkeleton
								key={key}
								isPublic={!isLoggedIn}
							/>
						))}
					</ul>
				</>
			)}
			{!loading && hasTravellers && options.length > 0 && (
				<TravellerFilter
					options={options}
					selectedIds={selectedIds}
					matchCount={filteredTravellers.length}
					onToggle={toggleCity}
					onShowAll={showAllCities}
				/>
			)}
			{!loading && hasTravellers && filteredTravellers.length > 0 && (
				<>
					<ul
						ref={listRef}
						className="m-0 list-none p-0"
						data-cy="travellers-list">
						{visibleItems.map((traveller) => (
							<Item
								key={traveller.id}
								{...traveller}
							/>
						))}
					</ul>
					{isPaged && (
						<div className="mt-4 flex flex-col items-center gap-2">
							{hasMore && (
								<BaseButton
									type="button"
									modeType="outline"
									className="w-full"
									onClick={showMore}
									data-cy="show-more-travellers">
									{TRAVELLERS_LIST_CONFIG.SHOW_MORE(
										nextCount,
									)}
								</BaseButton>
							)}
							<p
								aria-live="polite"
								className="m-0 text-sm text-text-muted"
								data-cy="travellers-page-status">
								{hasMore
									? TRAVELLERS_LIST_CONFIG.PAGE_STATUS(
											visibleCount,
											total,
											isFiltered,
										)
									: TRAVELLERS_LIST_CONFIG.ALL_SHOWN(
											total,
											isFiltered,
										)}
							</p>
						</div>
					)}
				</>
			)}
			{!loading && hasTravellers && filteredTravellers.length === 0 && (
				<div
					role="status"
					className="my-4 flex flex-col items-start gap-1 rounded-lg border border-border-card bg-surface p-5 shadow-card"
					data-cy="no-matching-travellers">
					<h2 className="m-0 text-lg font-bold">
						{TRAVELLER_FILTER_CONFIG.NO_RESULTS_TITLE}
					</h2>
					<p className="m-0 mb-3 text-text-muted">
						{TRAVELLER_FILTER_CONFIG.NO_RESULTS_TEXT}
					</p>
					<BaseButton
						type="button"
						modeType="outline"
						onClick={showAllCities}
						data-cy="travellers-show-all-cities">
						{TRAVELLER_FILTER_CONFIG.SHOW_ALL}
					</BaseButton>
				</div>
			)}
			{isPublicEmpty && (
				<div
					className="my-4 flex flex-col items-start gap-1 rounded-lg border border-border-card bg-surface p-5 shadow-card"
					data-cy="no-public-trips">
					<h2 className="m-0 text-lg font-bold">
						{TRAVELLERS_LIST_CONFIG.NO_PUBLIC_TRIPS_TITLE}
					</h2>
					<p className="m-0 text-text-muted">
						{TRAVELLERS_LIST_CONFIG.NO_PUBLIC_TRIPS_TEXT}
					</p>
				</div>
			)}
			{isLoggedIn && !loading && !error && !hasTravellers && (
				<div
					className="my-20 flex min-h-15 items-center justify-center"
					data-cy="no-travellers-list">
					<h2 className="my-[1em] text-center text-[1.17em]">
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
