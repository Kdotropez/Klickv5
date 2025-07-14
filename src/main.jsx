import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { cleanLocalStorage } from './utils/localStorage';
import './index.css';

// Nettoyer localStorage au démarrage
cleanLocalStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);