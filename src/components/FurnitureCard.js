import React from 'react';
import './FurnitureCard.css';

function FurnitureCard({ name, price, image, onClick }) {
  return (
    <div className="furniture-card" onClick={onClick}>
      <img src={image} alt={name} className="card-image" />
      <div className="card-info">
        <h3 className="card-title">{name}</h3>
        <p className="card-price">${price}</p>
      </div>
    </div>
  );
}

export default FurnitureCard;