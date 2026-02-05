import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import TravellersList from '@/components/travellers/TravellersList/TravellersList'

import BaseCard from '@/components/ui/card/BaseCard'
import Alerts from '@/components/ui/alerts/Alerts'

import travellersStyles from './travellers.module.scss'

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
			className={`mainContainer ${travellersStyles.travellersContainer}`}
			data-cy="main-container"
			data-cy-alt="travellers-main-container">
			<section>
				<BaseCard>
					{alertMessage && (
						<Alerts
							message={alertMessage}
							onClose={() => setAlertMessage(null)}
						/>
					)}
					<TravellersList />
				</BaseCard>
			</section>
		</main>
	)
}

export default Travellers
