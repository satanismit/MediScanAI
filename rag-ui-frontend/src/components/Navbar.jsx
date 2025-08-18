import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="nav-brand">MedAssist RAG</div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to="/analyze" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Analyze</NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>About & Contact</NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
