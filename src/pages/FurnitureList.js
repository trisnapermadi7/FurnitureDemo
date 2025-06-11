import React from 'react';
import FurnitureCard from '../components/FurnitureCard';
import './FurnitureList.css';

const furnitures = [
  // Contoh data, ganti dengan data asli
  { name: 'Kabinet', image: '/Kabinet.png' },
  { name: 'Kasur', image: '/Kasur.png' },
  { name: 'Lemari', image: '/Lemari.png' },
  { name: 'Meja', image: '/Meja.png' },
  { name: 'Lamp', image: '/Lamp.png' },
  { name: 'Sofa', image: '/Sofa.png'},
];

function FurnitureList() {
  return (
    <div className="furniture-list-container">
      <header className="furniture-list-header">
        <h2>
          <span role="img" aria-label="furniture">🪑</span> Furniture Collection
        </h2>
        <p>Pilih furnitur favoritmu untuk dicoba di Augmented Reality!</p>
      </header>
      <div className="furniture-grid">
        {furnitures.map((item, index) => (
          <FurnitureCard key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}

export default FurnitureList;