import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🛋️ WebXR Furniture Viewer</h1>
        <p>Rasakan bagaimana furnitur cocok di ruangan Anda menggunakan <b>Augmented Reality</b></p>
      </header>
      <div className="home-content">
        <Link to="/furniture" className="home-button">
          🚀 Lihat Koleksi Furnitur
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
