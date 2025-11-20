// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 假設有 CSS 檔案
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);