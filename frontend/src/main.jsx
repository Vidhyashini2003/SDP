/**
 * main.jsx — Application Entry Point
 *
 * This is the first file that runs when the browser loads the frontend.
 * It mounts the React application into the HTML DOM and wraps it with global providers.
 *
 * What it does:
 *  1. Imports React and ReactDOM to render the virtual DOM
 *  2. Imports the root App component that contains all routes and layouts
 *  3. Imports the global CSS stylesheet (index.css)
 *  4. Uses ReactDOM.createRoot to attach the React app to the <div id="root"> in index.html
 *  5. Wraps everything in React.StrictMode — a development tool that:
 *       - Highlights potential problems (double-renders in dev mode to catch side effects)
 *       - Warns about deprecated API usage
 *  6. Renders <Toaster> from react-hot-toast globally so any component can call:
 *       toast.success('Done!') or toast.error('Failed!') without importing anything extra
 *
 * Note: This file has NO business logic — it only wires up the React app to the HTML page.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'             // Root component containing all routes
import './index.css'                    // Global CSS styles applied to the entire app
import { Toaster } from 'react-hot-toast' // Global toast notification provider

// Mount the React app to the <div id="root"> element in public/index.html
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* The full app with all routes, layouts, and context providers */}
        <App />
        {/* Global toast notification container — appears at top-right of the screen */}
        <Toaster position="top-right" />
    </React.StrictMode>,
)
