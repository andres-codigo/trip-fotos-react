import { useLocation } from 'react-router-dom'

const TestLocationDisplay = () => {
	const location = useLocation()
	return <div data-cy="location-display">{location.pathname}</div>
}

export default TestLocationDisplay
