import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'antd/dist/reset.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './i18n';

if (typeof global === 'undefined') {
    window.global = window;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
