import React from 'react';
import { useNavigate } from 'react-router-dom';
import FurnitureCard from '../components/FurnitureCard';
import './FurnitureList.css';
import furnitureData from '../data/furnitureData';

function FurnitureList() {
  const navigate = useNavigate();

  return (
    <div className="furniture-list-container">
      <header className="list-header">
        <h2>
          <span role="img" aria-label="furniture">🪑</span> Koleksi Furnitur
        </h2>
        <p>Klik pada salah satu item untuk melihatnya dalam Augmented Reality!</p>
      </header>
      <div className="furniture-grid">
        {furnitureData.map((item) => (
          <FurnitureCard
            key={item.id}
            name={item.name}
            price={item.price}
            image={item.image}
            onClick={() => navigate(`/ar/${item.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default FurnitureList;



