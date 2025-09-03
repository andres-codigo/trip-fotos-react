import { inject } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

inject()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from '@/store/store'

import App from '@/app/App.jsx'

import '@/styles/global.scss'

createRoot(document.getElementById('app')).render(
	<StrictMode>
		<Provider store={store}>
			<App />
			<Analytics />
		</Provider>
	</StrictMode>,
)
