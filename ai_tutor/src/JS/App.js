// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './home';
import Login from './login';
import PDF from './pdf_page';
import GamifyApp from './Gamify';

const App = () => {
  return (
    <Router>
      <div>
        {/* Define Routes */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/pdfpage" element={<PDF />} />
          <Route path="/gamify" element={<GamifyApp />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
