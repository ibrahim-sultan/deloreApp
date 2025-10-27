import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ onMenuToggle, showMenuButton }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {showMenuButton && (
          <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
        
        <Link to="/" className="navbar-brand">
          <h2>Delore</h2>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
