import { Analytics } from '@vercel/analytics/react'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '@/store/store'

import App from './App.jsx'

import '@/styles/global.scss'

createRoot(document.getElementById('app')).render(
	<StrictMode>
		<Provider store={store}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
			<Analytics />
		</Provider>
	</StrictMode>,
)
