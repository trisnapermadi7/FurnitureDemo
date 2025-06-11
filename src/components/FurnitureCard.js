import React from 'react';
import './FurnitureCard.css';

function FurnitureCard({ name, image, onClick }) {
  return (
    <div className="furniture-card">
      <img src={image} alt={name} className="card-image" />
      <div className="card-info">
        <h3 className="card-title">{name}</h3>
        <button className="card-button" onClick={onClick}>
          Lihat Tampilan
        </button>
      </div>
    </div>
  );
}

export default FurnitureCard;