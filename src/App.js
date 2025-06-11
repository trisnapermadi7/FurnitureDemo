import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FurnitureList from './pages/FurnitureList';
import ARView from './components/ARView';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/furniture" element={<FurnitureList />} />
        <Route path="/ar/:id" element={<ARView />} />
      </Routes>
    </Router>
  );
}

export default App;