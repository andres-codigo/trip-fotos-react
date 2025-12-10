import TravellersList from '@/components/travellers/TravellersList/TravellersList'

import BaseCard from '@/components/ui/card/BaseCard'

import styles from './travellers.module.scss'

const Travellers = () => {
	return (
		<main
			className={`mainContainer ${styles.travellersContainer}`}
			data-cy="main-container"
			data-cy-alt="travellers-main-container">
			<section>
				<BaseCard>
					<TravellersList />
				</BaseCard>
			</section>
		</main>
	)
}

export default Travellers
