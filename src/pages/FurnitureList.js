import React from 'react';
import { useNavigate } from 'react-router-dom';
import FurnitureCard from '../components/FurnitureCard';
import './FurnitureList.css';

const furnitureData = [
  {
    id: 0,
    name: "Kabinet",
    price: 299,
    image: "/Kabinet.png"
  },
  {
    id: 1,
    name: "Kasur",
    price: 399,
    image: "/Kasur.png"
  },
  {
    id: 2,
    name: "Lemari",
    price: 249,
    image: "/Lemari.png"
  },
  {
    id: 3,
    name: "Meja",
    price: 249,
    image: "/Meja.png"
  },
  {
    id: 4,
    name: "Lamp",
    price: 249,
    image: "/Lamp.png"
  },
  {
    id: 5,
    name: "Sofa",
    price: 249,
    image: "/Sofa.png"
  },
];

function FurnitureList() {
  const navigate = useNavigate();

  return (
    <div className="furniture-list-container">
      <header className="list-header">
        <h2>
          <span role="img" aria-label="furniture">🪑</span> Furniture Collection
        </h2>
        <p>Click on any item to view in Augmented Reality!</p>
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



