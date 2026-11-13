import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import TravellersList from '@/components/travellers/travellers-list/TravellersList'

import Alerts from '@/components/ui/alerts/Alerts'

const Travellers = () => {
	const location = useLocation()
	const [alertMessage, setAlertMessage] = useState(() => {
		// Initialise state from location if available
		const message = location.state?.alertMessage
		return message || null
	})

	useEffect(() => {
		// Clear history state after alert message is set to prevent persistence on refresh
		if (alertMessage) {
			window.history.replaceState({}, document.title)
		}
	}, [alertMessage])

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className={'mainContainer cardPage text-left'}
			data-cy="main-container"
			data-cy-alt="travellers-main-container">
			<title>{`Travellers · ${GLOBAL.SITE_NAME}`}</title>
			{/* No page card: the grid's own cards sit on the page background, capped at 1160px. A div, as the unlayered section rule would add padding */}
			<div
				className="mx-auto w-full max-w-290"
				data-cy="travellers-page">
				{alertMessage && (
					<Alerts
						message={alertMessage}
						onClose={() => setAlertMessage(null)}
					/>
				)}
				<TravellersList />
			</div>
		</main>
	)
}

export default Travellers
