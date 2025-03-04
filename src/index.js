import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// TODO: Future TailwindCSS conversion of styles
import './index.css';

import App from './App.js';
import '@/styles/global.scss';

createRoot(document.getElementById('app')).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
