import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

export function mountWithProviders(ui, store) {
	return (
		<Provider store={store}>
			<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
		</Provider>
	)
}
