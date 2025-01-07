// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate
} from "react-router-dom";
import "./App.css";

import Navbar from "./components/navbar/navbar";
import Loading from "./pages/loading/loadingPage";
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
          {/* Global Toast Container */}
          <GlobalToast theme="dark" />

          {/*
            Put all routes + your conditional Navbar in a separate component 
            so we can use location-based logic.
          */}
          <AppRoutes />
        </Router>
      </UserProvider>
    </div>
  );
}

/**
 * AppRoutes handles all the route definitions AND 
 * conditionally renders the Navbar depending on the path.
 */
function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  // Track whether we've forced a redirect to "/" yet
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // On first render, if we are NOT already on "/", then redirect to "/"
    // so the user always sees the loading screen on a fresh load/refresh
    if (!hasRedirected && location.pathname !== "/") {
      navigate("/");
      setHasRedirected(true);
    }
  }, [location, navigate, hasRedirected]);

  return (
    <>
      <div className="content">
        <Routes>
          {/* Default route: "/" => shows LoadingPage */}
          <Route path="/" element={<Loading />} />

          {/* Main Home route with telegramId param */}
          <Route path="/home/:telegramId" element={<Home />} />

          {/* Leaderboard route with telegramId param */}
          <Route path="/leaderboard/:telegramId" element={<Leaderboard />} />

          {/* Quests route with telegramId param */}
          <Route path="/quests/:telegramId" element={<Quests />} />

          {/* Other pages without telegramId */}
          <Route path="/shop/:telegramId" element={<Shop />} />
          <Route path="/friends/:telegramId" element={<Friends />} />
        </Routes>
      </div>

      {/*
        Conditionally render the Navbar ONLY if we're NOT on "/"
        i.e. NOT on the loading screen
      */}
      {location.pathname !== "/" && <Navbar />}
    </>
  );
}

export default App;