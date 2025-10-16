import { useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { GLOBAL } from '@/constants/global'
import { PATHS } from '@/constants/paths'

import { selectIsAuthenticated } from '@/store/slices/authenticationSlice'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import BaseDialog from '@/components/ui/dialog/BaseDialog'

const TravellersList = ({ initialError = false, isLoading = false }) => {
	const [error, setError] = useState(initialError)

	const isLoggedIn = useSelector(selectIsAuthenticated)

	const isTraveller = useSelector(
		(state) => state.travellers?.isTraveller || false,
	)

	const handleError = () => setError(null)

	return (
		<section
			className="pageSection travellerListContainer"
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
			<section>
				<BaseCard>
					<div className="controls">
						{isLoggedIn && !isTraveller && !isLoading && (
							<BaseButton
								isLink
								to={PATHS.REGISTER}>
								Register as a Traveller
							</BaseButton>
						)}
					</div>
				</BaseCard>
			</section>
		</section>
	)
}

TravellersList.propTypes = {
	initialError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
	isLoading: PropTypes.bool,
}

export default TravellersList
