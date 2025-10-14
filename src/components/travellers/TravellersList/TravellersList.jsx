import { useState } from 'react'

import BaseDialog from '@/components/ui/dialog/BaseDialog'

import BaseCard from '@/components/ui/card/BaseCard'

const TravellersList = () => {
	const [error, setError] = useState(false)

	const handleError = () => setError(null)

	return (
		<section className="pageSection travellerListContainer">
			<BaseDialog
				show={!!error}
				isError={!!error}
				title="An error occurred!"
				onClose={handleError}>
				<p>{error}</p>
			</BaseDialog>
			<section>
				<BaseCard>
					<div className="controls"></div>
				</BaseCard>
			</section>
		</section>
	)
}

export default TravellersList
