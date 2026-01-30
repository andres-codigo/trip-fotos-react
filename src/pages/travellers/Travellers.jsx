import { useState } from 'react'
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
		if (message) {
			// Clear state immediately to prevent persistence on refresh
			window.history.replaceState({}, document.title)
			return message
		}
		return null
	})

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
