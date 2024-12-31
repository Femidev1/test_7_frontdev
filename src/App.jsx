// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/navbar/navbar";
import Loading from "./pages/loadingpage/loadingPage";
import Home from "./pages/home/homePage";
import Shop from "./pages/store/shopPage";
import Leaderboard from "./pages/leaderboard/leaderboardPage";
import Quests from "./pages/quests/questsPage";
import Friends from "./pages/friends/friendsPage";
import { UserProvider } from "./contexts/UserContext";
import GlobalToast from "./components/GlobalToast";

function App() {
  return (
    <div className="app-container">
      <UserProvider>
        <Router>
          {/* Global Toast Container should be placed here */}
          <GlobalToast />

          <div className="content">
            <Routes>
              {/* 
                 Default route: "/" => shows LoadingPage 
                 which tries to fetch or figure out user,
                 then redirects to /home/:telegramId
              */}
              <Route path="/" element={<Loading />} />

              {/* Main Home route with telegramId param */}
              <Route path="/home/:telegramId" element={<Home />} />

              {/* Leaderboard route with telegramId param */}
              <Route path="/leaderboard/:telegramId" element={<Leaderboard />} />

              {/* Quests route with telegramId param */}
              <Route path="/quests/:telegramId" element={<Quests />} />

              {/* Other pages without telegramId */}
              <Route path="/shop/:telegramI" element={<Shop />} />
              <Route path="/friends/:telegramId" element={<Friends />} />
            </Routes>
          </div>
          
          <Navbar />
        </Router>
      </UserProvider>
    </div>
  );
}

export default App;