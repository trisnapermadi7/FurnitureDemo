// import React from 'react';
// import { Link } from 'react-router-dom';
// import './HomePage.css';

// function HomePage() {
//   return (
//     <div className="home-container">
//       <header className="home-header">
//         <h1>WebXR Furniture Viewer</h1>
//         <p>Experience furniture in your space using Augmented Reality</p>
//       </header>
//       <div className="home-content">
//         <Link to="/furniture" className="home-button">
//           View Furniture Collection
//         </Link>
//       </div>
//     </div>
//   );
// }

// export default HomePage;


// Coba

import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🛋️ WebXR Furniture Viewer</h1>
        <p>Experience furniture fits in your space using <b>Augmented Reality</b></p>
      </header>
      <div className="home-content">
        <Link to="/furniture" className="home-button">
          🚀 View Furniture Collection
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
