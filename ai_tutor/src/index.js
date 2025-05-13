import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from './JS/login.js';
import App from './JS/App.js';
import { Link } from 'react-router-dom';

const login = ReactDOM.createRoot(document.getElementById('login'));
login.render(
  <React.StrictMode>  
    {/* <Login /> */}
    <App />
  </React.StrictMode>
);


