import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './design-lab.css';

const root = document.getElementById('design-lab-root');

if (!root) {
    throw new Error('Missing #design-lab-root');
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
