import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import RescueBoundary from './components/security/RescueBoundary'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <RescueBoundary>
                <App />
            </RescueBoundary>
        </HelmetProvider>
    </React.StrictMode>,
)
