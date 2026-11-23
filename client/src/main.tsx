import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import store from './store/store.ts'

// Suppress benign ResizeObserver loop limit warnings from charts/layout observers
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('ResizeObserver') ||
    message.includes('ResizeObserver loop completed with undelivered notifications') ||
    message.includes('ResizeObserver loop limit exceeded')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  if (msg.includes('ResizeObserver')) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!, {
  onUncaughtError(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo?.componentStack);
  },
  onCaughtError(error, errorInfo) {
    console.error("Caught error:", error, errorInfo?.componentStack);
  },
}).render(
  <StrictMode>
    <Provider store={store}>
    <App />
    </Provider>
  </StrictMode>,
)
