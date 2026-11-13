import PropTypes from 'prop-types'

import { PUBLIC_TRAVELLER_ITEM } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import { formatCity, getCityId } from '@/utils/formatCity'
import { publicName } from '@/utils/publicTrip'

import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseImage from '@/components/ui/image/BaseImage'
import TripSummary from '@/components/travellers/trip-summary/TripSummary'

const PublicTravellerItem = ({
	id,
	firstName,
	lastInitial,
	cities,
	tripStart,
	tripEnd,
	daysInCity,
	cover,
}) => {
	const name = publicName({ firstName, lastInitial })
	// The full trip needs sign-in, so the link goes through it and comes back
	const viewTripLink = `${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(
		`${PATHS.TRAVELLERS}/${id}`,
	)}`

	return (
		<li
			className="my-4 list-none rounded-lg border border-border-strong p-4"
			data-cy={PUBLIC_TRAVELLER_ITEM.ROOT}>
			<h3
				className="m-0 text-2xl leading-normal font-normal"
				data-cy={PUBLIC_TRAVELLER_ITEM.NAME}>
				{name}
			</h3>
			<TripSummary
				tripStart={tripStart}
				tripEnd={tripEnd}
				daysInCity={daysInCity}
				data-cy={PUBLIC_TRAVELLER_ITEM.TRIP}
			/>
			<div
				className="flex flex-wrap gap-2 pt-1 pb-4"
				data-cy={PUBLIC_TRAVELLER_ITEM.BADGES}>
				{(cities ?? []).map((city) => (
					<BaseBadge
						key={getCityId(city)}
						type={getCityId(city)}
						title={formatCity(city)}
					/>
				))}
			</div>
			{cover?.url && (
				<ul
					className="m-0 flex list-none flex-wrap gap-x-[2%] gap-y-8 py-4 pl-0 [@media(max-width:480px)]:mb-[0.9375rem] [@media(max-width:480px)]:gap-x-[4%] [@media(max-width:480px)]:gap-y-4 [@media(max-width:480px)]:py-2"
					data-cy={PUBLIC_TRAVELLER_ITEM.COVER}>
					<BaseImage
						title={name}
						url={cover.url}
						dimensions={cover.dimensions ?? undefined}
						thumbnails={cover.thumbnails ?? undefined}
						description={cover.alt ?? ''}
					/>
				</ul>
			)}
			<div className="flex flex-wrap items-center justify-end gap-2">
				<BaseButton
					isLink
					to={viewTripLink}
					modeType="outline"
					data-cy={PUBLIC_TRAVELLER_ITEM.VIEW_TRIP}>
					{TRAVELLER_ITEM_CONFIG.VIEW_LABEL}
				</BaseButton>
			</div>
		</li>
	)
}

PublicTravellerItem.propTypes = {
	id: PropTypes.string.isRequired,
	firstName: PropTypes.string,
	lastInitial: PropTypes.string,
	cities: PropTypes.arrayOf(
		PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				id: PropTypes.string,
				city: PropTypes.string,
				region: PropTypes.string,
				country: PropTypes.string,
			}),
		]),
	),
	tripStart: PropTypes.string,
	tripEnd: PropTypes.string,
	daysInCity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	cover: PropTypes.shape({
		url: PropTypes.string.isRequired,
		dimensions: PropTypes.shape({
			width: PropTypes.number,
			height: PropTypes.number,
		}),
		thumbnails: PropTypes.arrayOf(
			PropTypes.shape({
				width: PropTypes.number,
				url: PropTypes.string,
			}),
		),
		alt: PropTypes.string,
	}),
}

export default PublicTravellerItem
