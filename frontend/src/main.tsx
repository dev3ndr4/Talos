import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Main Application entrypoint will go here */}
        <h1>Talos Business Architect</h1>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)
