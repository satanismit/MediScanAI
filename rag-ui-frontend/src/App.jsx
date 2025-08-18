import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Analyze from './pages/Analyze.jsx';
import AboutContact from './pages/AboutContact.jsx';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/about" element={<AboutContact />} />
      </Routes>
    </>
  );
}

export default App;
