import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/navbar/navbar";
import Home from "./pages/home/homePage";
import Store from "./pages/store/storePage";
import Leaderboard from "./pages/leaderboard/leaderboardPage";
import Quest from "./pages/quests/questsPage";
import Friends from "./pages/friends/friendsPage";

function App() {
  const [points, setPoints] = useState(0); // Step 1: Initialize points

  return (
    <div className="app-container">
      <Router>
        {/* Main content with scrolling */}
        <div className="content">
          <Routes>
            {/* Route for the Home page */}
            <Route path="/" element={<Home points={points} setPoints={setPoints} />} />
            {/* Route for the Store page */}
            <Route path="/store" element={<Store />} />
            {/* Route for the Leaderboard page */}
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* Route for the Quest page */}
            <Route path="/quest" element={<Quest />} />
            {/* Route for the Friends page */}
            <Route path="/friends" element={<Friends />} />
          </Routes>
        </div>
        {/* Fixed Navigation Bar */}
        <Navbar/>
      </Router>
    </div>
  );
}

export default App;