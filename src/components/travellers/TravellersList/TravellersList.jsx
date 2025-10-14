import { useState } from 'react'
import PropTypes from 'prop-types'

import { GLOBAL } from '@/constants/global'

import BaseDialog from '@/components/ui/dialog/BaseDialog'

import BaseCard from '@/components/ui/card/BaseCard'

const TravellersList = ({ initialError = false }) => {
	const [error, setError] = useState(initialError)

	const handleError = () => setError(null)

	return (
		<section className="pageSection travellerListContainer">
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
			<section>
				<BaseCard>
					<div className="controls"></div>
				</BaseCard>
			</section>
		</section>
	)
}

TravellersList.propTypes = {
	initialError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default TravellersList
