// Global shim for process.env to ensure Gemini SDK doesn't crash in browser environments
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);