import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

export function mountWithProviders(ui, store, { initialEntries = ['/'] } = {}) {
	return (
		<Provider store={store}>
			<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
		</Provider>
	)
}
