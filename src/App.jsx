// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
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
// Import NotFound if you choose to implement it
// import NotFound from "./pages/NotFound";

function App() {
  return (
    <div className="app-container">
      <UserProvider>
        <Router>
          {/* Global Toast Container */}
          <GlobalToast theme="dark" />

          {/* Routes and Navbar */}
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

          {/* Shop and Friends routes with telegramId param */}
          <Route path="/shop/:telegramId" element={<Shop />} />
          <Route path="/friends/:telegramId" element={<Friends />} />

          {/* Optional: Redirect any unknown routes to 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
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