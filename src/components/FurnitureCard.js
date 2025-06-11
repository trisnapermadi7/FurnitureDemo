import React from 'react';
import './FurnitureCard.css';
import { Link } from 'react-router-dom';

function FurnitureCard({ item, index}) {
  return (
    <div className="furniture-card">
      <img src={item.image} alt={item.name} className="card-image" />
        <h3 className="card-title">{item.name}</h3>
        <Link to={`/arview/${index}`} className="btn-theme">
            Lihat Tampilan
        </Link>
    </div>
  );
}

export default FurnitureCard;