import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>
          <span role="img" aria-label="sofa">🛋️</span> WebXR Furniture Viewer
        </h1>
        <p>Experience furniture in your space using <b>Augmented Reality</b></p>
      </header>
      <div className="home-content">
        <img
          src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80"
          alt="Modern Furniture"
          className="home-hero-img"
        />
        <Link to="/furniture" className="btn-theme">
          <span>View Furniture Collection</span>
        </Link>
      </div>
      <footer className="home-footer">
        <small>© {new Date().getFullYear()} Kelompok 1 ARVR</small>
      </footer>
    </div>
  );
}

export default HomePage;