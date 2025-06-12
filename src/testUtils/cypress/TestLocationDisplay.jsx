import { useLocation } from 'react-router-dom'

/**
 * Displays current pathname for Cypress component test assertions.
 * Must be rendered within a <Router> context.
 */
const TestLocationDisplay = () => {
	const location = useLocation()
	return <div data-cy="location-display">{location.pathname}</div>
}

export default TestLocationDisplay
