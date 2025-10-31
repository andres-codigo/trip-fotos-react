import TravellersList from '@/components/travellers/TravellersList/TravellersList'

import travellersStyles from './travellers.module.scss'

const Travellers = () => {
	return (
		<main
			className={`mainContainer ${travellersStyles.travellersContainer}`}
			data-cy="main-container"
			data-cy-alt="travellers-main-container">
			<TravellersList />
		</main>
	)
}

export default Travellers
