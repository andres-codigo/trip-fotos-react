import PropTypes from 'prop-types'

import { TRAVELLER_CARD_HEAD } from '@/constants/test'

import TripSummary from '@/components/travellers/trip-summary/TripSummary'
import YouTag from '@/components/travellers/you-tag/YouTag'
import InitialsAvatar from '@/components/ui/avatar/InitialsAvatar'

// Shared head of a Travellers grid card, signed-in and public; the "You" tag wraps under a long name rather than overflowing
const TravellerCardHead = ({
	name,
	isOwn = false,
	tripStart,
	tripEnd,
	daysInCity,
	nameDataCy,
	tripDataCy,
}) => (
	<div
		className="flex items-start gap-3"
		data-cy={TRAVELLER_CARD_HEAD.ROOT}>
		<InitialsAvatar name={name} />
		<div className="flex min-w-0 flex-col gap-1">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<h3
					className="m-0 text-[1.1875rem] leading-[1.2] font-bold break-words"
					data-cy={nameDataCy}>
					{name}
				</h3>
				{isOwn && <YouTag />}
			</div>
			<TripSummary
				tripStart={tripStart}
				tripEnd={tripEnd}
				daysInCity={daysInCity}
				data-cy={tripDataCy}
			/>
		</div>
	</div>
)

TravellerCardHead.propTypes = {
	name: PropTypes.string.isRequired,
	isOwn: PropTypes.bool,
	tripStart: PropTypes.string,
	tripEnd: PropTypes.string,
	daysInCity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	nameDataCy: PropTypes.string,
	tripDataCy: PropTypes.string,
}

export default TravellerCardHead
