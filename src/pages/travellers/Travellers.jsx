import TravellersList from '@/components/travellers/TravellersList/TravellersList'

const Travellers = () => {
	return (
		<main
			className="mainContainer travellersPage"
			data-cy="main-container"
			data-cy-alt="travellers-main-container">
			<TravellersList />
		</main>
	)
}

export default Travellers
