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
			{/* Always rendered, so the card keeps the five rows it shares with its neighbours; the clamp also needs a block parent, as a grid item it collapses to no height */}
			<div className={cn('mt-3.5', tripExcerpt && 'mb-3')}>
				{tripExcerpt && (
					<p
						className="m-0 line-clamp-2 italic"
						data-cy={PUBLIC_TRAVELLER_ITEM.EXCERPT}>
						{tripExcerpt}
					</p>
				)}
			</div>
			<div
				className="flex flex-wrap gap-2 self-start"
				data-cy={PUBLIC_TRAVELLER_ITEM.BADGES}>
				{(cities ?? []).map((city) => (
					<BaseBadge
						key={getCityId(city)}
						type={getCityId(city)}
						title={formatCity(city)}
					/>
				))}
			</div>
			<div className="pt-3.5">
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
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2 self-end">
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
