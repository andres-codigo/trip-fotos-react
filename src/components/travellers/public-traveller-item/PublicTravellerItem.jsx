import PropTypes from 'prop-types'

import { PUBLIC_TRAVELLER_ITEM } from '@/constants/test'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { CARD_PHOTOS, GLOBAL, PATHS } from '@/constants/ui'

import { cn } from '@/utils/cn'
import { formatCity, getCityId } from '@/utils/formatCity'
import { publicName } from '@/utils/publicTrip'

import BaseBadge from '@/components/ui/badge/BaseBadge'
import BaseButton from '@/components/ui/button/BaseButton'
import BaseImage from '@/components/ui/image/BaseImage'
import TravellerCardHead from '@/components/travellers/traveller-card-head/TravellerCardHead'

const PublicTravellerItem = ({
	id,
	firstName,
	lastInitial,
	tripExcerpt,
	cities,
	tripStart,
	tripEnd,
	daysInCity,
	photos,
}) => {
	const name = publicName({ firstName, lastInitial })
	// The full trip needs sign-in, so the link goes through it and comes back
	const viewTripLink = `${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(
		`${PATHS.TRAVELLERS}/${id}`,
	)}`

	return (
		<li
			className="traveller-card"
			data-cy={PUBLIC_TRAVELLER_ITEM.ROOT}>
			<TravellerCardHead
				name={name}
				tripStart={tripStart}
				tripEnd={tripEnd}
				daysInCity={daysInCity}
				nameDataCy={PUBLIC_TRAVELLER_ITEM.NAME}
				tripDataCy={PUBLIC_TRAVELLER_ITEM.TRIP}
			/>
			{/* Only the opening of the description is public; the clamp ends it in an ellipsis */}
			{tripExcerpt && (
				<p
					className="mt-3.5 mb-3 line-clamp-2 italic"
					data-cy={PUBLIC_TRAVELLER_ITEM.EXCERPT}>
					{tripExcerpt}
				</p>
			)}
			{/* The same gaps as the signed-in card, whose badges sit under its description */}
			<div
				className={cn('flex flex-wrap gap-2', !tripExcerpt && 'mt-3.5')}
				data-cy={PUBLIC_TRAVELLER_ITEM.BADGES}>
				{(cities ?? []).map((city) => (
					<BaseBadge
						key={getCityId(city)}
						type={getCityId(city)}
						title={formatCity(city)}
					/>
				))}
			</div>
			{/* The photos and View trip sit at the foot, so they line up across a row of equal-height cards */}
			<div className="mt-auto flex flex-col pt-3.5">
				{photos?.length > 0 && (
					<ul
						className={CARD_PHOTOS.PUBLIC_LIST}
						data-cy={PUBLIC_TRAVELLER_ITEM.PHOTOS}>
						{photos.map((photo) => (
							<BaseImage
								key={photo.url}
								title={name}
								url={photo.url}
								dimensions={photo.dimensions ?? undefined}
								thumbnails={photo.thumbnails ?? undefined}
								sizes={GLOBAL.IMAGE_CARD_THUMBNAIL_SIZES}
								description={photo.alt ?? ''}
							/>
						))}
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
			</div>
		</li>
	)
}

PublicTravellerItem.propTypes = {
	id: PropTypes.string.isRequired,
	firstName: PropTypes.string,
	lastInitial: PropTypes.string,
	tripExcerpt: PropTypes.string,
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
	photos: PropTypes.arrayOf(
		PropTypes.shape({
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
	),
}

export default PublicTravellerItem
