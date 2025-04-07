import { useState, useEffect } from 'react';

const useLoggedInTravellerName = () => {
	const [travellerName, setTravellerName] = useState('');

	useEffect(() => {
		const localStorageTravellerName = localStorage.getItem('userName');

		if (localStorageTravellerName && localStorageTravellerName.length > 0) {
			setTravellerName(localStorageTravellerName);

			// TODO convert from vue to react
			// this.$watch(
			// 	() => localStorage.getItem('userName'),
			// 	(newValue) => {
			// 		this.travellerName = newValue;
			// 	},
			// );
		}
	}, []);

	return [travellerName, setTravellerName];
};

export default useLoggedInTravellerName;
