import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { formatTripDays, getTripSummary } from '@/utils/tripDates'

// The separator is hidden from screen readers and the gap adds no text, so a hidden comma keeps the range and length apart when read out
// Older travellers have only a length, shown in the body colour so it does not read as a missing date
const TripSummary = ({
	tripStart,
	tripEnd,
	daysInCity,
	className,
	'data-cy': dataCy,
}) => {
	const summary = getTripSummary({ tripStart, tripEnd, daysInCity })
	if (!summary) return null

	const { range, days } = summary

	return (
		<p
			className={cn(
				'm-0 flex flex-wrap items-baseline gap-x-1.5 text-sm text-text',
				className,
			)}
			data-cy={dataCy}>
			<span className="sr-only">Trip: </span>
			{range ? (
				<>
					<span className="font-medium text-text">{range}</span>
					<span className="sr-only">, </span>
					<span
						className="text-text-muted"
						aria-hidden="true">
						·
					</span>
					<span className="text-text-muted">
						{formatTripDays(days)}
					</span>
				</>
			) : (
				<span>{formatTripDays(days)}</span>
			)}
		</p>
	)
}

TripSummary.propTypes = {
	tripStart: PropTypes.string,
	tripEnd: PropTypes.string,
	daysInCity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default TripSummary
